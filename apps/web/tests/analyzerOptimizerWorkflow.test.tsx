import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RetentionWorkspace } from "../components/analyzer/RetentionWorkspace";
import { OptimizerWorkspace } from "../components/optimizer/OptimizerWorkspace";
import { AnalyzerFindingsCard } from "../components/optimizer/AnalyzerFindingsCard";
import { api } from "../lib/api";
import {
  saveOptimizerHandoff,
  getOptimizerHandoff,
  clearOptimizerHandoff,
  deriveRecommendedOptimizationGoals,
} from "../types/optimizer";
import type { ScriptAnalysisResponse } from "../types/analyzer";
import type { Script } from "../types/script";

// Mock router navigation
const mockPush = vi.fn();
let mockSearchParamsScriptId: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === "script_id") return mockSearchParamsScriptId;
      return null;
    }),
  }),
}));

// Mock API client
vi.mock("../lib/api", () => ({
  api: {
    getScript: vi.fn(),
    getScripts: vi.fn(),
    getScriptVersions: vi.fn(),
    analyzeScript: vi.fn(),
    analyzeScriptById: vi.fn(),
    optimizeScript: vi.fn(),
    saveOptimizedScript: vi.fn(),
    saveImportedScript: vi.fn(),
  },
}));

const mockAnalysisResult: ScriptAnalysisResponse = {
  script_id: "script-uuid-1",
  title: "Why 24fps Feels Like Cinema",
  overall_score: 68,
  overall_rating: "High Drop-off Risk",
  hook_clarity: { score: 65, rating: "Sluggish", explanation: "Hook takes 5 seconds to get to point" },
  hook_strength: { score: 62, rating: "Weak", explanation: "Lacks contrasting tension" },
  pacing_progression: { score: 70, rating: "Uneven", explanation: "Second half drags" },
  information_density: { score: 80, rating: "Good", explanation: "Informative advice" },
  filler_repetition: { score: 58, rating: "Excessive Fluff", explanation: "Multiple filler words" },
  segment_timing: { score: 72, rating: "Acceptable", explanation: "Timing slightly long" },
  curiosity_open_loops: { score: 60, rating: "Closed", explanation: "No curiosity hooks" },
  cta_strength: { score: 64, rating: "Passive", explanation: "Unclear command" },
  overall_retention_potential: { score: 68, rating: "High Drop-off Risk", explanation: "Requires editing" },
  weak_points: [
    "Opening hook takes 5 seconds before presenting value.",
    "Excessive conversational padding ('basically', 'actually').",
    "Closing CTA is passive and polite instead of decisive.",
  ],
  recommendations: [
    "Compress 0–3s hook with contrarian statement.",
    "Purge conversational fluff words.",
    "Switch CTA to single decisive command: 'Save this before your next shoot!'.",
  ],
  segment_observations: [
    {
      segment_id: "seg_1",
      time_range: "0:00–0:05",
      section: "HOOK",
      observation: "Sluggish opening",
      retention_risk: "high",
      suggestion: "Cut to 3s",
    },
  ],
  metrics: {
    total_word_count: 65,
    words_per_second: 2.1,
    pacing_assessment: "Sluggish",
    detected_filler_words: ["basically", "actually", "hey guys"],
    hook_duration_seconds: 5.0,
    cta_duration_seconds: 4.0,
  },
  analyzed_at: new Date().toISOString(),
  provider_used: "heuristic_mock",
};

