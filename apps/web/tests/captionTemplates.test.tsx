import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  CAPTION_TEMPLATES,
  DEFAULT_TEMPLATE,
  getTemplateById,
  templateToAppearance,
  templateToMotionSettings,
} from "../components/captions/captionTemplates";
import { CaptionTemplatePicker } from "../components/captions/CaptionTemplatePicker";
import { MotionCaptionOverlay } from "../components/captions/MotionCaptionOverlay";
import { CaptionCueWorkspace } from "../components/captions/CaptionCueWorkspace";
import type { CaptionCue, TranscriptionResult } from "../types/caption";

// Mock matchMedia for jsdom
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

const mockTeluguCue: CaptionCue = {
  id: "cue_0",
  index: 0,
  start_time: 0.0,
  end_time: 2.5,
  duration: 2.5,
  text: "మీ వీడియోలు వైరల్ కావాలా?",
  lines: ["మీ వీడియోలు వైరల్ కావాలా?"],
  language: "Telugu",
  language_code: "te",
  words: [
    { text: "మీ", start_time: 0.0, end_time: 0.5 },
    { text: "వీడియోలు", start_time: 0.5, end_time: 1.2 },
    { text: "వైరల్", start_time: 1.2, end_time: 1.8 },
    { text: "కావాలా?", start_time: 1.8, end_time: 2.5 },
  ],
};

const mockEnglishCue: CaptionCue = {
  id: "cue_1",
  index: 1,
  start_time: 2.5,
  end_time: 5.0,
  duration: 2.5,
  text: "Stop shooting at 60fps!",
  lines: ["Stop shooting at 60fps!"],
  language: "English",
  language_code: "en",
  words: [
    { text: "Stop", start_time: 2.5, end_time: 3.0 },
    { text: "shooting", start_time: 3.0, end_time: 3.5 },
    { text: "at", start_time: 3.5, end_time: 4.0 },
    { text: "60fps!", start_time: 4.0, end_time: 5.0 },
  ],
};

const mockTeluguTranscription: TranscriptionResult = {
  language: "Telugu",
  language_code: "te",
  is_transliteration: false,
  script_type: "Telugu",
  full_text: "మీ వీడియోలు వైరల్ కావాలా? Stop shooting at 60fps!",
  segments: [
    {
      id: "seg_0",
      text: "మీ వీడియోలు వైరల్ కావాలా?",
      start_time: 0.0,
      end_time: 2.5,
      speaker: "Speaker 1",
      confidence: 0.95,
      words: [
        { text: "మీ", start_time: 0.0, end_time: 0.5 },
        { text: "వీడియోలు", start_time: 0.5, end_time: 1.2 },
        { text: "వైరల్", start_time: 1.2, end_time: 1.8 },
        { text: "కావాలా?", start_time: 1.8, end_time: 2.5 },
      ],
    },
  ],
};

describe("Caption Templates Catalog & Helpers", () => {
  it("includes all 10 professional creator templates", () => {
    expect(CAPTION_TEMPLATES).toHaveLength(10);
    const ids = CAPTION_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("clean");
    expect(ids).toContain("hormozi");
    expect(ids).toContain("viral_pop");
    expect(ids).toContain("karaoke");
    expect(ids).toContain("neon");
    expect(ids).toContain("editorial");
    expect(ids).toContain("minimal");
    expect(ids).toContain("dynamic");
    expect(ids).toContain("punch");
    expect(ids).toContain("cinematic");
  });

  it("defaults to Clean template without a dark box background", () => {
    expect(DEFAULT_TEMPLATE.id).toBe("clean");
    expect(DEFAULT_TEMPLATE.background.type).toBe("none");
    expect(DEFAULT_TEMPLATE.shadow.enabled).toBe(true);
  });

  it("retrieves template by ID safely and falls back to Clean", () => {
    const hormozi = getTemplateById("hormozi");
    expect(hormozi.id).toBe("hormozi");
    expect(hormozi.colors.activeWord).toBe("#10B981");

    const fallback = getTemplateById("non_existent_id");
    expect(fallback.id).toBe("clean");
  });

  it("converts template to appearance settings correctly", () => {
    const neon = getTemplateById("neon");
    const appearance = templateToAppearance(neon);

    expect(appearance.font_size).toBe(neon.typography.fontSize);
    expect(appearance.background).toBe("outline");
    expect(appearance.position_x).toBe(neon.position.x);
    expect(appearance.position_y).toBe(neon.position.y);
  });

  it("converts template to motion settings correctly", () => {
    const viral = getTemplateById("viral_pop");
    const motion = templateToMotionSettings(viral);

    expect(motion.preset).toBe("viral_pop");
    expect(motion.intensity).toBe("high");
    expect(motion.word_animation).toBe("pop");
    expect(motion.primary_color).toBe("#FFFFFF");
  });
});

