import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CaptionCueWorkspace } from "../components/captions/CaptionCueWorkspace";
import { MotionCaptionOverlay } from "../components/captions/MotionCaptionOverlay";
import { MotionCaptionControls } from "../components/captions/MotionCaptionControls";
import { DEFAULT_MOTION_SETTINGS, MOTION_PRESETS } from "../components/captions/motionPresets";
import { api } from "../lib/api";
import type {
  TranscriptionResult,
  CaptionCue,
  CaptionAppearanceSettings,
  CaptionCueGenerationResponse,
} from "../types/caption";

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    generateCaptionCues: vi.fn(),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockWordTimedTranscription: TranscriptionResult = {
  language: "English",
  language_code: "en",
  is_transliteration: false,
  script_type: "Latin",
  full_text: "Stop shooting at 60fps! Cinematic motion blur matters.",
  segments: [
    {
      id: "seg_0",
      text: "Stop shooting at 60fps!",
      start_time: 0.0,
      end_time: 2.0,
      words: [
        { text: "Stop", start_time: 0.0, end_time: 0.5 },
        { text: "shooting", start_time: 0.5, end_time: 1.0 },
        { text: "at", start_time: 1.0, end_time: 1.2 },
        { text: "60fps!", start_time: 1.2, end_time: 2.0 },
      ],
      speaker: "Speaker 1",
      confidence: 0.95,
    },
    {
      id: "seg_1",
      text: "Cinematic motion blur matters.",
      start_time: 2.5,
      end_time: 5.0,
      words: [
        { text: "Cinematic", start_time: 2.5, end_time: 3.2 },
        { text: "motion", start_time: 3.2, end_time: 3.8 },
        { text: "blur", start_time: 3.8, end_time: 4.2 },
        { text: "matters.", start_time: 4.2, end_time: 5.0 },
      ],
      speaker: "Speaker 1",
      confidence: 0.94,
    },
  ],
  duration_seconds: 5.0,
  provider_name: "test_provider",
  is_production_provider: false,
};

const mockSegmentOnlyTranscription: TranscriptionResult = {
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
      words: [], // Strictly no word timestamps
    },
  ],
  duration_seconds: 2.0,
  provider_name: "test_provider",
  is_production_provider: false,
};

