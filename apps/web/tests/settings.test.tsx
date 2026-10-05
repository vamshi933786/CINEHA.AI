import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SettingsWorkspace } from "../components/settings/SettingsWorkspace";
import {
  loadAppSettings,
  saveAppSettings,
  resetAppSettings,
  clearLocalPreferences,
} from "../lib/settingsStorage";
import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from "../types/settings";
import { CAPTION_TEMPLATES } from "../components/captions/captionTemplates";
import { api } from "../lib/api";

// Mock the API client
vi.mock("../lib/api", () => ({
  api: {
    checkHealth: vi.fn().mockResolvedValue({
      status: "healthy",
      project_name: "CINEHA AI API",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      active_provider: "gemini",
      max_video_size_mb: 100,
      timestamp: "2026-10-05T12:00:00Z",
    }),
    getHealthProvidersDiagnostic: vi.fn().mockResolvedValue({
      active_provider: "gemini",
      selected_llm_provider: "GeminiLLMProvider",
      gemini: {
        configured: true,
        model: "gemini-3.5-flash-lite",
        provider_class: "GeminiLLMProvider",
        supported_features: ["hook_generator", "script_generator"],
        fallback_provider: "OfflineHeuristicMockProvider",
      },
      local_whisper: {
        available: true,
        model: "base",
        provider_class: "LocalWhisperTranscriptionProvider",
      },
      caption_transcription: {
        active_provider: "local_whisper",
        model: "whisper-1",
        configured: false,
        engine: "OpenAI Whisper",
      },
    }),
  },
}));

