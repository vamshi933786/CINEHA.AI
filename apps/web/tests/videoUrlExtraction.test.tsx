import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VideoURLInputPanel } from "@/components/scripts/VideoURLInputPanel";
import { ExtractedVideoScriptPanel } from "@/components/scripts/ExtractedVideoScriptPanel";
import { ScriptWorkspace } from "@/components/scripts/ScriptWorkspace";
import { api } from "../lib/api";
import type { VideoURLScriptExtraction } from "@/types/scriptInput";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock api
vi.mock("../lib/api", () => ({
  api: {
    extractScriptFromUrl: vi.fn(),
    generateScriptFromUrl: vi.fn(),
    saveImportedScript: vi.fn(),
    generateScript: vi.fn(),
    getScript: vi.fn(),
    getScriptVersions: vi.fn().mockResolvedValue([]),
    updateScript: vi.fn(),
  },
}));

// Mock creator profile provider
vi.mock("@/providers/CreatorProfileProvider", () => ({
  useCreatorProfile: () => ({
    profile: {
      creator_name: "Test Creator",
      niche: "Cinema",
      content_tones: ["Cinematic", "Engaging"],
      primary_language: "English",
    },
    isConfigured: true,
  }),
}));

const mockExtractionYouTube: VideoURLScriptExtraction = {
  source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  platform: "YouTube",
  video_id: "dQw4w9WgXcQ",
  title: "Cinematic 24fps Setting",
  creator_name: "IndieFilmLab",
  duration_seconds: 45.0,
  language: "English",
  transcript: "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
  segments: [
    { id: "seg_0", start: 0.0, end: 4.0, text: "Stop shooting at 60fps!" },
    { id: "seg_1", start: 4.0, end: 10.0, text: "Here is the 1-second camera setting." },
  ],
  extraction_method: "official_transcript",
  transcription_provider: "youtube_transcript_api",
  confidence: 0.98,
  source_type: "video_url",
  warnings: [],
};

