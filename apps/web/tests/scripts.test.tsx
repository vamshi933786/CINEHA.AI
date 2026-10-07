import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ScriptSegment } from "../components/scripts/ScriptSegment";
import { ScriptInput } from "../components/scripts/ScriptInput";
import { ScriptPreview } from "../components/scripts/ScriptPreview";
import { ScriptToolbar } from "../components/scripts/ScriptToolbar";
import { ScriptWorkspace } from "../components/scripts/ScriptWorkspace";
import { api } from "../lib/api";
import type { Script, ScriptSegment as ScriptSegmentType, ScriptVersion } from "../types/script";

// Mock CreatorProfileProvider
const mockProfileContext = {
  profile: {
    id: "profile-1",
    creator_name: "Sai Panga",
    niche: "Mobile Filmmaking",
    target_audience: "Creators",
    platforms: ["Instagram Reels", "YouTube Shorts"],
    primary_language: "Tanglish",
    content_tones: ["Cinematic", "High-Energy"],
    creator_bio: "Filmmaker",
    content_goals: ["Increase retention"],
    created_at: "2026-09-28T12:00:00Z",
    updated_at: "2026-09-28T12:00:00Z",
  },
  isConfigured: true,
  isLoading: false,
  error: null,
  refreshProfile: vi.fn(),
  saveProfile: vi.fn(),
};

vi.mock("@/providers/CreatorProfileProvider", () => ({
  useCreatorProfile: () => mockProfileContext,
  CreatorProfileProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    generateScript: vi.fn(),
    updateScript: vi.fn(),
    getScriptVersions: vi.fn(),
    getScripts: vi.fn(),
    getScript: vi.fn(),
    getVisualProviderStatus: vi.fn().mockResolvedValue({
      configured: false,
      provider: "unconfigured",
      model: "none",
      message: "Image generation provider is not configured.",
    }),
    getScriptVisuals: vi.fn().mockResolvedValue([]),
    analyzeVisualConcepts: vi.fn().mockResolvedValue([]),
    generateVisualImage: vi.fn(),
    regenerateVisualImage: vi.fn(),
    updateScriptVisual: vi.fn(),
    deleteScriptVisual: vi.fn(),
  },
}));

const mockSegment: ScriptSegmentType = {
  id: "seg_1",
  start_time: "0:00",
  end_time: "0:03",
  section: "HOOK",
  voiceover: "Stop making this mobile video mistake.",
  visual_direction: "Crash zoom onto smartphone lens in dark studio.",
  b_roll: "Slow-motion b-roll of amateur flat footage.",
  on_screen_text: "STOP DOING THIS ❌",
  audio_direction: "Heavy bass sub-drop with tension riser.",
};

const mockScript: Script = {
  id: "script-123",
  profile_id: "profile-1",
  title: "Mobile Lighting Secrets — 30s Masterclass",
  topic: "Mobile Lighting Secrets",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 30,
  tone: "Cinematic",
  hook: "Stop making this mobile video mistake.",
  segments: [
    mockSegment,
    {
      id: "seg_2",
      start_time: "0:03",
      end_time: "0:10",
      section: "PROBLEM",
      voiceover: "Flat lighting is quietly ruining your dynamic range.",
      visual_direction: "Over-the-shoulder view of phone monitor.",
      b_roll: "High contrast harsh shadows.",
      on_screen_text: "MUDDY FLAT FOOTAGE",
      audio_direction: "Low hum ambient tension.",
    },
    {
      id: "seg_3",
      start_time: "0:10",
      end_time: "0:25",
      section: "SOLUTION",
      voiceover: "Separate your subject and angle a single 45-degree key light.",
      visual_direction: "Motorized slider reveals cinematic rim lighting.",
      b_roll: "Golden hour rim light glow.",
      on_screen_text: "THE 45-DEGREE RULE 💡",
      audio_direction: "Smooth synthwave swell.",
    },
    {
      id: "seg_4",
      start_time: "0:25",
      end_time: "0:30",
      section: "CTA",
      voiceover: "Save this for your next video shoot!",
      visual_direction: "Creator smiles into camera gesturing downward.",
      b_roll: "Social badge sticker overlay.",
      on_screen_text: "SAVE THIS TIP 📌",
      audio_direction: "Melodic chime resolving.",
    },
  ],
  cta: "Save this for your next video shoot!",
  provider_used: "heuristic_mock",
  current_version: 1,
  created_at: "2026-09-28T12:00:00Z",
  updated_at: "2026-09-28T12:00:00Z",
  versions: [
    {
      id: "ver-1",
      script_id: "script-123",
      version_number: 1,
      title: "Mobile Lighting Secrets — 30s Masterclass",
      segments: [mockSegment],
      hook: "Stop making this mobile video mistake.",
      cta: "Save this for your next video shoot!",
      change_summary: "Initial generation",
      provider_used: "heuristic_mock",
      created_at: "2026-09-28T12:00:00Z",
      updated_at: "2026-09-28T12:00:00Z",
    },
  ],
};

