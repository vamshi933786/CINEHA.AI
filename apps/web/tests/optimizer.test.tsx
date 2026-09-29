import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OptimizationGoalSelector } from "../components/optimizer/OptimizationGoalSelector";
import { OptimizationScoreComparison } from "../components/optimizer/OptimizationScoreComparison";
import { BeforeAfterScriptView } from "../components/optimizer/BeforeAfterScriptView";
import { ChangesSummary } from "../components/optimizer/ChangesSummary";
import { OptimizerToolbar } from "../components/optimizer/OptimizerToolbar";
import { OptimizerWorkspace } from "../components/optimizer/OptimizerWorkspace";
import { api } from "../lib/api";
import type { Script } from "../types/script";
import type {
  ScriptOptimizationResponse,
  OptimizedScriptData,
  OptimizationGoalKey,
} from "../types/optimizer";
import type { ScriptAnalysisResponse } from "../types/analyzer";

// Mock router and searchParams
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === "script_id") return "mock-script-123";
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
    optimizeScript: vi.fn(),
    saveOptimizedScript: vi.fn(),
  },
}));

const mockOriginalScript: Script = {
  id: "mock-script-123",
  title: "Stop Shooting In 60fps",
  topic: "Cinematic Frame Rate",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 15,
  tone: "Dynamic",
  hook: "So basically, you guys shouldn't shoot in 60fps.",
  cta: "So yeah, make sure to like and follow for more.",
  segments: [
    {
      id: "seg_1",
      start_time: "0:00",
      end_time: "0:05",
      section: "HOOK",
      voiceover: "So basically, in my opinion, you guys shouldn't shoot in 60fps.",
      visual_direction: "Creator holding phone looking into camera.",
      b_roll: "Phone screen view",
      on_screen_text: "60fps vs 24fps",
      audio_direction: "Lo-fi beat",
    },
    {
      id: "seg_2",
      start_time: "0:05",
      end_time: "0:15",
      section: "BODY",
      voiceover: "Because you see, 24fps has natural motion blur that looks cinematic.",
      visual_direction: "Side by side shutter angle comparison.",
      b_roll: "B-roll clips",
      on_screen_text: "24fps = Cinema",
      audio_direction: "Subtle riser",
    },
  ],
  current_version: 1,
  provider_used: "heuristic_mock",
  created_at: "2026-09-28T12:00:00Z",
  updated_at: "2026-09-28T12:00:00Z",
};

const mockOptimizedScript: OptimizedScriptData = {
  title: "Stop Shooting In 60fps",
  topic: "Cinematic Frame Rate",
  platform: "Instagram Reels",
  language: "English",
  duration_seconds: 15,
  tone: "Dynamic",
  hook: "Stop shooting at 60fps! Here's the 1-second setting that makes phone video look like cinema.",
  cta: "Save this right now before your next shoot.",
  segments: [
    {
      id: "seg_1",
      start_time: "0:00",
      end_time: "0:03",
      section: "HOOK",
      voiceover: "Stop shooting at 60fps! Here's the 1-second setting that makes phone video look like cinema.",
      visual_direction: "Macro close-up rack focus into iPhone camera sensor.",
      b_roll: "High-contrast split screen comparison",
      on_screen_text: "THE 24FPS CINEMA SECRET 🎬",
      audio_direction: "Sub bass drop with clean vinyl hit",
    },
    {
      id: "seg_2",
      start_time: "0:03",
      end_time: "0:15",
      section: "BODY",
      voiceover: "24fps preserves natural 180-degree motion blur that creates cinematic immersion.",
      visual_direction: "Motion blur motion tracking comparison.",
      b_roll: "Dynamic cinematic footage",
      on_screen_text: "180° SHUTTER RULE",
      audio_direction: "Low synth pulse building tension",
    },
  ],
};

