import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CaptionCueWorkspace } from "../components/captions/CaptionCueWorkspace";
import { api } from "../lib/api";
import type {
  TranscriptionResult,
  CaptionCueGenerationResponse,
} from "../types/caption";

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    generateCaptionCues: vi.fn(),
  },
}));

const mockEnglishTranscription: TranscriptionResult = {
  language: "English",
  language_code: "en",
  is_transliteration: false,
  script_type: "Latin",
  full_text: "Stop shooting at 60fps! Here is the cinematic camera setting.",
  segments: [
    {
      id: "seg_0",
      text: "Stop shooting at 60fps!",
      start_time: 0.0,
      end_time: 2.0,
      words: [
        {"text": "Stop", "start_time": 0.0, "end_time": 0.5},
        {"text": "shooting", "start_time": 0.5, "end_time": 1.0},
        {"text": "at", "start_time": 1.0, "end_time": 1.2},
        {"text": "60fps!", "start_time": 1.2, "end_time": 2.0},
      ],
      speaker: "Speaker 1",
      confidence: 0.95,
    },
    {
      id: "seg_1",
      text: "Here is the cinematic camera setting.",
      start_time: 2.5,
      end_time: 5.0,
      words: [
        {"text": "Here", "start_time": 2.5, "end_time": 2.8},
        {"text": "is", "start_time": 2.8, "end_time": 3.0},
        {"text": "the", "start_time": 3.0, "end_time": 3.2},
        {"text": "cinematic", "start_time": 3.2, "end_time": 4.0},
        {"text": "camera", "start_time": 4.0, "end_time": 4.5},
        {"text": "setting.", "start_time": 4.5, "end_time": 5.0},
      ],
      speaker: "Speaker 1",
      confidence: 0.92,
    },
  ],
  duration_seconds: 5.0,
  provider_name: "test_provider",
  is_production_provider: false,
};

const mockTranslatedTranscription: TranscriptionResult = {
  language: "Telugu",
  language_code: "te",
  is_transliteration: false,
  script_type: "Telugu",
  full_text: "60fps లో షూట్ చేయడం ఆపండి!",
  segments: [
    {
      id: "seg_0",
      text: "60fps లో షూట్ చేయడం ఆపండి!",
      start_time: 0.0,
      end_time: 2.0,
      words: [],
    },
  ],
  duration_seconds: 2.0,
  provider_name: "mock",
  is_production_provider: false,
};

const mockTanglishTranscription: TranscriptionResult = {
  language: "Tanglish",
  language_code: "te-Latn",
  is_transliteration: true,
  script_type: "Latin",
  full_text: "60fps lo shoot cheyadam aapandi!",
  segments: [
    {
      id: "seg_0",
      text: "60fps lo shoot cheyadam aapandi!",
      start_time: 0.0,
      end_time: 2.0,
      words: [],
    },
  ],
  duration_seconds: 2.0,
  provider_name: "mock",
  is_production_provider: false,
};