const mockSavedScript: Script = {
  id: "script-uuid-1",
  title: "Why 24fps Feels Like Cinema",
  topic: "Cinematography",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 30,
  tone: "Cinematic",
  hook: "Hey guys, in this video I basically want to show you camera frame rates.",
  cta: "So yeah, kind of like and subscribe.",
  segments: [
    {
      id: "seg_1",
      start_time: "0:00",
      end_time: "0:05",
      section: "HOOK",
      voiceover: "Hey guys, in this video I basically want to show you camera frame rates.",
      visual_direction: "Creator holding phone.",
      b_roll: "",
      on_screen_text: "",
      audio_direction: "",
    },
    {
      id: "seg_2",
      start_time: "0:05",
      end_time: "0:25",
      section: "BODY",
      voiceover: "Actually, 24fps gives natural motion blur.",
      visual_direction: "Side-by-side shot.",
      b_roll: "",
      on_screen_text: "",
      audio_direction: "",
    },
    {
      id: "seg_3",
      start_time: "0:25",
      end_time: "0:30",
      section: "CTA",
      voiceover: "So yeah, kind of like and subscribe.",
      visual_direction: "Creator waving.",
      b_roll: "",
      on_screen_text: "",
      audio_direction: "",
    },
  ],
  provider_used: "ai_script_agent",
  current_version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  versions: [
    {
      id: "v1-uuid",
      script_id: "script-uuid-1",
      version_number: 1,
      title: "Why 24fps Feels Like Cinema",
      hook: "Hey guys, in this video I basically want to show you camera frame rates.",
      cta: "So yeah, kind of like and subscribe.",
      segments: [],
      change_summary: "Initial draft",
      provider_used: "ai_script_agent",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

describe("Analyzer → Optimizer Unified Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearOptimizerHandoff();
    mockSearchParamsScriptId = null;

    vi.mocked(api.analyzeScript).mockResolvedValue(mockAnalysisResult);
    vi.mocked(api.analyzeScriptById).mockResolvedValue(mockAnalysisResult);
    vi.mocked(api.getScript).mockResolvedValue(mockSavedScript);
    vi.mocked(api.getScripts).mockResolvedValue([mockSavedScript]);
    vi.mocked(api.getScriptVersions).mockResolvedValue(mockSavedScript.versions ?? []);
  });

  it("derives recommended optimization goals from analyzer weak points and scores", () => {
    const goals = deriveRecommendedOptimizationGoals(mockAnalysisResult);

    expect(goals).toContain("improve_hook");
    expect(goals).toContain("remove_filler");
    expect(goals).toContain("improve_pacing");
    expect(goals).toContain("strengthen_curiosity");
    expect(goals).toContain("improve_cta");
  });

  it("renders 'Optimize Script' in RetentionWorkspace and packages handoff payload on click", async () => {
    render(<RetentionWorkspace initialScriptId="script-uuid-1" />);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getAllByText(/Why 24fps Feels Like Cinema/i)[0]).toBeInTheDocument();
    });

    // Verify 'Optimize Script' button exists
    const optimizeBtn = screen.getAllByRole("button", { name: /Optimize Script/i })[0];
    expect(optimizeBtn).toBeInTheDocument();

    // Click Optimize Script
    fireEvent.click(optimizeBtn);

    // Verify router navigation
    expect(mockPush).toHaveBeenCalledWith("/optimizer?script_id=script-uuid-1&from=analyzer");

    // Verify sessionStorage has handoff payload
    const handoff = getOptimizerHandoff();
    expect(handoff).not.toBeNull();
    expect(handoff?.scriptId).toBe("script-uuid-1");
    expect(handoff?.title).toBe("Why 24fps Feels Like Cinema");
    expect(handoff?.weakPoints).toContain("Opening hook takes 5 seconds before presenting value.");
    expect(handoff?.recommendedGoals).toContain("improve_hook");
  });

  it("renders AnalyzerFindingsCard with diagnostic score, drop-off hazards, and fluff tags", () => {
    const handleApplyGoals = vi.fn();

    render(
      <AnalyzerFindingsCard
        analysis={mockAnalysisResult}
        selectedGoals={["improve_hook"]}
        onApplyGoals={handleApplyGoals}
        scriptId="script-uuid-1"
      />
    );

    // Verify score badge
    expect(screen.getByText("68/100")).toBeInTheDocument();
    expect(screen.getByText("Analyzer Diagnostic Context")).toBeInTheDocument();

    // Verify weak points
    expect(
      screen.getByText(/Opening hook takes 5 seconds before presenting value/i)
    ).toBeInTheDocument();

    // Verify detected fluff
    expect(screen.getByText(/"basically"/i)).toBeInTheDocument();
    expect(screen.getByText(/"actually"/i)).toBeInTheDocument();

    // Click Apply Recommended Goals
    const applyBtn = screen.getByRole("button", { name: /Apply Recommended Goals/i });
    fireEvent.click(applyBtn);

    expect(handleApplyGoals).toHaveBeenCalledTimes(1);
    const [appliedGoals] = handleApplyGoals.mock.calls[0];
    expect(appliedGoals).toContain("improve_hook");
    expect(appliedGoals).toContain("remove_filler");
  });

  it("OptimizerWorkspace loads handoff from Analyzer, displays findings, and highlights recommended goals", async () => {
    // Populate sessionStorage with handoff
    saveOptimizerHandoff({
      scriptId: "script-uuid-1",
      title: "Why 24fps Feels Like Cinema",
      analysis: mockAnalysisResult,
      weakPoints: mockAnalysisResult.weak_points,
      recommendations: mockAnalysisResult.recommendations,
      recommendedGoals: ["improve_hook", "remove_filler", "improve_cta"],
      timestamp: Date.now(),
    });

    render(<OptimizerWorkspace />);

    // Wait for script to load
    await waitFor(() => {
      expect(screen.getByText("Analyzer Diagnostic Context")).toBeInTheDocument();
    });

    // Check that recommended goals are highlighted
    expect(screen.getAllByText("Recommended").length).toBeGreaterThan(0);
  });

  it("handles non-mutating preview and explicit save creates a new immutable version", async () => {
    mockSearchParamsScriptId = "script-uuid-1";

    const mockOptimizedResult = {
      script_id: "script-uuid-1",
      original_script: mockSavedScript,
      optimized_script: {
        title: "Why 24fps Feels Like Cinema (Optimized)",
        topic: "Cinematography",
        platform: "Instagram Reels",
        language: "English",
        duration_seconds: 30,
        tone: "Cinematic",
        hook: "Stop shooting at 60fps! Here's the 1-second cinema setting.",
        segments: [
          {
            id: "seg_1",
            start_time: "0:00",
            end_time: "0:03",
            section: "HOOK",
            voiceover: "Stop shooting at 60fps! Here's the 1-second cinema setting.",
            visual_direction: "Macro zoom.",
            b_roll: "",
            on_screen_text: "24FPS SECRET",
            audio_direction: "Sub-drop",
          },
        ],
        cta: "Save this before your next shoot!",
      },
      analysis_before: mockAnalysisResult,
      analysis_after: {
        ...mockAnalysisResult,
        overall_score: 88,
        overall_rating: "Excellent Retention Potential",
      },
      changes_made: [
        {
          section: "HOOK",
          field: "voiceover",
          before: mockSavedScript.hook,
          after: "Stop shooting at 60fps! Here's the 1-second cinema setting.",
          reason: "Enhanced hook friction and trimmed 2 seconds.",
        },
      ],
      optimization_goals: ["improve_hook", "remove_filler"],
      provider_used: "heuristic_mock",
      is_saved: false,
    };

    vi.mocked(api.optimizeScript).mockResolvedValue(mockOptimizedResult);

    render(<OptimizerWorkspace />);

    // Wait for script to load
    await waitFor(() => {
      expect(screen.getByText(/Ready to optimize/i)).toBeInTheDocument();
    });

    // Trigger optimization preview
    const runBtn = screen.getByRole("button", { name: /Run Script Optimization/i });
    fireEvent.click(runBtn);

    // Verify preview renders before/after score delta without mutating
    await waitFor(() => {
      expect(screen.getByText("Retention Score Delta")).toBeInTheDocument();
      expect(screen.getByText("+20 Points Gain")).toBeInTheDocument();
      expect(screen.getByText("Screenplay Comparison")).toBeInTheDocument();
    });

    // Now explicitly save as new version
    const updatedScript = {
      ...mockSavedScript,
      current_version: 2,
      hook: "Stop shooting at 60fps! Here's the 1-second cinema setting.",
    };
    vi.mocked(api.saveOptimizedScript).mockResolvedValue(updatedScript);

    const saveBtn = screen.getByRole("button", { name: /Save as Version 2/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Saved as New Version")).toBeInTheDocument();
      expect(
        screen.getByText(/Successfully committed changes as Version 2! Original version preserved/i)
      ).toBeInTheDocument();
      expect(screen.getByText("View in Studio")).toBeInTheDocument();
      expect(screen.getByText("Re-audit Retention")).toBeInTheDocument();
    });
  });

  it("handles unsaved custom screenplay draft from Unified Input in memory and commits as Version 1", async () => {
    // Populate sessionStorage with unsaved script handoff
    saveOptimizerHandoff({
      scriptId: null, // Unsaved
      title: "Smartphone Lighting Advice",
      scriptText: "Hey guys, in this video basically use natural light. Save this advice!",
      sourceType: "image",
      language: "English",
      durationSeconds: 30,
      hook: "Hey guys, in this video basically use natural light.",
      cta: "Save this advice!",
      analysis: mockAnalysisResult,
      weakPoints: mockAnalysisResult.weak_points,
      recommendations: mockAnalysisResult.recommendations,
      recommendedGoals: ["remove_filler", "improve_hook"],
      timestamp: Date.now(),
    });

    const mockCustomOptimizedResult = {
      script_id: "custom",
      original_script: {
        ...mockSavedScript,
        id: "custom",
        title: "Smartphone Lighting Advice",
      },
      optimized_script: {
        title: "Smartphone Lighting Advice (Optimized)",
        topic: "Screenplay",
        platform: "Instagram Reels",
        language: "English",
        duration_seconds: 30,
        tone: "Cinematic",
        hook: "Never face the window directly! Here is the studio secret.",
        segments: [],
        cta: "Save this advice!",
      },
      analysis_before: mockAnalysisResult,
      analysis_after: {
        ...mockAnalysisResult,
        overall_score: 84,
      },
      changes_made: [],
      optimization_goals: ["remove_filler", "improve_hook"],
      provider_used: "heuristic_mock",
      is_saved: false,
    };

    vi.mocked(api.optimizeScript).mockResolvedValue(mockCustomOptimizedResult);

    render(<OptimizerWorkspace />);

    // Check draft disclosure banner is present
    await waitFor(() => {
      expect(screen.getByText("Draft in Memory")).toBeInTheDocument();
      expect(screen.getByText(/Optimizing draft from/i)).toBeInTheDocument();
    });

    // Run optimization
    const runBtn = screen.getByRole("button", { name: /Run Script Optimization/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText("Retention Score Delta")).toBeInTheDocument();
    });

    // Check save button is tailored for custom script: Save to Script Studio as Version 1
    const saveBtn = screen.getByRole("button", {
      name: /Save to Script Studio as Version 1/i,
    });
    expect(saveBtn).toBeInTheDocument();

    const mockSavedFromCustom = {
      ...mockSavedScript,
      id: "new-saved-uuid-999",
      title: "Smartphone Lighting Advice (Optimized)",
      current_version: 1,
    };
    vi.mocked(api.saveImportedScript).mockResolvedValue(mockSavedFromCustom);

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Saved as new version \(v1\) in Script Studio/i)).toBeInTheDocument();
    });
  });

  it("gracefully displays error banner when script fails to load", async () => {
    mockSearchParamsScriptId = "non-existent-script-id";
    vi.mocked(api.getScript).mockRejectedValue(new Error("Script ID not found in database"));

    render(<OptimizerWorkspace />);

    await waitFor(() => {
      expect(screen.getByText("Optimization Notice")).toBeInTheDocument();
      expect(screen.getByText("Script ID not found in database")).toBeInTheDocument();
    });

    // Dismiss error
    const dismissBtn = screen.getByRole("button", { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText("Script ID not found in database")).not.toBeInTheDocument();
  });
});