const mockBeforeAnalysis: ScriptAnalysisResponse = {
  script_id: "mock-script-123",
  title: "Stop Shooting In 60fps",
  overall_score: 62,
  overall_rating: "Average",
  hook_clarity: { score: 65, rating: "Moderate", explanation: "Weak conversational opener." },
  hook_strength: { score: 58, rating: "Weak", explanation: "Lacks scroll-stopping psychological tension." },
  pacing_progression: { score: 64, rating: "Slow", explanation: "First beat runs 5 seconds long." },
  information_density: { score: 68, rating: "Acceptable", explanation: "Adequate visual cues." },
  filler_repetition: { score: 52, rating: "Heavy Filler", explanation: "Detected: 'so basically', 'in my opinion', 'you guys'." },
  segment_timing: { score: 60, rating: "Imbalanced", explanation: "Hook exceeds 3-second threshold." },
  curiosity_open_loops: { score: 62, rating: "Low Tension", explanation: "No open loop withholding resolution." },
  cta_strength: { score: 55, rating: "Passive", explanation: "Generic 'like and follow' CTA." },
  overall_retention_potential: { score: 62, rating: "Needs Optimization", explanation: "High drop-off hazard in 0-3s." },
  weak_points: ["Opening hook takes 5 seconds", "Multiple filler phrases"],
  recommendations: ["Cut opening hook under 3s", "Purge conversational fluff"],
  segment_observations: [],
  metrics: {
    total_word_count: 28,
    words_per_second: 1.86,
    pacing_assessment: "Too Slow",
    detected_filler_words: ["so basically", "in my opinion", "you guys"],
    hook_duration_seconds: 5,
    cta_duration_seconds: 4,
  },
  analyzed_at: "2026-09-28T12:00:00Z",
  provider_used: "retention_heuristics",
};

const mockAfterAnalysis: ScriptAnalysisResponse = {
  script_id: "mock-script-123",
  title: "Stop Shooting In 60fps",
  overall_score: 92,
  overall_rating: "Exceptional Retention Potential",
  hook_clarity: { score: 95, rating: "Exceptional", explanation: "Crystal clear benefit under 3s." },
  hook_strength: { score: 96, rating: "Exceptional", explanation: "High psychological tension and pattern interrupt." },
  pacing_progression: { score: 91, rating: "Excellent", explanation: "Hook locked at 3s with high delivery velocity." },
  information_density: { score: 90, rating: "High Value", explanation: "Strong visual and auditory choreography." },
  filler_repetition: { score: 98, rating: "Pristine", explanation: "Zero conversational filler phrases detected." },
  segment_timing: { score: 94, rating: "Optimal", explanation: "Cadence balances platform short-form curve." },
  curiosity_open_loops: { score: 88, rating: "Engaging", explanation: "Secret setting open loop drives watch time." },
  cta_strength: { score: 92, rating: "Decisive", explanation: "Direct, high-intent single action command." },
  overall_retention_potential: { score: 92, rating: "Viral Candidate", explanation: "Minimal drop-off risk." },
  weak_points: [],
  recommendations: ["Maintain current rhythm during live delivery."],
  segment_observations: [],
  metrics: {
    total_word_count: 36,
    words_per_second: 2.4,
    pacing_assessment: "Optimal Short-Form Rhythm",
    detected_filler_words: [],
    hook_duration_seconds: 3,
    cta_duration_seconds: 3,
  },
  analyzed_at: "2026-09-28T12:01:00Z",
  provider_used: "retention_heuristics",
};

