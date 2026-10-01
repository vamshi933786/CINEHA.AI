import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CaptionStudioWorkspace } from "../components/captions/CaptionStudioWorkspace";
import { CaptionCueWorkspace } from "../components/captions/CaptionCueWorkspace";
import { api } from "../lib/api";
import { CAPTION_STUDIO_LANGUAGES } from "../types/caption";
import type {
  CaptionRenderResponse,
  CaptionCue,
  TranscriptionResponse,
  TranscriptionResult,
} from "../types/caption";

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
    generateCaptions: vi.fn(),
    renderCaptionedVideo: vi.fn(),
    getRenderDownloadUrl: vi.fn((renderId: string) => `/api/v1/captions/render/${renderId}/download`),
  },
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-video");
global.URL.revokeObjectURL = vi.fn();

const mockTeluguTranscriptionResult: TranscriptionResult = {
  language: "Telugu",
  language_code: "te",
  is_transliteration: false,
  script_type: "Telugu",
  full_text: "హలో అందరికీ! సినిమాటిక్ వీడియో క్రియేట్ చేద్దాం.",
  segments: [
    {
      id: "seg_0",
      text: "హలో అందరికీ!",
      start_time: 0.0,
      end_time: 2.0,
      words: [
        { text: "హలో", start_time: 0.0, end_time: 0.8 },
        { text: "అందరికీ!", start_time: 0.8, end_time: 2.0 },
      ],
      speaker: "Speaker 1",
      confidence: 0.95,
    },
    {
      id: "seg_1",
      text: "సినిమాటిక్ వీడియో క్రియేట్ చేద్దాం.",
      start_time: 2.0,
      end_time: 4.5,
      words: [
        { text: "సినిమాటిక్", start_time: 2.0, end_time: 2.8 },
        { text: "వీడియో", start_time: 2.8, end_time: 3.5 },
        { text: "క్రియేట్", start_time: 3.5, end_time: 4.0 },
        { text: "చేద్దాం.", start_time: 4.0, end_time: 4.5 },
      ],
      speaker: "Speaker 1",
      confidence: 0.92,
    },
  ],
  duration_seconds: 4.5,
  provider_name: "whisper_stt",
  is_production_provider: true,
};

const mockTranscriptionResponse: TranscriptionResponse = {
  project_id: "proj_pipeline_test",
  caption_source: {
    source_type: "video_upload",
    filename: "cinematic_intro.mp4",
    file_size_bytes: 4 * 1024 * 1024,
    mime_type: "video/mp4",
    duration_seconds: 4.5,
  },
  transcription: mockTeluguTranscriptionResult,
};

const mockRenderResponse: CaptionRenderResponse = {
  result: {
    render_id: "render_abc_123",
    status: "completed",
    output_filename: "cinehai_captioned_render_abc_123.mp4",
    mime_type: "video/mp4",
    file_size: 1024 * 512,
    duration: 4.5,
    caption_language: "Telugu",
    caption_count: 2,
    download_url: "/api/v1/captions/render/render_abc_123/download",
    video_width: 1080,
    video_height: 1920,
    preset_used: "clean_pop",
  },
  notice: "Captioned video rendered successfully via FFmpeg",
};