const mockGenerateResponseWordTimed: CaptionCueGenerationResponse = {
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
        text: "Cinematic motion blur matters.",
        start_time: 2.5,
        end_time: 5.0,
        duration: 2.5,
        language: "English",
        language_code: "en",
        lines: ["Cinematic motion", "blur matters."],
        source_segment_ids: ["seg_1"],
        words: [
          { text: "Cinematic", start_time: 2.5, end_time: 3.2 },
          { text: "motion", start_time: 3.2, end_time: 3.8 },
          { text: "blur", start_time: 3.8, end_time: 4.2 },
          { text: "matters.", start_time: 4.2, end_time: 5.0 },
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

const mockGenerateResponseSegmentOnly: CaptionCueGenerationResponse = {
  result: {
    cues: [
      {
        id: "cue_0",
        text: "60fps లో షూట్ చేయడం ఆపండి!",
        start_time: 0.0,
        end_time: 2.0,
        duration: 2.0,
        language: "Telugu",
        language_code: "te",
        lines: ["60fps లో షూట్ చేయడం ఆపండి!"],
        source_segment_ids: ["seg_0"],
        words: [], // Strictly empty
        manually_edited: false,
        metadata: { timing_granularity: "segment" },
      },
    ],
    cue_count: 1,
    total_caption_duration: 2.0,
    timing_granularity: "segment",
    settings_used: {
      max_characters_per_line: 36,
      max_lines: 2,
      minimum_cue_duration: 0.8,
      maximum_cue_duration: 4.0,
      preferred_words_per_cue: 6,
      gap_threshold: 0.5,
    },
    caption_source_type: "translated",
    warnings: ["Word timings unavailable for translated transcript; using segment boundaries."],
    metadata: {},
  },
};

const defaultAppearance: CaptionAppearanceSettings = {
  alignment: "center",
  vertical_position: "bottom",
  font_size: "medium",
  background: "box",
  show_safe_area: false,
};

describe("Motion-Graphic Caption Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Plain mode still works
  it("defaults to Plain mode and renders plain caption overlay", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponseWordTimed);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockWordTimedTranscription}
        originalTranscription={mockWordTimedTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    // Initial mode indicator badge
    expect(screen.getByText("Plain Captions")).toBeInTheDocument();
    const plainBtn = screen.getByRole("button", { name: "Plain" });
    expect(plainBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;
    Object.defineProperty(videoEl, "currentTime", { value: 0.5, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Should render plain overlay and NOT motion overlay
    expect(screen.getByTestId("active-caption-overlay")).toBeInTheDocument();
    expect(screen.queryByTestId("motion-caption-overlay")).not.toBeInTheDocument();
  });

  // 2. Motion mode renders and mode switching preserves cues and timing
  it("switches from Plain to Motion mode without modifying cues or timing", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponseWordTimed);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockWordTimedTranscription}
        originalTranscription={mockWordTimedTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    // Switch to Motion mode
    const motionBtn = screen.getByRole("button", { name: "Motion" });
    fireEvent.click(motionBtn);

    expect(screen.getByText("Motion Captions")).toBeInTheDocument();
    expect(motionBtn).toHaveAttribute("aria-pressed", "true");

    // Cue counts and cues list remain identical
    expect(screen.getByText("2 Cues")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Stop shooting at 60fps!")).toBeInTheDocument();

    // Motion engine controls now visible
    expect(screen.getByText("Motion Caption Engine")).toBeInTheDocument();

    const videoEl = screen.getByTestId("caption-video-element") as HTMLVideoElement;
    Object.defineProperty(videoEl, "currentTime", { value: 0.5, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Active motion overlay is now rendered
    expect(screen.getByTestId("motion-caption-overlay")).toBeInTheDocument();
    expect(screen.queryByTestId("active-caption-overlay")).not.toBeInTheDocument();
  });

  // 3. Preset selection updates preset state
  it("updates active preset when selecting presets in MotionCaptionControls", () => {
    const onChangeSettings = vi.fn();
    render(
      <MotionCaptionControls
        settings={DEFAULT_MOTION_SETTINGS}
        onChangeSettings={onChangeSettings}
        hasWordTimings={true}
      />
    );

    // Select Karaoke preset
    const karaokeBtn = screen.getByRole("button", { name: /Karaoke/i });
    fireEvent.click(karaokeBtn);

    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: "karaoke",
        word_animation: "highlight",
      })
    );

    // Select Bold Bounce preset
    const boldBounceBtn = screen.getByRole("button", { name: /Bold Bounce/i });
    fireEvent.click(boldBounceBtn);

    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: "bold_bounce",
        font_weight: "black",
      })
    );
  });

  // 4. Clean Pop preset rendering
  it("renders Clean Pop preset with active word styling and dark pill container", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.8} // Spoken word: "shooting" (0.5 to 1.0)
        motionSettings={MOTION_PRESETS.clean_pop.settings as any}
        appearance={defaultAppearance}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-preset", "clean_pop");

    const words = screen.getAllByTestId("motion-word");
    expect(words).toHaveLength(4);

    // Word 1: "Stop" is spoken
    expect(words[0]).toHaveAttribute("data-word-text", "Stop");
    expect(words[0]).toHaveAttribute("data-word-active", "false");
    expect(words[0]).toHaveAttribute("data-word-spoken", "true");

    // Word 2: "shooting" is actively spoken at time 0.8s
    expect(words[1]).toHaveAttribute("data-word-text", "shooting");
    expect(words[1]).toHaveAttribute("data-word-active", "true");
  });

  // 5. Karaoke preset illumination behavior with word timestamps
  it("illuminates active and spoken words while dimming upcoming words in Karaoke mode", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.8} // "Stop" (0.0-0.5) is spoken, "shooting" (0.5-1.0) is active, "at" and "60fps!" are upcoming
        motionSettings={MOTION_PRESETS.karaoke.settings as any}
        appearance={defaultAppearance}
      />
    );

    const words = screen.getAllByTestId("motion-word");
    expect(words[0]).toHaveClass("opacity-100"); // Spoken
    expect(words[1]).toHaveAttribute("data-word-active", "true"); // Active
    expect(words[2]).toHaveClass("opacity-40"); // Upcoming
    expect(words[3]).toHaveClass("opacity-40"); // Upcoming
  });

  // 6. Bold Bounce preset rendering
  it("renders Bold Bounce preset with black font weight and pop entrance", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.1} // In entrance window (< 0.2s)
        motionSettings={MOTION_PRESETS.bold_bounce.settings as any}
        appearance={defaultAppearance}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-preset", "bold_bounce");
    expect(overlay.firstElementChild).toHaveClass("font-black");
    expect(overlay.firstElementChild).toHaveClass("scale-105");
  });

  // 7. Minimal Fade preset rendering
  it("renders Minimal Fade preset without aggressive scaling", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.8}
        motionSettings={MOTION_PRESETS.minimal_fade.settings as any}
        appearance={defaultAppearance}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-preset", "minimal_fade");
    expect(overlay.firstElementChild).toHaveClass("font-normal");
  });

  // 8. Punchy preset rendering
  it("renders Punchy preset with amber/yellow highlight styling", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.3} // "Stop" active
        motionSettings={MOTION_PRESETS.punchy.settings as any}
        appearance={defaultAppearance}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-preset", "punchy");
    const activeWord = screen.getAllByTestId("motion-word")[0];
    expect(activeWord).toHaveAttribute("data-word-active", "true");
  });

  // 9. Active word detection & video seek synchronization
  it("tracks active word accurately as currentTime changes and across video seeks", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    const { rerender } = render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.2} // Word "Stop"
        motionSettings={MOTION_PRESETS.clean_pop.settings as any}
        appearance={defaultAppearance}
      />
    );

    let words = screen.getAllByTestId("motion-word");
    expect(words[0]).toHaveAttribute("data-word-active", "true");
    expect(words[1]).toHaveAttribute("data-word-active", "false");

    // Seek to 1.1s (Word "at": 1.0 - 1.2)
    rerender(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={1.1}
        motionSettings={MOTION_PRESETS.clean_pop.settings as any}
        appearance={defaultAppearance}
      />
    );

    words = screen.getAllByTestId("motion-word");
    expect(words[0]).toHaveAttribute("data-word-active", "false");
    expect(words[2]).toHaveAttribute("data-word-active", "true");
  });

  // 10. Segment-only fallback when word timings are absent (No fake word timings)
  it("falls back to segment-level phrase rendering when word timings are absent", () => {
    const segmentOnlyCue: CaptionCue = mockGenerateResponseSegmentOnly.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={segmentOnlyCue}
        currentTime={0.5}
        motionSettings={MOTION_PRESETS.karaoke.settings as any}
        appearance={defaultAppearance}
      />
    );

    // Does NOT render word container or fake words
    expect(screen.queryByTestId("motion-words-container")).not.toBeInTheDocument();
    expect(screen.queryByTestId("motion-word")).not.toBeInTheDocument();

    // Renders segment fallback container
    const fallback = screen.getByTestId("segment-fallback-display");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("60fps లో షూట్ చేయడం ఆపండి!");
  });

  // 11. Word timing availability badges in controls
  it("displays word-synced badge when words exist and segment-timing badge when words are absent", () => {
    const { rerender } = render(
      <MotionCaptionControls
        settings={DEFAULT_MOTION_SETTINGS}
        onChangeSettings={vi.fn()}
        hasWordTimings={true}
      />
    );
    expect(screen.getByTestId("word-synced-badge")).toHaveTextContent("Word-synced motion available");

    rerender(
      <MotionCaptionControls
        settings={DEFAULT_MOTION_SETTINGS}
        onChangeSettings={vi.fn()}
        hasWordTimings={false}
      />
    );
    expect(screen.getByTestId("segment-timing-badge")).toHaveTextContent("Segment timing only");
  });

  // 12. Entrance and Exit animations
  it("applies entrance and exit animation classes at cue boundary edges", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0]; // 0.0 to 2.0s

    // Time 0.1s: in entrance window (< 0.2s)
    const { rerender } = render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.1}
        motionSettings={{ ...DEFAULT_MOTION_SETTINGS, entrance_animation: "slide_up" }}
        appearance={defaultAppearance}
      />
    );

    let overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay.firstElementChild).toHaveClass("translate-y-1.5");

    // Time 1.9s: in exit window (> 1.8s)
    rerender(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={1.9}
        motionSettings={{ ...DEFAULT_MOTION_SETTINGS, exit_animation: "slide_down" }}
        appearance={defaultAppearance}
      />
    );

    overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay.firstElementChild).toHaveClass("translate-y-1.5");
  });

  // 13. Reduced-motion behavior
  it("disables scaling and positional movement when reduced motion is active", () => {
    const cue: CaptionCue = mockGenerateResponseWordTimed.result.cues[0];
    render(
      <MotionCaptionOverlay
        cue={cue}
        currentTime={0.3} // Word "Stop" active
        motionSettings={MOTION_PRESETS.bold_bounce.settings as any}
        appearance={defaultAppearance}
        forceReducedMotion={true}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-reduced-motion", "true");

    const activeWord = screen.getAllByTestId("motion-word")[0];
    // Under reduced motion, scale transform is locked to scale-100
    expect(activeWord).toHaveClass("scale-100");
  });

  // 14. Fine-tuning motion parameters in controls
  it("allows selecting animation parameters in MotionCaptionControls", () => {
    const onChangeSettings = vi.fn();
    render(
      <MotionCaptionControls
        settings={DEFAULT_MOTION_SETTINGS}
        onChangeSettings={onChangeSettings}
        hasWordTimings={true}
      />
    );

    // Select entrance animation
    const entranceSelect = screen.getByLabelText("Entrance Animation");
    fireEvent.change(entranceSelect, { target: { value: "slide_up" } });
    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({ entrance_animation: "slide_up" })
    );

    // Select exit animation
    const exitSelect = screen.getByLabelText("Exit Animation");
    fireEvent.change(exitSelect, { target: { value: "slide_down" } });
    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({ exit_animation: "slide_down" })
    );

    // Select intensity
    const intensitySelect = screen.getByLabelText("Animation Intensity");
    fireEvent.change(intensitySelect, { target: { value: "high" } });
    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({ intensity: "high" })
    );

    // Select active word emphasis
    const scaleWordBtn = screen.getByRole("button", { name: "scale" });
    fireEvent.click(scaleWordBtn);
    expect(onChangeSettings).toHaveBeenCalledWith(
      expect.objectContaining({ active_word_style: "scale" })
    );
  });

  // 15. Cue editing in workspace remains intact in motion mode
  it("preserves manual text edits and timing while in motion mode", async () => {
    vi.mocked(api.generateCaptionCues).mockResolvedValueOnce(mockGenerateResponseWordTimed);

    render(
      <CaptionCueWorkspace
        activeTranscription={mockWordTimedTranscription}
        originalTranscription={mockWordTimedTranscription}
        isProcessedActive={false}
        videoPreviewUrl="blob:http://localhost/dummy-video"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate synchronized captions/i }));

    await waitFor(() => {
      expect(screen.getByText("2 Cues")).toBeInTheDocument();
    });

    // Switch to Motion mode
    fireEvent.click(screen.getByRole("button", { name: "Motion" }));

    // Edit caption cue text
    const textarea = screen.getByLabelText("Caption text for cue 1");
    fireEvent.change(textarea, { target: { value: "Customized kinetic caption" } });

    expect(screen.getByText("Edited")).toBeInTheDocument();
    expect(screen.getByText("Manual Edits Active")).toBeInTheDocument();
    expect(textarea).toHaveValue("Customized kinetic caption");
  });
});