const mockOptimizationResponse: ScriptOptimizationResponse = {
  script_id: "mock-script-123",
  original_script: mockOriginalScript,
  optimized_script: mockOptimizedScript,
  analysis_before: mockBeforeAnalysis,
  analysis_after: mockAfterAnalysis,
  changes_made: [
    {
      section: "hook",
      field: "hook",
      before: "So basically, you guys shouldn't shoot in 60fps.",
      after: "Stop shooting at 60fps! Here's the 1-second setting that makes phone video look like cinema.",
      reason: "Replaced conversational opening with scroll-stopping contrarian friction.",
    },
    {
      section: "filler",
      field: "voiceover",
      before: "So basically, in my opinion, you guys shouldn't shoot in 60fps.",
      after: "Stop shooting at 60fps! Here's the 1-second setting that makes phone video look like cinema.",
      reason: "Purged conversational fluff phrases: 'so basically', 'in my opinion', 'you guys'.",
    },
    {
      section: "pacing",
      field: "timing",
      before: "0:00 - 0:05",
      after: "0:00 - 0:03",
      reason: "Tightened opening hook duration to 3 seconds to avoid platform bounce.",
    },
    {
      section: "cta",
      field: "cta",
      before: "So yeah, make sure to like and follow for more.",
      after: "Save this right now before your next shoot.",
      reason: "Replaced weak passive CTA with single urgent conversion action.",
    },
  ],
  optimization_goals: ["improve_hook", "improve_pacing", "remove_filler", "improve_cta"],
  provider_used: "heuristic_mock",
  is_saved: false,
};

