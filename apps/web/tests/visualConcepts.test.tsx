import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VisualConceptsSection } from "@/components/scripts/VisualConceptsSection";
import { VisualConceptCard } from "@/components/scripts/VisualConceptCard";
import { ScriptSegment } from "@/components/scripts/ScriptSegment";
import { api } from "../lib/api";
import type { Script, ScriptVisual } from "@/types/script";

// Mock api
vi.mock("../lib/api", () => ({
  api: {
    getVisualProviderStatus: vi.fn(),
    analyzeVisualConcepts: vi.fn(),
    getScriptVisuals: vi.fn(),
    generateVisualImage: vi.fn(),
    regenerateVisualImage: vi.fn(),
    updateScriptVisual: vi.fn(),
    deleteScriptVisual: vi.fn(),
  },
}));

const mockScript: Script = {
  id: "script-vis-101",
  title: "Master 24fps Cinematography",
  topic: "Cinematography Basics",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 30,
  tone: "Educational",
  hook: "Why your mobile videos do not look cinematic.",
  cta: "Follow for more filming hacks.",
  segments: [
    {
      id: "seg_1",
      start_time: "0:00",
      end_time: "0:05",
      section: "HOOK",
      voiceover: "Why your mobile videos do not look cinematic.",
      visual_direction: "Creator holding phone looking puzzled.",
      on_screen_text: "STOP FILMING AT 60FPS",
    },
    {
      id: "seg_2",
      start_time: "0:05",
      end_time: "0:15",
      section: "EXPLANATION",
      voiceover: "The 180-degree shutter rule gives natural motion blur.",
      visual_direction: "Diagram of shutter angle vs frame rate.",
      on_screen_text: "180° RULE",
    },
  ],
  provider_used: "gemini",
  current_version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockVisualItem: ScriptVisual = {
  id: "vis-1",
  script_id: "script-vis-101",
  segment_id: "seg_2",
  concept_title: "180-Degree Shutter Angle Rule",
  explanation: "Illustrates the relationship between 24fps and 1/50th shutter speed producing natural motion blur.",
  visual_type: "Diagram",
  importance: "Essential",
  related_script_text: "The 180-degree shutter rule gives natural motion blur.",
  suggested_prompt: "Technical diagram illustrating shutter angle of 180 degrees with smooth motion blur curves, clean educational infographic style, high contrast, dark slate background",
  prompt: "Technical diagram illustrating shutter angle of 180 degrees with smooth motion blur curves, clean educational infographic style, high contrast, dark slate background",
  aspect_ratio: "9:16",
  style: "Clean Educational",
  language: "English",
  status: "suggested",
  is_attached: false,
};

const mockGeneratedVisualItem: ScriptVisual = {
  ...mockVisualItem,
  id: "vis-gen-1",
  status: "ready",
  image_url: "/api/v1/scripts/script-vis-101/visuals/vis-gen-1/image",
  provider: "openai",
  model: "dall-e-3",
  is_attached: true,
};

describe("AI Visual Concepts Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Provider Status Diagnostics", () => {
    it("renders unconfigured warning banner clearly without crashing", async () => {
      vi.mocked(api.getVisualProviderStatus).mockResolvedValue({
        configured: false,
        provider: "unconfigured",
        model: "none",
        message: "Image generation provider is not configured.",
      });
      vi.mocked(api.getScriptVisuals).mockResolvedValue([]);

      render(<VisualConceptsSection script={mockScript} />);

      await waitFor(() => {
        expect(screen.getByText("Image generation provider is not configured.")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Turn important ideas in your script into visuals that help your audience understand the concept faster.")
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Analyze Script for Visuals/i })[0]).toBeInTheDocument();
    });

    it("renders configured provider banner when ready", async () => {
      vi.mocked(api.getVisualProviderStatus).mockResolvedValue({
        configured: true,
        provider: "openai",
        model: "dall-e-3",
        message: "Image generation is ready with openai (dall-e-3).",
      });
      vi.mocked(api.getScriptVisuals).mockResolvedValue([]);

      render(<VisualConceptsSection script={mockScript} />);

      await waitFor(() => {
        expect(screen.getByText("Image generation is ready with openai (dall-e-3).")).toBeInTheDocument();
      });
    });
  });

  describe("Visual Concept Analysis Flow", () => {
    it("analyzes script and displays visual suggestions", async () => {
      vi.mocked(api.getVisualProviderStatus).mockResolvedValue({
        configured: true,
        provider: "mock",
        model: "mock-v1",
        message: "Ready",
      });
      vi.mocked(api.getScriptVisuals).mockResolvedValue([]);
      vi.mocked(api.analyzeVisualConcepts).mockResolvedValue([mockVisualItem]);

      render(<VisualConceptsSection script={mockScript} />);

      const analyzeBtn = screen.getAllByRole("button", { name: /Analyze Script for Visuals/i })[0];
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(api.analyzeVisualConcepts).toHaveBeenCalledWith(
          mockScript.id,
          expect.objectContaining({
            language: mockScript.language,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("180-Degree Shutter Angle Rule")).toBeInTheDocument();
        expect(screen.getByText(/Illustrates the relationship between 24fps/i)).toBeInTheDocument();
      });
    });

    it("supports Telugu Unicode concept title and explanation without forced translation", async () => {
      const teluguVisual: ScriptVisual = {
        ...mockVisualItem,
        id: "vis-te-1",
        concept_title: "కెమెరా షట్టర్ స్పీడ్ వివరణ",
        explanation: "24fps వద్ద 1/50 షట్టర్ స్పీడ్ మరియు మోషన్ బ్లర్ ఎలా పనిచేస్తుందో స్పష్టమైన రేఖాచిత్రం.",
        language: "Telugu",
      };

      vi.mocked(api.getVisualProviderStatus).mockResolvedValue({
        configured: true,
        provider: "mock",
        model: "mock",
        message: "Ready",
      });
      vi.mocked(api.getScriptVisuals).mockResolvedValue([teluguVisual]);

      render(<VisualConceptsSection script={mockScript} />);

      await waitFor(() => {
        expect(screen.getByText("కెమెరా షట్టర్ స్పీడ్ వివరణ")).toBeInTheDocument();
        expect(
          screen.getByText(/24fps వద్ద 1\/50 షట్టర్ స్పీడ్ మరియు మోషన్ బ్లర్/i)
        ).toBeInTheDocument();
      });
    });

    it("supports Tanglish concept title and explanation without forced translation", async () => {
      const tanglishVisual: ScriptVisual = {
        ...mockVisualItem,
        id: "vis-tan-1",
        concept_title: "Phone Camera Shutter Angle Rule",
        explanation: "180 degree rule follow chesthe mobile lo cinematic motion blur ela vasthundo diagram.",
        language: "Tanglish",
      };

      vi.mocked(api.getVisualProviderStatus).mockResolvedValue({
        configured: true,
        provider: "mock",
        model: "mock",
        message: "Ready",
      });
      vi.mocked(api.getScriptVisuals).mockResolvedValue([tanglishVisual]);

      render(<VisualConceptsSection script={mockScript} />);

      await waitFor(() => {
        expect(screen.getByText("Phone Camera Shutter Angle Rule")).toBeInTheDocument();
        expect(
          screen.getByText(/180 degree rule follow chesthe mobile lo cinematic motion blur/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("VisualConceptCard Actions", () => {
    it("toggles prompt editor accordion, edits prompt, and triggers generation with edited prompt", () => {
      const handleGenerate = vi.fn();
      const handleRegenerate = vi.fn();
      const handleToggleAttach = vi.fn();
      const handleDelete = vi.fn();

      render(
        <VisualConceptCard
          visual={mockVisualItem}
          isProviderConfigured={true}
          onGenerate={handleGenerate}
          onRegenerate={handleRegenerate}
          onToggleAttach={handleToggleAttach}
          onDelete={handleDelete}
        />
      );

      // Open Prompt Editor Accordion
      const editPromptBtn = screen.getByRole("button", { name: /Advanced Prompt Editing/i });
      fireEvent.click(editPromptBtn);

      const textarea = screen.getByDisplayValue(mockVisualItem.prompt);
      expect(textarea).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: "Updated prompt with volumetric lighting" } });

      const genBtn = screen.getByRole("button", { name: /Generate Image/i });
      fireEvent.click(genBtn);

      expect(handleGenerate).toHaveBeenCalledWith(
        mockVisualItem.id,
        "Updated prompt with volumetric lighting",
        mockVisualItem.style,
        mockVisualItem.aspect_ratio
      );
    });

    it("triggers Generate Image with default prompt and style", () => {
      const handleGenerate = vi.fn();

      render(
        <VisualConceptCard
          visual={mockVisualItem}
          isProviderConfigured={true}
          onGenerate={handleGenerate}
          onRegenerate={vi.fn()}
          onToggleAttach={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const genBtn = screen.getByRole("button", { name: /Generate Image/i });
      fireEvent.click(genBtn);

      expect(handleGenerate).toHaveBeenCalledWith(
        mockVisualItem.id,
        mockVisualItem.prompt,
        mockVisualItem.style,
        mockVisualItem.aspect_ratio
      );
    });

    it("triggers Use in Script to attach visual to section", () => {
      const handleToggleAttach = vi.fn();

      render(
        <VisualConceptCard
          visual={mockVisualItem}
          isProviderConfigured={true}
          onGenerate={vi.fn()}
          onRegenerate={vi.fn()}
          onToggleAttach={handleToggleAttach}
          onDelete={vi.fn()}
        />
      );

      const attachBtn = screen.getByRole("button", { name: /Use in Script/i });
      fireEvent.click(attachBtn);

      expect(handleToggleAttach).toHaveBeenCalledWith(mockVisualItem.id, false);
    });

    it("triggers Regenerate for ready visual", () => {
      const handleRegenerate = vi.fn();

      render(
        <VisualConceptCard
          visual={mockGeneratedVisualItem}
          isProviderConfigured={true}
          onGenerate={vi.fn()}
          onRegenerate={handleRegenerate}
          onToggleAttach={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const regenBtn = screen.getByRole("button", { name: /Regenerate/i });
      fireEvent.click(regenBtn);

      expect(handleRegenerate).toHaveBeenCalledWith(
        mockGeneratedVisualItem.id,
        mockGeneratedVisualItem.prompt,
        mockGeneratedVisualItem.style,
        mockGeneratedVisualItem.aspect_ratio
      );
    });
  });

  describe("ScriptSegment Attachment Display", () => {
    it("renders visual callout in script segment when attachedVisual is provided", () => {
      const segment = mockScript.segments[1];

      render(
        <ScriptSegment
          segment={segment}
          index={1}
          isEditing={false}
          attachedVisual={mockGeneratedVisualItem}
        />
      );

      expect(screen.getByText("AI Visual Concept")).toBeInTheDocument();
      expect(screen.getByText(mockGeneratedVisualItem.concept_title)).toBeInTheDocument();
      expect(screen.getByText(/diagram • 9:16/i)).toBeInTheDocument();
    });
  });
});