const mockGeneratedScript = {
  id: "script-gen-123",
  title: "Cinematic 24fps Setting (Improve Hook)",
  topic: "Cinematic 24fps Setting",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 30,
  tone: "Cinematic, High-Retention",
  hook: "Why 99% of phone footage looks like cheap home video — and the 24fps fix.",
  cta: "Save this camera setting for your next shoot.",
  segments: [
    {
      id: "seg_1",
      start_time: "0:00",
      end_time: "0:04",
      section: "HOOK",
      voiceover: "Why 99% of phone footage looks like cheap home video — and the 24fps fix.",
      visual_direction: "Macro camera dolly in with shallow depth of field.",
      on_screen_text: "THE 24FPS RULE 🎬",
    },
    {
      id: "seg_2",
      start_time: "0:04",
      end_time: "0:15",
      section: "CORE CONCEPT",
      voiceover: "Lock your shutter speed at 1/50th of a second to get natural motion blur.",
      visual_direction: "Creator holds phone showing manual camera settings.",
      on_screen_text: "SHUTTER SPEED 1/50s",
    },
  ],
  provider_used: "gemini",
  current_version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("Video URL Script Extraction Frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("VideoURLInputPanel", () => {
    it("renders URL input, language selector, and action button", () => {
      const handleExtracted = vi.fn();
      render(<VideoURLInputPanel onExtracted={handleExtracted} />);

      expect(screen.getByText("Video URL Script Extraction")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
      ).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("Telugu")).toBeInTheDocument();
      expect(screen.getByText("Tanglish")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Extract Video Script/i })).toBeInTheDocument();
    });

    it("detects YouTube platform dynamically when typing", () => {
      const handleExtracted = vi.fn();
      render(<VideoURLInputPanel onExtracted={handleExtracted} />);

      const input = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i);
      fireEvent.change(input, { target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });

      expect(screen.getByText("YouTube Detected")).toBeInTheDocument();
    });

    it("detects Instagram platform dynamically when typing", () => {
      const handleExtracted = vi.fn();
      render(<VideoURLInputPanel onExtracted={handleExtracted} />);

      const input = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i);
      fireEvent.change(input, { target: { value: "https://www.instagram.com/reel/C3zYx1gL9mM/" } });

      expect(screen.getByText("Instagram Detected")).toBeInTheDocument();
    });

    it("rejects TikTok URL with clear error message", async () => {
      const handleExtracted = vi.fn();
      render(<VideoURLInputPanel onExtracted={handleExtracted} />);

      const input = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i);
      fireEvent.change(input, { target: { value: "https://www.tiktok.com/@user/video/12345" } });

      const submitBtn = screen.getByRole("button", { name: /Extract Video Script/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/TikTok is not supported in this phase\. Supported platforms: YouTube and Instagram\./i)
        ).toBeInTheDocument();
      });
      expect(handleExtracted).not.toHaveBeenCalled();
    });

    it("calls api.extractScriptFromUrl and triggers onExtracted callback", async () => {
      const handleExtracted = vi.fn();
      (api.extractScriptFromUrl as any).mockResolvedValueOnce(mockExtractionYouTube);

      render(<VideoURLInputPanel onExtracted={handleExtracted} />);

      const input = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i);
      fireEvent.change(input, { target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });

      const submitBtn = screen.getByRole("button", { name: /Extract Video Script/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.extractScriptFromUrl).toHaveBeenCalledWith({
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          language: "English",
        });
        expect(handleExtracted).toHaveBeenCalledWith(mockExtractionYouTube);
      });
    });
  });

  describe("ExtractedVideoScriptPanel", () => {
    it("renders video metadata, editable transcript, and adaptation goals", () => {
      render(<ExtractedVideoScriptPanel extraction={mockExtractionYouTube} />);

      expect(screen.getByText("Cinematic 24fps Setting")).toBeInTheDocument();
      expect(screen.getByText("@IndieFilmLab")).toBeInTheDocument();
      expect(screen.getByText("Official Captions")).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Stop shooting at 60fps!/i)).toBeInTheDocument();
      expect(screen.getByText("Generate Brand-New Script")).toBeInTheDocument();
      expect(screen.getByText(/Save as Script Studio v1/i)).toBeInTheDocument();
    });

    it("allows editing the transcript before saving", () => {
      render(<ExtractedVideoScriptPanel extraction={mockExtractionYouTube} />);

      const textarea = screen.getByDisplayValue(/Stop shooting at 60fps!/i);
      fireEvent.change(textarea, { target: { value: "Custom modified dialogue line." } });

      expect(screen.getByDisplayValue("Custom modified dialogue line.")).toBeInTheDocument();
    });

    it("generates an adapted screenplay using selected goal", async () => {
      (api.generateScriptFromUrl as any).mockResolvedValueOnce(mockGeneratedScript);

      render(<ExtractedVideoScriptPanel extraction={mockExtractionYouTube} />);

      // Select goal: Improve Hook
      const goalSelect = screen.getAllByRole("combobox")[0];
      fireEvent.change(goalSelect, { target: { value: "Improve Hook" } });

      const generateBtn = screen.getByRole("button", { name: /Generate Improve Hook Screenplay/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(api.generateScriptFromUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            url: mockExtractionYouTube.source_url,
            goal: "Improve Hook",
          })
        );
      });

      // Shows generated screenplay tab
      const screenplayTab = await screen.findByRole("button", { name: /AI Screenplay/i });
      fireEvent.click(screenplayTab);

      await waitFor(
        () => {
          expect(screen.getByText("AI Adapted Screenplay")).toBeInTheDocument();
          expect(screen.getByText("Hook Directive")).toBeInTheDocument();
          expect(screen.getByText(/THE 24FPS RULE/i)).toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });

    it("handles save as script studio version 1", async () => {
      const handleSaved = vi.fn();
      (api.saveImportedScript as any).mockResolvedValueOnce({
        ...mockGeneratedScript,
        id: "saved-script-1",
      });

      render(
        <ExtractedVideoScriptPanel
          extraction={mockExtractionYouTube}
          onScriptSaved={handleSaved}
        />
      );

      const saveBtn = screen.getByRole("button", { name: /Save as Script Studio v1/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(api.saveImportedScript).toHaveBeenCalledWith(
          expect.objectContaining({
            source_type: "video_url",
            source_url: mockExtractionYouTube.source_url,
            source_platform: "YouTube",
          })
        );
        expect(handleSaved).toHaveBeenCalled();
      });
    });

    it("routes cross-module handoff to Retention Analyzer", () => {
      render(<ExtractedVideoScriptPanel extraction={mockExtractionYouTube} />);

      const analyzeBtn = screen.getByRole("button", { name: /Analyze Retention/i });
      fireEvent.click(analyzeBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/analyzer?text=")
      );
    });

    it("routes cross-module handoff to Script Optimizer", () => {
      render(<ExtractedVideoScriptPanel extraction={mockExtractionYouTube} />);

      const optimizeBtn = screen.getByRole("button", { name: /Optimize/i });
      fireEvent.click(optimizeBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/optimizer?text=")
      );
    });
  });

  describe("ScriptWorkspace Mode Switcher", () => {
    it("renders Write Script, Upload File, and Video URL mode options", () => {
      render(<ScriptWorkspace />);

      expect(screen.getByRole("button", { name: /Write Script/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Upload File/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Video URL/i })).toBeInTheDocument();
    });

    it("switches to Video URL panel when clicking Video URL mode", () => {
      render(<ScriptWorkspace />);

      const videoUrlModeBtn = screen.getByRole("button", { name: /Video URL/i });
      fireEvent.click(videoUrlModeBtn);

      expect(screen.getByText("Video URL Script Extraction")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
      ).toBeInTheDocument();
    });
  });
});