describe("Script Studio Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ScriptSegment", () => {
    it("renders timestamp, section badge, voiceover, visual, b-roll, text, and audio in view mode", () => {
      render(
        <ScriptSegment
          segment={mockSegment}
          index={0}
          isEditing={false}
        />
      );

      expect(screen.getByText("0:00 — 0:03")).toBeInTheDocument();
      expect(screen.getByText("HOOK")).toBeInTheDocument();
      expect(
        screen.getByText('"Stop making this mobile video mistake."')
      ).toBeInTheDocument();
      expect(
        screen.getByText("Crash zoom onto smartphone lens in dark studio.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Slow-motion b-roll of amateur flat footage.")
      ).toBeInTheDocument();
      expect(screen.getByText("STOP DOING THIS ❌")).toBeInTheDocument();
      expect(
        screen.getByText("Heavy bass sub-drop with tension riser.")
      ).toBeInTheDocument();
    });

    it("renders editable inputs and fires onChange when isEditing is true", () => {
      const handleChange = vi.fn();
      render(
        <ScriptSegment
          segment={mockSegment}
          index={0}
          isEditing={true}
          onChange={handleChange}
        />
      );

      const voiceoverTextarea = screen.getByDisplayValue(
        "Stop making this mobile video mistake."
      );
      fireEvent.change(voiceoverTextarea, {
        target: { value: "New edited voiceover line." },
      });

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceover: "New edited voiceover line.",
        })
      );
    });
  });

  describe("ScriptInput", () => {
    it("renders inputs and displays persona indicator when configured", () => {
      const handleChange = vi.fn();
      const handleSubmit = vi.fn();

      render(
        <ScriptInput
          formData={{
            topic: "Gimbal Techniques",
            context: "Using DJI Osmo",
            platform: "Instagram Reels",
            language: "Tanglish",
            duration_seconds: 30,
            tone: "",
            hookMode: "auto",
            hook: "",
            ctaPreset: "Follow for more",
            customCta: "",
          }}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isGenerating={false}
          generationStage=""
          error={null}
        />
      );

      expect(screen.getByDisplayValue("Gimbal Techniques")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Using DJI Osmo")).toBeInTheDocument();
      expect(screen.getByText(/Persona Connected: Sai Panga/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /generate structured script/i })).toBeInTheDocument();
    });

    it("renders realistic progress state during generation", () => {
      render(
        <ScriptInput
          formData={{
            topic: "Gimbal Techniques",
            context: "",
            platform: "Instagram Reels",
            language: "Tanglish",
            duration_seconds: 30,
            tone: "",
            hookMode: "auto",
            hook: "",
            ctaPreset: "Follow for more",
            customCta: "",
          }}
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isGenerating={true}
          generationStage="Building screenplay narrative..."
          error={null}
        />
      );

      expect(screen.getByText("Generating Screenplay...")).toBeInTheDocument();
      expect(screen.getByText("Building screenplay narrative...")).toBeInTheDocument();
    });
  });

  describe("ScriptPreview", () => {
    it("renders empty state placeholder when no script has been generated yet", () => {
      render(
        <ScriptPreview
          script={null}
          activeSegments={[]}
          isEditing={false}
          onSegmentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onHookChange={vi.fn()}
          onCtaChange={vi.fn()}
          isGenerating={false}
          error={null}
        />
      );

      expect(
        screen.getByText("Your Screenplay Will Appear Here")
      ).toBeInTheDocument();
    });

    it("renders full screenplay, hook callout, segments, and CTA banner", () => {
      render(
        <ScriptPreview
          script={mockScript}
          activeSegments={mockScript.segments}
          isEditing={false}
          onSegmentChange={vi.fn()}
          onTitleChange={vi.fn()}
          onHookChange={vi.fn()}
          onCtaChange={vi.fn()}
          isGenerating={false}
          error={null}
        />
      );

      expect(
        screen.getByText("Mobile Lighting Secrets — 30s Masterclass")
      ).toBeInTheDocument();
      expect(
        screen.getAllByText('"Stop making this mobile video mistake."').length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText('"Save this for your next video shoot!"').length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Screenplay Timeline \(4 Beats\)/)).toBeInTheDocument();
    });
  });

  describe("ScriptToolbar", () => {
    it("handles edit, copy, and export actions", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      const handleToggleEdit = vi.fn();
      const handleRegenerate = vi.fn();
      const handleCopy = vi.fn();
      const handleExport = vi.fn();

      render(
        <ScriptToolbar
          script={mockScript}
          isEditing={false}
          isSavingVersion={false}
          onToggleEdit={handleToggleEdit}
          onSaveVersion={vi.fn()}
          onCancelEdit={vi.fn()}
          onRegenerate={handleRegenerate}
          onCopy={handleCopy}
          onExport={handleExport}
          hasCopied={false}
          versions={mockScript.versions || []}
          selectedVersionNumber={1}
          onSelectVersion={vi.fn()}
        />
      );

      // Edit button
      const editBtn = screen.getByRole("button", { name: /edit script/i });
      fireEvent.click(editBtn);
      expect(handleToggleEdit).toHaveBeenCalledTimes(1);

      // Regenerate button
      const regenBtn = screen.getByRole("button", { name: /regenerate/i });
      fireEvent.click(regenBtn);
      expect(handleRegenerate).toHaveBeenCalledTimes(1);

      // Copy button
      const copyBtn = screen.getByRole("button", { name: /copy/i });
      fireEvent.click(copyBtn);
      expect(handleCopy).toHaveBeenCalledTimes(1);

      // Export button
      const exportBtn = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportBtn);
      expect(handleExport).toHaveBeenCalledTimes(1);
    });
  });

  describe("ScriptWorkspace Integration", () => {
    it("generates script successfully and displays screenplay", async () => {
      vi.mocked(api.generateScript).mockResolvedValueOnce(mockScript);

      render(<ScriptWorkspace initialTopic="Mobile Lighting Secrets" />);

      const generateBtn = screen.getByRole("button", {
        name: /generate structured script/i,
      });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(api.generateScript).toHaveBeenCalledWith(
          expect.objectContaining({
            topic: "Mobile Lighting Secrets",
            platform: "Instagram Reels",
            duration_seconds: 30,
          })
        );
        expect(
          screen.getByText("Mobile Lighting Secrets — 30s Masterclass")
        ).toBeInTheDocument();
      });
    });

    it("allows editing script and saving a new version", async () => {
      vi.mocked(api.generateScript).mockResolvedValueOnce(mockScript);
      const updatedScript: Script = {
        ...mockScript,
        title: "Mobile Lighting Secrets — Version 2 Enhanced",
        current_version: 2,
      };
      vi.mocked(api.updateScript).mockResolvedValueOnce(updatedScript);
      vi.mocked(api.getScriptVersions).mockResolvedValueOnce([
        {
          id: "ver-2",
          script_id: "script-123",
          version_number: 2,
          title: "Mobile Lighting Secrets — Version 2 Enhanced",
          segments: mockScript.segments,
          hook: mockScript.hook,
          cta: mockScript.cta,
          change_summary: "Version 2 manual edits",
          provider_used: "heuristic_mock",
          created_at: "2026-09-28T12:05:00Z",
          updated_at: "2026-09-28T12:05:00Z",
        },
        mockScript.versions![0],
      ]);

      render(<ScriptWorkspace initialTopic="Mobile Lighting Secrets" />);

      // Generate first
      fireEvent.click(
        screen.getByRole("button", { name: /generate structured script/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText("Mobile Lighting Secrets — 30s Masterclass")
        ).toBeInTheDocument();
      });

      // Enter edit mode
      fireEvent.click(screen.getByRole("button", { name: /edit script/i }));

      // Save changes as new version
      const saveBtn = screen.getByRole("button", {
        name: /save as new version/i,
      });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(api.updateScript).toHaveBeenCalledWith(
          "script-123",
          expect.objectContaining({
            title: "Mobile Lighting Secrets — 30s Masterclass",
          })
        );
        expect(
          screen.getByText("Mobile Lighting Secrets — Version 2 Enhanced")
        ).toBeInTheDocument();
      });
    });
  });
});
