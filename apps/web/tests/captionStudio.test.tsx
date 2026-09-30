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
      expect(api.transcribeVideo).toHaveBeenCalledWith(validFile, "English", undefined);
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
});