describe("CaptionTemplatePicker Component", () => {
  it("renders template picker with all template cards", () => {
    const handleSelect = vi.fn();
    render(
      <CaptionTemplatePicker
        selectedTemplateId="clean"
        onSelectTemplate={handleSelect}
        language="English"
        languageCode="en"
      />
    );

    expect(screen.getByRole("radiogroup", { name: /Caption style templates/i })).toBeInTheDocument();
    expect(screen.getByTestId("template-card-clean")).toBeInTheDocument();
    expect(screen.getByTestId("template-card-hormozi")).toBeInTheDocument();
    expect(screen.getByTestId("template-card-viral_pop")).toBeInTheDocument();
  });

  it("filters template cards by category tabs", () => {
    const handleSelect = vi.fn();
    render(
      <CaptionTemplatePicker
        selectedTemplateId="clean"
        onSelectTemplate={handleSelect}
        language="English"
        languageCode="en"
      />
    );

    // Switch category to "Cinematic" tab
    const cinematicTab = screen.getByRole("tab", { name: "Cinematic" });
    fireEvent.click(cinematicTab);

    expect(screen.getByTestId("template-card-cinematic")).toBeInTheDocument();
    expect(screen.queryByTestId("template-card-hormozi")).not.toBeInTheDocument();
  });

  it("shows Native Telugu badge and Telugu preview text when language is Telugu", () => {
    const handleSelect = vi.fn();
    render(
      <CaptionTemplatePicker
        selectedTemplateId="clean"
        onSelectTemplate={handleSelect}
        language="Telugu"
        languageCode="te"
      />
    );

    expect(screen.getByTestId("native-telugu-badge")).toBeInTheDocument();
    expect(screen.getByText(/Native Telugu.*Mode Active/i)).toBeInTheDocument();
    // Verify a Telugu preview phrase is rendered
    expect(screen.getByText("సినిమాటిక్ కెమెరా సెట్టింగ్స్!")).toBeInTheDocument();
  });

  it("triggers onSelectTemplate immediately upon clicking a card without needing an Apply button", () => {
    const handleSelect = vi.fn();
    render(
      <CaptionTemplatePicker
        selectedTemplateId="clean"
        onSelectTemplate={handleSelect}
        language="English"
        languageCode="en"
      />
    );

    const hormoziCard = screen.getByTestId("template-card-hormozi");
    fireEvent.click(hormoziCard);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "hormozi" }));
  });

  it("supports keyboard selection with Enter and Space keys", () => {
    const handleSelect = vi.fn();
    render(
      <CaptionTemplatePicker
        selectedTemplateId="clean"
        onSelectTemplate={handleSelect}
        language="English"
        languageCode="en"
      />
    );

    const neonCard = screen.getByTestId("template-card-neon");
    fireEvent.keyDown(neonCard, { key: "Enter" });
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "neon" }));

    fireEvent.keyDown(neonCard, { key: " " });
    expect(handleSelect).toHaveBeenCalledTimes(2);
  });
});

describe("MotionCaptionOverlay — Native Telugu & Template Styling", () => {
  const defaultAppearance = templateToAppearance(DEFAULT_TEMPLATE);
  const defaultMotion = templateToMotionSettings(DEFAULT_TEMPLATE);

  it("renders with no black box when template background is none", () => {
    render(
      <MotionCaptionOverlay
        cue={mockEnglishCue}
        currentTime={3.0}
        appearance={defaultAppearance}
        motionSettings={defaultMotion}
        template={DEFAULT_TEMPLATE}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toBeInTheDocument();
    const innerBox = overlay.querySelector(".inline-block");
    // Default Clean template has drop-shadow, no bg-black box
    expect(innerBox?.className).toContain("drop-shadow");
    expect(innerBox?.className).not.toContain("bg-black");
  });

  it("renders pill background when template specifies pill background", () => {
    const pillTemplate = getTemplateById("bold_bounce") || getTemplateById("editorial");
    // bold_bounce has pill background:
    const templateWithPill = CAPTION_TEMPLATES.find((t) => t.background.type === "pill") || pillTemplate;
    const appearance: any = {
      ...templateToAppearance(templateWithPill),
      background: "box",
    };
    const motion = templateToMotionSettings(templateWithPill);

    render(
      <MotionCaptionOverlay
        cue={mockEnglishCue}
        currentTime={3.0}
        appearance={appearance}
        motionSettings={motion}
        template={templateWithPill}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toBeInTheDocument();
    const innerBox = overlay.querySelector(".inline-block");
    expect(innerBox?.className).toContain("rounded-full");
  });

  it("applies Native Telugu font stack, relaxed line height and keeps conjuncts intact", () => {
    render(
      <MotionCaptionOverlay
        cue={mockTeluguCue}
        currentTime={1.0}
        appearance={defaultAppearance}
        motionSettings={defaultMotion}
        template={DEFAULT_TEMPLATE}
      />
    );

    const overlay = screen.getByTestId("motion-caption-overlay");
    expect(overlay).toHaveAttribute("data-telugu-mode", "true");
    const innerBox = overlay.querySelector(".inline-block") as HTMLElement;
    // Check relaxed line-height to prevent matra clipping
    expect(innerBox.className).toContain("leading-relaxed");
    expect(innerBox.style.wordBreak).toBe("keep-all");
  });
});

describe("CaptionCueWorkspace — One-Click Template Integration", () => {
  it("renders template picker when cues are loaded and switches template instantly", () => {
    render(
      <CaptionCueWorkspace
        initialCues={[mockTeluguCue]}
        activeTranscription={mockTeluguTranscription}
        videoPreviewUrl="blob:http://localhost/test-video"
      />
    );

    // Picker is visible
    expect(screen.getByRole("radiogroup", { name: /Caption style templates/i })).toBeInTheDocument();

    // Since transcription is Telugu, Native Telugu badge is shown
    expect(screen.getByTestId("native-telugu-badge")).toBeInTheDocument();

    // Select Hormozi template with one click
    const hormoziCard = screen.getByTestId("template-card-hormozi");
    fireEvent.click(hormoziCard);

    // Verify Hormozi card is now selected (aria-checked="true")
    expect(hormoziCard).toHaveAttribute("aria-checked", "true");
  });
});