describe("Script Optimizer Frontend Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OptimizationGoalSelector", () => {
    it("renders all 6 retention goals and allows toggling", () => {
      const mockToggle = vi.fn();
      const mockSelectAll = vi.fn();
      const mockClearAll = vi.fn();
      const mockInstructions = vi.fn();

      render(
        <OptimizationGoalSelector
          selectedGoals={["improve_hook", "remove_filler"]}
          onToggleGoal={mockToggle}
          onSelectAll={mockSelectAll}
          onClearAll={mockClearAll}
          instructions="Keep it energetic"
          onInstructionsChange={mockInstructions}
        />
      );

      // Verify header and count
      expect(screen.getByText("Target Retention Goals")).toBeInTheDocument();
      expect(screen.getByText("2 Active")).toBeInTheDocument();

      // Verify all 6 goals are rendered
      expect(screen.getByText("Improve Hook")).toBeInTheDocument();
      expect(screen.getByText("Improve Pacing")).toBeInTheDocument();
      expect(screen.getByText("Remove Filler")).toBeInTheDocument();
      expect(screen.getByText("Strengthen Curiosity / Open Loops")).toBeInTheDocument();
      expect(screen.getByText("Improve CTA")).toBeInTheDocument();
      expect(screen.getByText("General Retention Optimization")).toBeInTheDocument();

      // Click on a goal
      fireEvent.click(screen.getByText("Improve Pacing"));
      expect(mockToggle).toHaveBeenCalledWith("improve_pacing");

      // Click select all
      fireEvent.click(screen.getByText("Select All"));
      expect(mockSelectAll).toHaveBeenCalled();

      // Click clear
      fireEvent.click(screen.getByText("Clear"));
      expect(mockClearAll).toHaveBeenCalled();

      // Verify instructions textarea
      const textarea = screen.getByPlaceholderText(/E.g., Preserve the technical jargon/i);
      expect(textarea).toHaveValue("Keep it energetic");
      fireEvent.change(textarea, { target: { value: "New creator instructions" } });
      expect(mockInstructions).toHaveBeenCalledWith("New creator instructions");
    });
  });

  describe("OptimizationScoreComparison", () => {
    it("renders score delta gain, ratings, 9 category comparisons, and disclaimer", () => {
      render(
        <OptimizationScoreComparison
          beforeAnalysis={mockBeforeAnalysis}
          afterAnalysis={mockAfterAnalysis}
        />
      );

      // Check header
      expect(screen.getByText("Retention Score Delta")).toBeInTheDocument();

      // Check delta gain (+30 points)
      expect(screen.getByText("+30 Points Gain")).toBeInTheDocument();

      // Check original score and optimized score
      expect(screen.getAllByText("62")[0]).toBeInTheDocument();
      expect(screen.getAllByText("92")[0]).toBeInTheDocument();

      // Check ratings
      expect(screen.getAllByText("Average")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Exceptional Retention Potential")[0]).toBeInTheDocument();

      // Check 9 retention category labels
      expect(screen.getByText("Hook Clarity")).toBeInTheDocument();
      expect(screen.getByText("Hook Strength")).toBeInTheDocument();
      expect(screen.getByText("Story & Pacing Progression")).toBeInTheDocument();
      expect(screen.getByText("Filler & Repetition")).toBeInTheDocument();
      expect(screen.getByText("Segment Timing")).toBeInTheDocument();
      expect(screen.getByText("Curiosity & Open Loops")).toBeInTheDocument();
      expect(screen.getByText("CTA Strength")).toBeInTheDocument();

      // Check analytical indicator disclaimer
      expect(screen.getByText(/Retention scores are calculated by algorithmic short-form structural heuristics/i)).toBeInTheDocument();
    });
  });

  describe("BeforeAfterScriptView", () => {
    it("renders line-by-line screenplay comparison and supports view mode switching", () => {
      render(
        <BeforeAfterScriptView
          originalScript={mockOriginalScript}
          optimizedScript={mockOptimizedScript}
        />
      );

      // Screenplay comparison header
      expect(screen.getByText("Screenplay Comparison")).toBeInTheDocument();

      // Hooks comparison
      expect(screen.getByText(/So basically, you guys shouldn't shoot in 60fps/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Stop shooting at 60fps! Here's the 1-second setting/i)[0]).toBeInTheDocument();

      // Segments
      expect(screen.getByText("Beat 1")).toBeInTheDocument();
      expect(screen.getByText("Beat 2")).toBeInTheDocument();
      expect(screen.getAllByText("Timing Adjusted")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Copy Refined")[0]).toBeInTheDocument();

      // CTA comparison
      expect(screen.getByText(/So yeah, make sure to like and follow for more/i)).toBeInTheDocument();
      expect(screen.getByText(/Save this right now before your next shoot/i)).toBeInTheDocument();

      // View mode toggling
      const originalOnlyBtn = screen.getByText("Original");
      fireEvent.click(originalOnlyBtn);
      expect(screen.getByText("Original Hook")).toBeInTheDocument();
      expect(screen.queryByText("Optimized Hook")).not.toBeInTheDocument();

      const optimizedOnlyBtn = screen.getByText("Optimized");
      fireEvent.click(optimizedOnlyBtn);
      expect(screen.getByText("Optimized Hook")).toBeInTheDocument();
      expect(screen.queryByText("Original Hook")).not.toBeInTheDocument();
    });
  });

  describe("ChangesSummary", () => {
    it("renders audit trail and filters changes by section", () => {
      render(<ChangesSummary changes={mockOptimizationResponse.changes_made} />);

      expect(screen.getByText("Optimization Audit Trail")).toBeInTheDocument();
      expect(screen.getByText("4 strategic changes applied across screenplay beats")).toBeInTheDocument();

      // Verify change reasons
      expect(screen.getByText("Replaced conversational opening with scroll-stopping contrarian friction.")).toBeInTheDocument();
      expect(screen.getByText("Purged conversational fluff phrases: 'so basically', 'in my opinion', 'you guys'.")).toBeInTheDocument();

      // Filter by section pill
      const hookFilterBtn = screen.getByRole("button", { name: /^hook/i });
      fireEvent.click(hookFilterBtn);
      expect(screen.getByText("Replaced conversational opening with scroll-stopping contrarian friction.")).toBeInTheDocument();
      expect(screen.queryByText("Purged conversational fluff phrases: 'so basically', 'in my opinion', 'you guys'.")).not.toBeInTheDocument();
    });
  });

  describe("OptimizerToolbar", () => {
    it("renders current version, provider engine, copy screenplay, and save button", () => {
      const mockSave = vi.fn();
      const mockOptimize = vi.fn();

      render(
        <OptimizerToolbar
          scriptId="mock-script-123"
          currentVersion={1}
          isSaving={false}
          isOptimizing={false}
          isSaved={false}
          providerUsed="heuristic_mock"
          optimizedScript={mockOptimizedScript}
          onSaveVersion={mockSave}
          onRunOptimization={mockOptimize}
        />
      );

      // Verify versions and links
      expect(screen.getByText("Script Studio")).toBeInTheDocument();
      expect(screen.getByText("Retention Audit")).toBeInTheDocument();
      expect(screen.getByText(/heuristic mock/i)).toBeInTheDocument();
      expect(screen.getByText("v1")).toBeInTheDocument();

      // Save button target version
      const saveBtn = screen.getByText("Save as Version 2");
      expect(saveBtn).toBeInTheDocument();
      fireEvent.click(saveBtn);
      expect(mockSave).toHaveBeenCalled();

      // Re-optimize button
      const reoptimizeBtn = screen.getByText("Re-Optimize");
      fireEvent.click(reoptimizeBtn);
      expect(mockOptimize).toHaveBeenCalled();
    });
  });

  describe("OptimizerWorkspace Integration", () => {
    it("loads script, runs optimization, displays before/after diffs, and saves as new version", async () => {
      (api.getScript as any).mockResolvedValue(mockOriginalScript);
      (api.getScriptVersions as any).mockResolvedValue([
        {
          id: "v1-uuid",
          script_id: "mock-script-123",
          version_number: 1,
          title: "Stop Shooting In 60fps",
          change_summary: "Initial screenplay",
          created_at: "2026-09-28T12:00:00Z",
        },
      ]);
      (api.optimizeScript as any).mockResolvedValue(mockOptimizationResponse);

      const savedScript: Script = {
        ...mockOriginalScript,
        hook: mockOptimizedScript.hook,
        cta: mockOptimizedScript.cta,
        segments: mockOptimizedScript.segments,
        current_version: 2,
      };
      (api.saveOptimizedScript as any).mockResolvedValue(savedScript);

      render(<OptimizerWorkspace />);

      // Wait for script to be loaded
      await waitFor(() => {
        expect(api.getScript).toHaveBeenCalledWith("mock-script-123");
      });

      // Target Retention Goals should be visible
      expect(screen.getByText("Target Retention Goals")).toBeInTheDocument();

      // Run Script Optimization
      const runBtn = screen.getByRole("button", { name: /Run Script Optimization/i });
      fireEvent.click(runBtn);

      // Wait for optimization results to appear
      await waitFor(() => {
        expect(api.optimizeScript).toHaveBeenCalledWith(
          "mock-script-123",
          expect.objectContaining({
            goals: ["improve_hook", "improve_pacing", "remove_filler"],
          })
        );
      });

      // Verification of rendered results
      await waitFor(() => {
        expect(screen.getByText("Retention Score Delta")).toBeInTheDocument();
        expect(screen.getByText("+30 Points Gain")).toBeInTheDocument();
        expect(screen.getByText("Optimization Audit Trail")).toBeInTheDocument();
        expect(screen.getByText("Screenplay Comparison")).toBeInTheDocument();
      });

      // Verify Save as Version 2 button appears
      const saveVersionBtn = screen.getByRole("button", { name: /Save as Version 2/i });
      expect(saveVersionBtn).toBeInTheDocument();

      // Click save
      fireEvent.click(saveVersionBtn);

      await waitFor(() => {
        expect(api.saveOptimizedScript).toHaveBeenCalledWith(
          "mock-script-123",
          expect.objectContaining({
            hook: mockOptimizedScript.hook,
            cta: mockOptimizedScript.cta,
          })
        );
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/Successfully committed changes as Version 2!/i)).toBeInTheDocument();
      });
    });
  });
});
