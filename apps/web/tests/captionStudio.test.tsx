import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CaptionStudioPage from "../app/captions/page";
import { CaptionStudioWorkspace } from "../components/captions/CaptionStudioWorkspace";
import { VideoDropzone } from "../components/captions/VideoDropzone";
import { TranscriptEditor } from "../components/captions/TranscriptEditor";
import { api } from "../lib/api";
import type { TranscriptionResponse, TranscriptionResult } from "../types/caption";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

// Mock API client
vi.mock("../lib/api", () => ({
  api: {
    transcribeVideo: vi.fn(),
    getCaptionLanguages: vi.fn(),
    getCaptionProviders: vi.fn(),
    processLanguage: vi.fn(),
    generateCaptionCues: vi.fn(),
  },
}));

// Mock URL object methods for jsdom
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-video");
global.URL.revokeObjectURL = vi.fn();

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockTranscriptionResponse: TranscriptionResponse = {
  project_id: "proj_test_12345",
  caption_source: {
    source_type: "video_upload",
    filename: "cinematic_tutorial.mp4",
    file_size_bytes: 4 * 1024 * 1024,
    mime_type: "video/mp4",
    duration_seconds: 18.5,
    metadata: { container: "mp4" },
  },
  transcription: {
    language: "English",
    language_code: "en",
    is_transliteration: false,
    script_type: "Latin",
    full_text:
      "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.\n\n60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
    segments: [
      {
        id: "seg_0",
        text: "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
        start_time: 0.0,
        end_time: 3.4,
        words: [
          { text: "Stop", start_time: 0.0, end_time: 0.3 },
          { text: "shooting", start_time: 0.3, end_time: 0.6 },
          { text: "at", start_time: 0.6, end_time: 0.8 },
          { text: "60fps!", start_time: 0.8, end_time: 1.2 },
        ],
        speaker: "Speaker 1",
        confidence: 0.94,
      },
      {
        id: "seg_1",
        text: "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
        start_time: 3.6,
        end_time: 7.2,
        words: [
          { text: "60fps", start_time: 3.6, end_time: 4.0 },
          { text: "creates", start_time: 4.0, end_time: 4.4 },
        ],
        speaker: "Speaker 1",
        confidence: 0.91,
      },
    ],
    duration_seconds: 7.2,
    provider_name: "heuristic_dev_transcription",
    is_production_provider: false,
    confidence: 0.92,
    metadata: {
      is_simulated: true,
      note: "Development Transcription Mode — production speech-to-text provider is not configured.",
    },
  },
  notice: "Development Transcription Mode — production speech-to-text provider is not configured.",
};