describe("Settings Module — CINEHAI AI", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Settings Storage Layer", () => {
    it("returns DEFAULT_APP_SETTINGS when localStorage is empty", () => {
      const settings = loadAppSettings();
      expect(settings).toEqual(DEFAULT_APP_SETTINGS);
      expect(settings.version).toBe(1);
      expect(settings.appearance.theme).toBe("dark");
      expect(settings.ai.preferredLLM).toBe("gemini");
      expect(settings.ai.preferredTranscription).toBe("local_whisper");
      expect(settings.captions.templateId).toBe("clean");
      expect(settings.captions.positionX).toBe(50);
      expect(settings.captions.positionY).toBe(82);
    });

    it("recovers gracefully from corrupted JSON in localStorage", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(SETTINGS_STORAGE_KEY, "invalid-not-json-{{{");

      const loaded = loadAppSettings();
      expect(loaded).toEqual(DEFAULT_APP_SETTINGS);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("recovers gracefully when stored value is not an object", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify("a string"));

      const loaded = loadAppSettings();
      expect(loaded).toEqual(DEFAULT_APP_SETTINGS);
      consoleWarnSpy.mockRestore();
    });

    it("saves updates and persists to localStorage", () => {
      const updated = saveAppSettings({
        appearance: {
          theme: "light",
          reducedMotion: true,
          density: "compact",
        },
      });

      expect(updated.appearance.theme).toBe("light");
      expect(updated.appearance.reducedMotion).toBe(true);
      expect(updated.appearance.density).toBe("compact");

      const reloaded = loadAppSettings();
      expect(reloaded.appearance.theme).toBe("light");
      expect(reloaded.appearance.reducedMotion).toBe(true);
      expect(reloaded.appearance.density).toBe("compact");
      // Other categories remain defaults
      expect(reloaded.ai.preferredLLM).toBe("gemini");
    });

    it("resets settings to factory defaults without deleting creator profile", () => {
      // Simulate existing creator profile in localStorage
      localStorage.setItem("cineha_creator_profile", JSON.stringify({ creator_name: "Sai Panga" }));

      // Customize settings
      saveAppSettings({
        appearance: {
          theme: "light",
          reducedMotion: true,
          density: "compact",
        },
      });

      const reset = resetAppSettings();
      expect(reset).toEqual(DEFAULT_APP_SETTINGS);
      expect(loadAppSettings().appearance.theme).toBe("dark");

      // Creator profile is completely preserved
      expect(localStorage.getItem("cineha_creator_profile")).not.toBeNull();
      expect(JSON.parse(localStorage.getItem("cineha_creator_profile")!).creator_name).toBe("Sai Panga");
    });

    it("clears local preferences key from localStorage", () => {
      saveAppSettings({
        appearance: { theme: "light", reducedMotion: true, density: "compact" },
      });
      expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).not.toBeNull();

      clearLocalPreferences();
      expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
      expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
    });
  });

  describe("SettingsWorkspace Component", () => {
    it("renders the 8 settings navigation tabs correctly", async () => {
      render(<SettingsWorkspace />);

      expect(screen.getByTestId("settings-nav-appearance")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-providers")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-language")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-video")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-captions")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-privacy")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-diagnostics")).toBeInTheDocument();
      expect(screen.getByTestId("settings-nav-about")).toBeInTheDocument();
    });

    it("allows updating theme, reduced motion, and interface density in Appearance tab", async () => {
      render(<SettingsWorkspace />);

      // Appearance is the initial active tab
      expect(screen.getByText("Studio Theme")).toBeInTheDocument();

      // Click Clean Light theme
      const lightBtn = screen.getByRole("button", { name: /clean light/i });
      fireEvent.click(lightBtn);

      // Toggle reduced motion
      const motionCheckbox = screen.getByLabelText(/toggle reduced motion/i);
      fireEvent.click(motionCheckbox);
      expect(motionCheckbox).toBeChecked();

      // Click Compact density
      const compactBtn = screen.getByRole("button", { name: /compact/i });
      fireEvent.click(compactBtn);

      // Verify persistence in localStorage
      await waitFor(() => {
        const saved = loadAppSettings();
        expect(saved.appearance.theme).toBe("light");
        expect(saved.appearance.reducedMotion).toBe(true);
        expect(saved.appearance.density).toBe("compact");
      });
    });

    it("displays AI Providers section and verifies Zero-Leak Guarantee (no exposed secrets)", async () => {
      render(<SettingsWorkspace />);

      // Navigate to AI Providers tab
      fireEvent.click(screen.getByTestId("settings-nav-providers"));

      // Check header and cards
      expect(screen.getByText("Google Gemini")).toBeInTheDocument();
      expect(screen.getAllByText("Local Whisper")[0]).toBeInTheDocument();
      expect(screen.getByText("OpenAI Whisper Cloud")).toBeInTheDocument();
      expect(screen.getByText("Offline Mock Engine")).toBeInTheDocument();

      // Check Zero-Leak security banner
      expect(screen.getByText(/zero-leak security architecture/i)).toBeInTheDocument();

      // Strict security assertion: No raw secrets or API keys in rendered DOM
      const domText = document.body.textContent || "";
      expect(domText.toLowerCase()).not.toContain("api_key=");
      expect(domText.toLowerCase()).not.toContain("sk-");
      expect(domText.toLowerCase()).not.toContain("bearer ey");
    });

    it("verifies Language tab options and confirms NO Hindi in caption defaults", async () => {
      render(<SettingsWorkspace />);

      // Navigate to Language tab
      fireEvent.click(screen.getByTestId("settings-nav-language"));

      // Check caption languages
      expect(screen.getByText(/తెలుగు \(native telugu\)/i)).toBeInTheDocument();
      expect(screen.getByText(/tanglish \(romanized telugu\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/english/i).length).toBeGreaterThan(0);

      // CRITICAL REQUIREMENT: Explicitly assert Hindi is NOT present in caption defaults
      expect(screen.queryByText(/hindi/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/devanagari/i)).not.toBeInTheDocument();
    });

    it("configures Video Defaults and confirms 100MB server limit badge", async () => {
      render(<SettingsWorkspace />);

      // Navigate to Video Defaults tab
      fireEvent.click(screen.getByTestId("settings-nav-video"));

      // Check 100MB limit badge
      expect(screen.getByText(/100 mb max/i)).toBeInTheDocument();
      expect(screen.getByText(/9:16 vertical/i)).toBeInTheDocument();
      expect(screen.getByText(/1:1 square/i)).toBeInTheDocument();
      expect(screen.getByText(/16:9 landscape/i)).toBeInTheDocument();

      // Select 1:1 Square
      const squareBtn = screen.getByRole("button", { name: /1:1 square/i });
      fireEvent.click(squareBtn);

      await waitFor(() => {
        expect(loadAppSettings().video.defaultAspectRatio).toBe("1:1");
      });
    });

    it("verifies all 10 caption templates, positioning sliders, and safe area in Caption Defaults", async () => {
      render(<SettingsWorkspace />);

      // Navigate to Caption Defaults tab
      fireEvent.click(screen.getByTestId("settings-nav-captions"));

      // Verify all 10 templates are present
      expect(CAPTION_TEMPLATES).toHaveLength(10);
      CAPTION_TEMPLATES.forEach((tmpl) => {
        expect(screen.getAllByText(tmpl.name)[0]).toBeInTheDocument();
      });

      // Click Hormozi Impact template
      const hormoziBtn = screen.getByTestId("caption-template-hormozi");
      fireEvent.click(hormoziBtn);

      // Check position sliders
      const xSlider = screen.getByLabelText(/caption horizontal position x/i);
      const ySlider = screen.getByLabelText(/caption vertical position y/i);
      expect(xSlider).toBeInTheDocument();
      expect(ySlider).toBeInTheDocument();

      fireEvent.change(xSlider, { target: { value: "45" } });
      fireEvent.change(ySlider, { target: { value: "75" } });

      await waitFor(() => {
        const current = loadAppSettings();
        expect(current.captions.templateId).toBe("hormozi");
        expect(current.captions.positionX).toBe(45);
        expect(current.captions.positionY).toBe(75);
      });
    });

    it("handles Privacy section, opens ConfirmationModal, and resets settings", async () => {
      render(<SettingsWorkspace />);

      // Navigate to Privacy tab
      fireEvent.click(screen.getByTestId("settings-nav-privacy"));

      // Check transparency disclosures
      expect(screen.getByText(/transient video purge/i)).toBeInTheDocument();
      expect(screen.getByText(/zero cloud voice retention/i)).toBeInTheDocument();
      expect(screen.getByText(/local client preferences/i)).toBeInTheDocument();

      // Click Reset to Defaults button
      const resetBtn = screen.getByRole("button", { name: /reset to defaults/i });
      fireEvent.click(resetBtn);

      // ConfirmationModal is displayed
      expect(screen.getByText(/reset all settings to factory defaults\?/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /yes, reset settings/i })).toBeInTheDocument();

      // Click Confirm in modal
      const confirmBtn = screen.getByRole("button", { name: /yes, reset settings/i });
      fireEvent.click(confirmBtn);

      // Modal closes and settings are default
      await waitFor(() => {
        expect(screen.queryByText(/reset all settings to factory defaults\?/i)).not.toBeInTheDocument();
        expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
      });
    });

    it("runs live diagnostics in System Diagnostics tab and displays operational status", async () => {
      render(<SettingsWorkspace />);

      // Navigate to System Diagnostics tab
      fireEvent.click(screen.getByTestId("settings-nav-diagnostics"));

      // Check diagnostics header and initial state
      expect(screen.getByRole("heading", { name: "System Diagnostics" })).toBeInTheDocument();
      expect(screen.getByText("FastAPI Backend")).toBeInTheDocument();
      expect(screen.getByText("SQLite Database")).toBeInTheDocument();

      // Wait for initial inspection to complete and trigger Run Diagnostics
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /run diagnostics/i })).toBeInTheDocument();
      });
      const runBtn = screen.getByRole("button", { name: /run diagnostics/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(api.checkHealth).toHaveBeenCalled();
        expect(api.getHealthProvidersDiagnostic).toHaveBeenCalled();
      });
    });

    it("renders About tab with Sai Panga creator persona and active modules list", async () => {
      render(<SettingsWorkspace />);

      // Navigate to About tab
      fireEvent.click(screen.getByTestId("settings-nav-about"));

      // Check creator persona attribution
      expect(screen.getByRole("heading", { name: "Sai Panga" })).toBeInTheDocument();
      expect(screen.getByText(/creator & filmmaker/i)).toBeInTheDocument();
      expect(screen.getByText(/verified studio owner/i)).toBeInTheDocument();

      // Check active authentic product modules
      expect(screen.getByText("Hook Generator")).toBeInTheDocument();
      expect(screen.getByText("Script Studio")).toBeInTheDocument();
      expect(screen.getByText("Retention Analyzer")).toBeInTheDocument();
      expect(screen.getByText("Script Optimizer")).toBeInTheDocument();
      expect(screen.getByText("Caption Studio")).toBeInTheDocument();
      expect(screen.getByText("Video Analysis")).toBeInTheDocument();
      expect(screen.getByText("Creator Profile")).toBeInTheDocument();
      expect(screen.getByText("Content Calendar")).toBeInTheDocument();

      // Check technical stack details
      expect(screen.getByText("Next.js 14 App Router")).toBeInTheDocument();
      expect(screen.getByText("FastAPI + AsyncIO")).toBeInTheDocument();
    });
  });
});