describe("Caption Studio — Direct Multilingual Caption Rendering Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCaptionProviders).mockResolvedValue({
      default_provider: "mock",
      is_production_configured: false,
      providers: [
        {
          id: "mock",
          name: "Mock Provider",
          is_production: false,
          is_configured: true,
          description: "Mock provider for testing",
        },
      ],
    });
  });

  describe("Multilingual Language Selector (Section 1)", () => {
    it("defines exactly the 3 supported languages: English, Telugu, Tanglish", () => {
      expect(CAPTION_STUDIO_LANGUAGES).toHaveLength(3);
      const names = CAPTION_STUDIO_LANGUAGES.map((l) => l.name);
      expect(names).toEqual(["English", "Telugu", "Tanglish"]);

      // Verify Hindi is NOT in the list
      const hindi = (CAPTION_STUDIO_LANGUAGES as any[]).find(
        (l) => l.id === "hi" || l.label.toLowerCase().includes("hindi")
      );
      expect(hindi).toBeUndefined();
    });

    it("renders the 3 language options with native labels and script hints", () => {
      render(<CaptionStudioWorkspace />);

      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText(/Telugu \(తెలుగు\)/i)).toBeInTheDocument();
      expect(screen.getByText("Tanglish")).toBeInTheDocument();
      expect(
        screen.getByText("Conversational language written phonetically in Latin characters")
      ).toBeInTheDocument();

      // Ensure Hindi is not shown anywhere
      expect(screen.queryByText(/Hindi/i)).not.toBeInTheDocument();
    });

    it("allows switching language between English, Telugu, and Tanglish", () => {
      render(<CaptionStudioWorkspace />);

      const teluguBtn = screen.getByRole("button", { name: /^Telugu/i });
      fireEvent.click(teluguBtn);
      expect(teluguBtn).toHaveClass("border-cyan-500/50");

      const tanglishBtn = screen.getByRole("button", { name: /^Tanglish/i });
      fireEvent.click(tanglishBtn);
      expect(tanglishBtn).toHaveClass("border-cyan-500/50");
    });
  });

  describe("End-to-End Direct Caption Generation Flow", () => {
    it("executes complete pipeline: upload -> choose language -> generate captions", async () => {
      vi.mocked(api.transcribeVideo).mockResolvedValueOnce(mockTranscriptionResponse);

      render(<CaptionStudioWorkspace />);

      // 1. Simulate video upload
      const file = new File(["dummy video data"], "cinematic_intro.mp4", { type: "video/mp4" });
      const input = screen.getByLabelText("Upload video file");
      fireEvent.change(input, { target: { files: [file] } });

      // Video preview should appear
      await waitFor(() => {
        expect(screen.getByText("cinematic_intro.mp4")).toBeInTheDocument();
      });

      // 2. Select Telugu language
      const teluguBtn = screen.getByRole("button", { name: /^Telugu/i });
      fireEvent.click(teluguBtn);

      // 3. Click 'Generate Captions'
      const generateBtn = screen.getByTestId("generate-captions-button");
      fireEvent.click(generateBtn);

      // Verify API was called with the file and language
      await waitFor(() => {
        expect(api.transcribeVideo).toHaveBeenCalledWith(
          expect.any(File),
          "Telugu",
          undefined,
          expect.any(String)
        );
      });

      // 4. Caption cue workspace should now be displayed
      await waitFor(() => {
        expect(screen.getByText(/Export Captioned MP4 Video/i)).toBeInTheDocument();
      });
    });
  });

  describe("CaptionCueWorkspace — Styling, Overlay & FFmpeg Render", () => {
    const testCues: CaptionCue[] = [
      {
        id: "cue_0",
        text: "హలో అందరికీ!",
        start_time: 0.0,
        end_time: 2.0,
        duration: 2.0,
        language: "Telugu",
        language_code: "te",
        lines: ["హలో అందరికీ!"],
        source_segment_ids: ["seg_0"],
        manually_edited: false,
        words: [
          { text: "హలో", start_time: 0.0, end_time: 0.8 },
          { text: "అందరికీ!", start_time: 0.8, end_time: 2.0 },
        ],
      },
      {
        id: "cue_1",
        text: "సినిమాటిక్ క్రియేషన్.",
        start_time: 2.0,
        end_time: 4.0,
        duration: 2.0,
        language: "Telugu",
        language_code: "te",
        lines: ["సినిమాటిక్ క్రియేషన్."],
        source_segment_ids: ["seg_1"],
        manually_edited: false,
        words: [
          { text: "సినిమాటిక్", start_time: 2.0, end_time: 3.0 },
          { text: "క్రియేషన్.", start_time: 3.0, end_time: 4.0 },
        ],
      },
    ];

    it("renders video preview with caption overlay and styling presets", () => {
      render(
        <CaptionCueWorkspace
          activeTranscription={mockTeluguTranscriptionResult}
          originalTranscription={mockTeluguTranscriptionResult}
          isProcessedActive={false}
          initialCues={testCues}
          videoPreviewUrl="blob:http://localhost/mock-video"
          selectedLanguage="te"
        />
      );

      // Verify video preview element is in the document
      expect(screen.getByTestId("caption-video-element")).toBeInTheDocument();

      // Switch to Motion mode to inspect motion styling presets
      const motionBtn = screen.getByRole("button", { name: "Motion" });
      fireEvent.click(motionBtn);

      // Verify styling presets
      expect(screen.getByRole("button", { name: /Pop/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cinema/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clean/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Bold Bounce/i })).toBeInTheDocument();

      // Verify render button is present
      expect(
        screen.getByRole("button", { name: /Render Captioned Video/i })
      ).toBeInTheDocument();
    });

    it("triggers FFmpeg render and displays download link upon completion", async () => {
      vi.mocked(api.renderCaptionedVideo).mockResolvedValueOnce(mockRenderResponse);

      const dummyFile = new File(["video"], "test.mp4", { type: "video/mp4" });

      render(
        <CaptionCueWorkspace
          activeTranscription={mockTeluguTranscriptionResult}
          originalTranscription={mockTeluguTranscriptionResult}
          isProcessedActive={false}
          initialCues={testCues}
          videoPreviewUrl="blob:http://localhost/mock-video"
          selectedFile={dummyFile}
          selectedLanguage="te"
        />
      );

      const renderBtn = screen.getByRole("button", { name: /Render Captioned Video/i });
      fireEvent.click(renderBtn);

      // Verify API was called with the file and cues
      await waitFor(() => {
        expect(api.renderCaptionedVideo).toHaveBeenCalledWith(
          dummyFile,
          testCues,
          "te",
          "clean_pop",
          expect.objectContaining({
            preset: "clean_pop",
          })
        );
      });

      // Verify success state and download button
      await waitFor(() => {
        expect(screen.getByTestId("render-ready-banner")).toBeInTheDocument();
        const downloadBtn = screen.getByRole("button", { name: /Download Captioned Video/i });
        expect(downloadBtn).toBeInTheDocument();
      });
    });

    it("handles render errors gracefully with user-friendly notification", async () => {
      vi.mocked(api.renderCaptionedVideo).mockRejectedValueOnce(
        new Error("FFmpeg encoding failed: subtitle parsing error")
      );

      const dummyFile = new File(["video"], "test.mp4", { type: "video/mp4" });

      render(
        <CaptionCueWorkspace
          activeTranscription={mockTeluguTranscriptionResult}
          originalTranscription={mockTeluguTranscriptionResult}
          isProcessedActive={false}
          initialCues={testCues}
          videoPreviewUrl="blob:http://localhost/mock-video"
          selectedFile={dummyFile}
          selectedLanguage="te"
        />
      );

      const renderBtn = screen.getByRole("button", { name: /Render Captioned Video/i });
      fireEvent.click(renderBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/FFmpeg encoding failed: subtitle parsing error/i)
        ).toBeInTheDocument();
      });
    });
  });
});