describe("Caption Studio — Video Input & Transcription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCaptionProviders).mockResolvedValue({
      default_provider: "mock",
      is_production_configured: false,
      providers: [
        {
          id: "mock",
          name: "Development Mock",
          is_production: false,
          is_configured: true,
          description: "Offline screenplay heuristics",
        },
        {
          id: "production",
          name: "OpenAI Whisper",
          is_production: true,
          is_configured: false,
          description: "Production neural speech recognition",
        },
      ],
    });
  });

  it("renders CaptionStudioPage with header, 100 MB badge, and dropzone", () => {
    render(<CaptionStudioPage />);

    expect(screen.getByRole("heading", { name: "Caption Studio", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/100 MB/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Drag and drop your video here/i)).toBeInTheDocument();
  });

  it("validates against files exceeding the 100 MB limit in VideoDropzone", () => {
    const handleSelected = vi.fn();
    render(
      <VideoDropzone
        selectedFile={null}
        videoPreviewUrl={null}
        videoMetadata={null}
        onVideoSelected={handleSelected}
      />
    );

    const fileInput = screen.getByLabelText("Upload video file");
    // 101 MB file
    const oversizedFile = new File([new ArrayBuffer(100)], "huge_video.mp4", {
      type: "video/mp4",
    });
    Object.defineProperty(oversizedFile, "size", { value: 101 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByText(/exceeds the 100 MB limit/i)).toBeInTheDocument();
    expect(handleSelected).not.toHaveBeenCalled();
  });

  it("validates against unsupported file extensions", () => {
    const handleSelected = vi.fn();
    render(
      <VideoDropzone
        selectedFile={null}
        videoPreviewUrl={null}
        videoMetadata={null}
        onVideoSelected={handleSelected}
      />
    );

    const fileInput = screen.getByLabelText("Upload video file");
    const badFile = new File(["dummy text"], "notes.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(screen.getByText(/Unsupported file format/i)).toBeInTheDocument();
    expect(handleSelected).not.toHaveBeenCalled();
  });

  it("allows selecting a valid MP4 video and displays metadata and preview", () => {
    const validFile = new File([new ArrayBuffer(5000)], "cinematic_intro.mp4", {
      type: "video/mp4",
    });

    render(<CaptionStudioWorkspace />);

    const fileInput = screen.getByLabelText("Upload video file");
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.getByText("cinematic_intro.mp4")).toBeInTheDocument();
    expect(screen.getByText(/Ready for Speech Ingestion/i)).toBeInTheDocument();
  });

  it("allows switching target languages including Tanglish with Romanized indicator", () => {
    render(<CaptionStudioWorkspace />);

    // Click on Tanglish button
    const tanglishBtn = screen.getByRole("button", { name: /Tanglish/i });
    fireEvent.click(tanglishBtn);

    expect(screen.getByText("Romanized Script (te-Latn)")).toBeInTheDocument();

    // Click on Telugu button
    const teluguBtn = screen.getByRole("button", { name: /Telugu/i });
    fireEvent.click(teluguBtn);

    expect(screen.queryByText("Romanized Script (te-Latn)")).not.toBeInTheDocument();
  });

  it("submits video for transcription, displays loading state, and renders transcript with timestamps", async () => {
    vi.mocked(api.transcribeVideo).mockResolvedValue(mockTranscriptionResponse);

    render(<CaptionStudioWorkspace />);

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    const fileInput = screen.getByLabelText("Upload video file");
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Click Transcribe button
    const transcribeBtn = screen.getByRole("button", { name: /Transcribe Video Speech/i });
    expect(transcribeBtn).toBeEnabled();
    fireEvent.click(transcribeBtn);

    // Verify loading indicator is displayed
    expect(screen.getByText(/Extracting Audio & Transcribing.../i)).toBeInTheDocument();

    // Await transcription results
    await waitFor(() => {
      expect(api.transcribeVideo).toHaveBeenCalledWith(validFile, "English", undefined, "mock");
      expect(screen.getByText("Interactive Transcript Editor")).toBeInTheDocument();
      expect(screen.getByText("Development Transcription Mode")).toBeInTheDocument();
    });

    // Check segment rendering with immutable timestamps
    expect(screen.getByText(/00:00.000 → 00:03.400/i)).toBeInTheDocument();
    expect(screen.getByText(/00:03.600 → 00:07.200/i)).toBeInTheDocument();
  });

  it("allows creator to edit segment transcript text while preserving timing bounds", async () => {
    vi.mocked(api.transcribeVideo).mockResolvedValue(mockTranscriptionResponse);

    render(<CaptionStudioWorkspace />);

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Transcribe Video Speech/i }));

    await waitFor(() => {
      expect(screen.getByText("Interactive Transcript Editor")).toBeInTheDocument();
    });

    // Edit segment 1 text
    const segTextarea = screen.getByLabelText("Edit segment 1 transcript text") as HTMLTextAreaElement;
    expect(segTextarea.value).toContain("Stop shooting at 60fps!");

    fireEvent.change(segTextarea, {
      target: { value: "Never film at 60fps on mobile! Here is the secret cinema setting." },
    });

    expect(segTextarea.value).toBe(
      "Never film at 60fps on mobile! Here is the secret cinema setting."
    );

    // Verify timestamp was preserved
    expect(screen.getByText(/00:00.000 → 00:03.400/i)).toBeInTheDocument();
  });

  it("handles word-level timestamp inspection toggle in TranscriptEditor", () => {
    const mockUpdate = vi.fn();
    render(
      <TranscriptEditor
        transcription={mockTranscriptionResponse.transcription}
        onUpdateTranscription={mockUpdate}
      />
    );

    // Expand word timings for segment 0
    const wordsBtn = screen.getByRole("button", { name: /4 words/i });
    fireEvent.click(wordsBtn);

    expect(screen.getByText("Word Timings (Micro-Cues)")).toBeInTheDocument();
    expect(screen.getByText("0.00s")).toBeInTheDocument();
    expect(screen.getByText("0.80s")).toBeInTheDocument();
  });

  it("gracefully displays error banner when transcription API fails", async () => {
    vi.mocked(api.transcribeVideo).mockRejectedValue(
      new Error("Uploaded video container header is corrupted or unreadable.")
    );

    render(<CaptionStudioWorkspace />);

    const file = new File([new ArrayBuffer(100)], "bad_video.mp4", { type: "video/mp4" });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: /Transcribe Video Speech/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Uploaded video container header is corrupted or unreadable/i)
      ).toBeInTheDocument();
    });
  });

  it("displays provider selection and handles switching between Development Mock and OpenAI Whisper", async () => {
    render(<CaptionStudioWorkspace />);

    // Verify both providers rendered
    expect(screen.getByText("Development Mock")).toBeInTheDocument();
    expect(screen.getByText("OpenAI Whisper")).toBeInTheDocument();

    // Click OpenAI Whisper
    const whisperBtn = screen.getByRole("button", { name: /OpenAI Whisper/i });
    fireEvent.click(whisperBtn);

    // Should display missing config alert since is_production_configured is false
    expect(
      screen.getByText(
        /Production transcription is not configured. Configure the transcription provider credentials or switch to Development Mode./i
      )
    ).toBeInTheDocument();

    // Switch back to Development Mock
    const mockBtn = screen.getByRole("button", { name: /Development Mock/i });
    fireEvent.click(mockBtn);

    // Advisory warning should be gone
    expect(
      screen.queryByText(
        /Production transcription is not configured. Configure the transcription provider credentials or switch to Development Mode./i
      )
    ).not.toBeInTheDocument();
  });

  it("prevents transcription and displays alert when unconfigured production provider is selected", async () => {
    render(<CaptionStudioWorkspace />);

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });

    // Select OpenAI Whisper
    const whisperBtn = screen.getByRole("button", { name: /OpenAI Whisper/i });
    fireEvent.click(whisperBtn);

    // Click Transcribe
    const transcribeBtn = screen.getByRole("button", { name: /Transcribe Video Speech/i });
    fireEvent.click(transcribeBtn);

    // Error banner should be displayed and api.transcribeVideo should NOT be called
    expect(
      screen.getAllByText(
        /Production transcription is not configured. Configure the transcription provider credentials or switch to Development Mode./i
      ).length
    ).toBeGreaterThan(0);
    expect(api.transcribeVideo).not.toHaveBeenCalled();
  });

  it("displays Local Whisper with Available status badge and transcribes via local_whisper", async () => {
    vi.mocked(api.getCaptionProviders).mockResolvedValue({
      default_provider: "local_whisper",
      is_production_configured: false,
      is_local_whisper_configured: true,
      providers: [
        {
          id: "local_whisper",
          name: "Local Whisper",
          is_production: true,
          is_configured: true,
          description: "Free on-device faster-whisper",
        },
        {
          id: "production",
          name: "OpenAI Whisper",
          is_production: true,
          is_configured: false,
          description: "Cloud OpenAI Whisper",
        },
        {
          id: "mock",
          name: "Development Mock",
          is_production: false,
          is_configured: true,
          description: "Simulated mock",
        },
      ],
    });

    const localWhisperResponse: TranscriptionResponse = {
      ...mockTranscriptionResponse,
      notice: null,
      transcription: {
        ...mockTranscriptionResponse.transcription,
        provider_name: "local_whisper",
        is_production_provider: true,
      },
    };
    vi.mocked(api.transcribeVideo).mockResolvedValue(localWhisperResponse);

    render(<CaptionStudioWorkspace />);

    // Verify status badges
    expect(await screen.findByText(/Local Whisper — Available/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI Whisper — Not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/Development Mock — Development only/i)).toBeInTheDocument();

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });

    // Select Local Whisper
    const localBtn = screen.getByRole("button", { name: /Local Whisper/i });
    fireEvent.click(localBtn);

    const transcribeBtn = screen.getByRole("button", { name: /Transcribe Video Speech/i });
    fireEvent.click(transcribeBtn);

    await waitFor(() => {
      expect(api.transcribeVideo).toHaveBeenCalledWith(
        expect.any(File),
        "English",
        undefined,
        "local_whisper"
      );
    });

    // Verify production status banner without mock warning
    expect(await screen.findByText(/Production Speech-to-Text Active/i)).toBeInTheDocument();
    expect(screen.queryByText(/Development Transcription Mode/i)).not.toBeInTheDocument();
  });

  it("successfully transcribes with production Whisper provider and displays production status banner", async () => {
    vi.mocked(api.getCaptionProviders).mockResolvedValue({
      default_provider: "production",
      is_production_configured: true,
      providers: [
        {
          id: "mock",
          name: "Development Mock",
          is_production: false,
          is_configured: true,
          description: "Offline screenplay heuristics",
        },
        {
          id: "production",
          name: "OpenAI Whisper",
          is_production: true,
          is_configured: true,
          description: "Production neural speech recognition",
        },
      ],
    });

    const productionResponse: TranscriptionResponse = {
      project_id: "proj_prod_123",
      caption_source: {
        source_type: "video_upload",
        filename: "prod_video.mp4",
        file_size_bytes: 20000,
        mime_type: "video/mp4",
        duration_seconds: 12.0,
      },
      transcription: {
        language: "English",
        language_code: "en",
        is_transliteration: false,
        script_type: "Latin",
        full_text: "Welcome to CINEHA AI production speech recognition.",
        segments: [
          {
            id: "seg_0",
            text: "Welcome to CINEHA AI production speech recognition.",
            start_time: 0.0,
            end_time: 3.5,
            words: [
              { text: "Welcome", start_time: 0.0, end_time: 0.5 },
              { text: "to", start_time: 0.5, end_time: 0.7 },
              { text: "CINEHA", start_time: 0.7, end_time: 1.2 },
            ],
            confidence: 0.97,
          },
        ],
        duration_seconds: 3.5,
        provider_name: "openai_whisper_api",
        is_production_provider: true,
        confidence: 0.97,
        metadata: {
          model: "whisper-1",
          word_timings_available: true,
        },
      },
      notice: null,
    };

    vi.mocked(api.transcribeVideo).mockResolvedValue(productionResponse);

    render(<CaptionStudioWorkspace />);

    // Wait for providers to load and confirm configured state
    expect(await screen.findByText("Production Key Configured")).toBeInTheDocument();

    const validFile = new File([new ArrayBuffer(5000)], "prod_video.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });

    // Select OpenAI Whisper
    const whisperBtn = screen.getByRole("button", { name: /OpenAI Whisper/i });
    fireEvent.click(whisperBtn);

    const transcribeBtn = screen.getByRole("button", { name: /Transcribe Video Speech/i });
    fireEvent.click(transcribeBtn);

    await waitFor(() => {
      expect(api.transcribeVideo).toHaveBeenCalledWith(validFile, "English", undefined, "production");
      expect(screen.getByText("Production Speech-to-Text Active")).toBeInTheDocument();
      expect(screen.getByText("openai_whisper_api")).toBeInTheDocument();
      // Development warning must NOT be shown
      expect(screen.queryByText("Development Transcription Mode")).not.toBeInTheDocument();
    });
  });

  it("displays 'Word timings available' badge when word timings are present in TranscriptEditor", () => {
    const mockUpdate = vi.fn();
    render(
      <TranscriptEditor
        transcription={mockTranscriptionResponse.transcription}
        onUpdateTranscription={mockUpdate}
      />
    );

    expect(screen.getByText("Word timings available")).toBeInTheDocument();
    expect(screen.queryByText("Segment timings only")).not.toBeInTheDocument();
  });

  it("displays 'Segment timings only' badge when word timings are absent in TranscriptEditor", () => {
    const mockUpdate = vi.fn();
    const segmentOnlyTranscription: TranscriptionResult = {
      ...mockTranscriptionResponse.transcription,
      segments: [
        {
          id: "seg_0",
          text: "Audio transcribed with segment timestamps only.",
          start_time: 0.0,
          end_time: 4.0,
          words: [],
        },
      ],
      metadata: {
        word_timings_available: false,
      },
    };

    render(
      <TranscriptEditor
        transcription={segmentOnlyTranscription}
        onUpdateTranscription={mockUpdate}
      />
    );

    expect(screen.getByText("Segment timings only")).toBeInTheDocument();
    expect(screen.queryByText("Word timings available")).not.toBeInTheDocument();
  });

  it("integrates LanguageProcessingSection in workspace and allows applying translated captions", async () => {
    vi.mocked(api.transcribeVideo).mockResolvedValue(mockTranscriptionResponse);
    vi.mocked(api.processLanguage).mockResolvedValue({
      result: {
        source_language: "English",
        target_language: "Telugu",
        target_language_code: "te",
        is_transliteration: false,
        script_type: "Telugu",
        processing_mode: "translation",
        segments: [
          {
            id: "seg_0",
            original_text: "Stop shooting at 60fps!",
            text: "60fps లో షూట్ చేయడం ఆపండి!",
            start_time: 0.0,
            end_time: 3.4,
            words: [],
          },
          {
            id: "seg_1",
            original_text: "60fps creates that harsh effect.",
            text: "60fps కఠినమైన ఎఫెక్ట్‌ను తెస్తుంది.",
            start_time: 3.6,
            end_time: 7.2,
            words: [],
          },
        ],
        full_text: "60fps లో షూట్ చేయడం ఆపండి!\n\n60fps కఠినమైన ఎఫెక్ట్‌ను తెస్తుంది.",
        original_full_text: mockTranscriptionResponse.transcription.full_text,
        provider_name: "development_mock_language_processor",
        is_production_provider: false,
        word_timings_available: false,
        notice: "Development Language Processing Mode",
      },
      notice: "Development Language Processing Mode",
    });

    render(<CaptionStudioWorkspace />);

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Transcribe Video Speech/i }));

    await waitFor(() => {
      expect(
        screen.getByText("5. Multi-Lingual Translation & Transliteration")
      ).toBeInTheDocument();
    });

    // Translate to Telugu
    const translateBtn = screen.getByRole("button", { name: /Translate to Telugu/i });
    fireEvent.click(translateBtn);

    await waitFor(() => {
      expect(screen.getByText("Apply as Active Captions")).toBeInTheDocument();
    });

    // Apply
    fireEvent.click(screen.getByRole("button", { name: /Apply as Active Captions/i }));

    // Revert button should now be available
    expect(
      screen.getByRole("button", { name: /Revert to Original \(English\)/i })
    ).toBeInTheDocument();

    // Editor should now show the translated Telugu text
    const segTextarea = screen.getByLabelText(
      "Edit segment 1 transcript text"
    ) as HTMLTextAreaElement;
    expect(segTextarea.value).toBe("60fps లో షూట్ చేయడం ఆపండి!");

    // Revert back to original
    fireEvent.click(
      screen.getByRole("button", { name: /Revert to Original \(English\)/i })
    );
    expect(segTextarea.value).toContain("Stop shooting at 60fps!");
  });

  it("integrates CaptionCueWorkspace in workspace and triggers caption cue generation", async () => {
    vi.mocked(api.transcribeVideo).mockResolvedValue(mockTranscriptionResponse);
    vi.mocked(api.generateCaptionCues).mockResolvedValue({
      result: {
        cues: [
          {
            id: "cue_0",
            text: "Stop shooting at 60fps!",
            start_time: 0.0,
            end_time: 3.5,
            duration: 3.5,
            language: "English",
            language_code: "en",
            lines: ["Stop shooting at 60fps!"],
            source_segment_ids: ["seg_0"],
            manually_edited: false,
          },
        ],
        cue_count: 1,
        total_caption_duration: 3.5,
        timing_granularity: "word",
        settings_used: {
          max_characters_per_line: 36,
          max_lines: 2,
          minimum_cue_duration: 0.8,
          maximum_cue_duration: 4.0,
          preferred_words_per_cue: 6,
          gap_threshold: 0.5,
        },
        caption_source_type: "original",
        warnings: [],
        metadata: {},
      },
    });

    render(<CaptionStudioWorkspace />);

    const validFile = new File([new ArrayBuffer(5000)], "sample_reel.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(screen.getByLabelText("Upload video file"), {
      target: { files: [validFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Transcribe Video Speech/i }));

    await waitFor(() => {
      expect(
        screen.getByText("5. Caption Cue Generation & Plain Video Preview")
      ).toBeInTheDocument();
    });

    // Trigger generate captions inside the workspace
    const generateBtn = screen.getByRole("button", {
      name: /Generate synchronized captions/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(api.generateCaptionCues).toHaveBeenCalledTimes(1);
      expect(screen.getByText("1 Cue")).toBeInTheDocument();
    });
  });
});