const mockGenerateResponse: CaptionCueGenerationResponse = {
  result: {
    cues: [
      {
        id: "cue_0",
        text: "Stop shooting at 60fps!",
        start_time: 0.0,
        end_time: 2.0,
        duration: 2.0,
        language: "English",
        language_code: "en",
        lines: ["Stop shooting at 60fps!"],
        source_segment_ids: ["seg_0"],
        words: [
          { text: "Stop", start_time: 0.0, end_time: 0.5 },
          { text: "shooting", start_time: 0.5, end_time: 1.0 },
          { text: "at", start_time: 1.0, end_time: 1.2 },
          { text: "60fps!", start_time: 1.2, end_time: 2.0 },
        ],
        manually_edited: false,
        metadata: { timing_granularity: "word" },
      },
      {
        id: "cue_1",
        text: "Here is the cinematic camera setting.",
        start_time: 2.5,
        end_time: 5.0,
        duration: 2.5,
        language: "English",
        language_code: "en",
        lines: ["Here is the", "cinematic camera setting."],
        source_segment_ids: ["seg_1"],
        words: [
          { text: "Here", start_time: 2.5, end_time: 2.8 },
          { text: "is", start_time: 2.8, end_time: 3.0 },
          { text: "the", start_time: 3.0, end_time: 3.2 },
          { text: "cinematic", start_time: 3.2, end_time: 4.0 },
          { text: "camera", start_time: 4.0, end_time: 4.5 },
          { text: "setting.", start_time: 4.5, end_time: 5.0 },
        ],
        manually_edited: false,
        metadata: { timing_granularity: "word" },
      },
    ],
    cue_count: 2,
    total_caption_duration: 4.5,
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
};

describe("CaptionCueWorkspace Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Generate Captions action
  it("renders CaptionCueWorkspace with initial state and triggers Generate Captions", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    expect(screen.getByText("5. Caption Cue Generation & Plain Video Preview")).toBeInTheDocument();
    expect(screen.getByText(/Caption Source:/)).toBeInTheDocument();
    expect(screen.getByText("Original (English)")).toBeInTheDocument();

    const generateBtn = screen.getByRole("button", { name: /Generate synchronized captions/i });
    expect(generateBtn).toBeInTheDocument();

    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(api.generateCaptionCues).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "English",
          caption_source_type: "original",
        })
      );
    });

    expect(await screen.findByDisplayValue("Stop shooting at 60fps!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Here is the cinematic camera setting.")).toBeInTheDocument();
  });

  // 2. Active transcript source (Translated)
  it("displays translated caption source when processed transcript is active", () => {
    render(
      <CaptionCueWorkspace
        activeTranscription={mockTranslatedTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={true}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    expect(screen.getByText("Translated (Telugu)")).toBeInTheDocument();
  });

  // 3. Active transcript source (Tanglish)
  it("displays transliterated caption source with Romanized script type", () => {
    render(
      <CaptionCueWorkspace
        activeTranscription={mockTanglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={true}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    expect(screen.getByText("Transliterated (Tanglish - Latin)")).toBeInTheDocument();
  });

  // 4. Cue rendering and cues count badge
  it("renders cues list with timestamps and line previews", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Word Timings")).toBeInTheDocument();
  });

  // 5. Video currentTime synchronization with active cue
  it("synchronizes displayed caption overlay according to video currentTime", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;

    // Simulate video playing at time 1.0s (within cue_0: 0.0 - 2.0s)
    Object.defineProperty(videoEl, "currentTime", { value: 1.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Active caption overlay should display cue_0 text
    const overlay = screen.getByTestId("active-caption-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent("Stop shooting at 60fps!");

    // Simulate video seeking to 3.0s (within cue_1: 2.5 - 5.0s)
    Object.defineProperty(videoEl, "currentTime", { value: 3.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    expect(screen.getByTestId("active-caption-overlay")).toHaveTextContent(
      "Here is the"
    );
  });

  // 6. No-caption state outside cue ranges (e.g. at 2.2s where there is a gap)
  it("hides caption overlay when video playback position is outside all cue ranges", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;

    // Simulate gap time 2.2s (cue_0 ends at 2.0, cue_1 starts at 2.5)
    Object.defineProperty(videoEl, "currentTime", { value: 2.2, writable: true });
    fireEvent.timeUpdate(videoEl);

    expect(screen.queryByTestId("active-caption-overlay")).not.toBeInTheDocument();
  });

  // 7. Cue text editing preserves timing and marks manually_edited = true
  it("allows editing cue text without altering timing and tags cue as edited", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText("Caption text for cue 1");
    fireEvent.change(textarea, { target: { value: "Never shoot at 60fps!" } });

    expect(screen.getByText("Edited")).toBeInTheDocument();
    expect(screen.getByText("Manual Edits Active")).toBeInTheDocument();

    // Verify timing input remains 0 and 2
    const startInput = screen.getByLabelText("Start time for cue 1") as HTMLInputElement;
    expect(startInput.value).toBe("0");
  });

  // 8. Cue numeric timing editing with validation
  it("allows modifying cue start and end times and validates bounds", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const endInput = screen.getByLabelText("End time for cue 1");
    // Invalid: end <= start (0.0)
    fireEvent.change(endInput, { target: { value: "0.0" } });
    expect(
      screen.getByText("End time must be strictly greater than start time.")
    ).toBeInTheDocument();

    // Valid: end > start
    fireEvent.change(endInput, { target: { value: "2.3" } });
    expect(
      screen.queryByText("End time must be strictly greater than start time.")
    ).not.toBeInTheDocument();
  });

  // 9. Cue-to-video seek
  it("seeks video currentTime to cue start when cue card is clicked", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;

    // Click cue #2 card (starts at 2.5s)
    const cue2Heading = screen.getByText("#2");
    fireEvent.click(cue2Heading);

    expect(videoEl.currentTime).toBe(2.5);
  });

  // 10. Basic plain caption appearance controls
  it("allows configuring text alignment, vertical position, font size, and background", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    // Check appearance buttons
    const leftAlignBtn = screen.getByRole("button", { name: "left" });
    fireEvent.click(leftAlignBtn);

    const topPosBtn = screen.getByRole("button", { name: "top" });
    fireEvent.click(topPosBtn);

    const largeFontBtn = screen.getByRole("button", { name: "large" });
    fireEvent.click(largeFontBtn);

    const noneBgBtn = screen.getByRole("button", { name: "None" });
    fireEvent.click(noneBgBtn);

    // Verify video at time 1.0 displays caption with new styles
    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;
    Object.defineProperty(videoEl, "currentTime", { value: 1.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    const overlay = screen.getByTestId("active-caption-overlay");
    expect(overlay).toHaveClass("text-left");
    expect(overlay).toHaveClass("top-10");
  });

  // 11. Safe-area guide toggle
  it("toggles the 9:16 safe area guide overlay", () => {
    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    expect(screen.queryByTestId("safe-area-guide")).not.toBeInTheDocument();

    const safeAreaToggle = screen.getByRole("button", {
      name: /Toggle 9:16 safe area guide/i,
    });
    fireEvent.click(safeAreaToggle);

    expect(screen.getByTestId("safe-area-guide")).toBeInTheDocument();
    expect(screen.getByText("9:16 Vertical Safe Area")).toBeInTheDocument();

    fireEvent.click(safeAreaToggle);
    expect(screen.queryByTestId("safe-area-guide")).not.toBeInTheDocument();
  });

  // 12. Regeneration warning when manual edits exist
  it("shows explicit confirmation warning before regenerating if manual edits exist", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValue(mockGenerateResponse);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    // Make a manual edit
    const textarea = screen.getByLabelText("Caption text for cue 1");
    fireEvent.change(textarea, { target: { value: "Manually customized line" } });

    // Attempt to regenerate
    const regenBtn = screen.getByRole("button", { name: /Generate synchronized captions/i });
    fireEvent.click(regenBtn);

    // Warning banner must appear
    expect(
      screen.getByText("Regenerating will replace manual caption edits")
    ).toBeInTheDocument();

    // Confirm overwrite
    const confirmBtn = screen.getByRole("button", { name: "Overwrite & Regenerate" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.generateCaptionCues).toHaveBeenCalledTimes(2);
    });
  });

  // 13. API failure handling
  it("displays error banner when cue generation API fails", async () => {
    vi.mocked(api.generateCaptionCues).mockRejectedValueOnce(
      new Error("Failed to process segment timestamps.")
    );

    render(
      <CaptionCueWorkspace
        activeTranscription={mockEnglishTranscription}
        originalTranscription={mockEnglishTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    expect(
      await screen.findByText("Failed to process segment timestamps.")
    ).toBeInTheDocument();
  });
});
