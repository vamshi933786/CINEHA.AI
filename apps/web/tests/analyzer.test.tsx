import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RetentionScoreGauge } from "../components/analyzer/RetentionScoreGauge";
import { CategoryScoresGrid } from "../components/analyzer/CategoryScoresGrid";
import { WeakPointsAndRecommendations } from "../components/analyzer/WeakPointsAndRecommendations";
import { SegmentTimelineAnalysis } from "../components/analyzer/SegmentTimelineAnalysis";
import { ScriptSelector } from "../components/analyzer/ScriptSelector";
import { RetentionWorkspace } from "../components/analyzer/RetentionWorkspace";
import { api } from "../lib/api";
import type { ScriptAnalysisResponse } from "../types/analyzer";

// Mock router and searchParams
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    analyzeScript: vi.fn(),
    analyzeScriptById: vi.fn(),
    getScripts: vi.fn().mockResolvedValue([]),
  },
}));

const mockAnalysis: ScriptAnalysisResponse = {
  script_id: "test-script-1",
  title: "Why 24fps Feels Like Cinema",
  overall_score: 91,
  overall_rating: "Exceptional Retention Potential",
  hook_clarity: {
    score: 94,
    rating: "Excellent",
    explanation: "Opening hook is concise and delivers core message immediately.",
  },
  hook_strength: {
    score: 95,
    rating: "Exceptional",
    explanation: "Strong psychological friction with scroll-stopping contrarian triggers.",
  },
  pacing_progression: {
    score: 90,
    rating: "Excellent",
    explanation: "Dynamic 4-beat narrative progression transitioning cleanly from hook to payoff.",
  },
  information_density: {
    score: 89,
    rating: "High Value",
    explanation: "High visual and auditory choreography across all screenplay beats.",
  },
  filler_repetition: {
    score: 96,
    rating: "Lean & Direct",
    explanation: "Zero conversational filler phrases detected. Every beat advances the core message.",
  },
  segment_timing: {
    score: 92,
    rating: "Optimal",
    explanation: "All beats conform to standard short-form time boundaries (hook 3.0s, CTA 3.0s).",
  },
  curiosity_open_loops: {
    score: 93,
    rating: "High Curiosity",
    explanation: "Strong psychological open loop established in the first 3 seconds.",
  },
  cta_strength: {
    score: 91,
    rating: "Sharp & Focused",
    explanation: "Single, unambiguous conversion call to action that eliminates decision fatigue.",
  },
  overall_retention_potential: {
    score: 92,
    rating: "Exceptional",
    explanation: "Script demonstrates elite short-form architecture.",
  },
  weak_points: [
    "Visual framing could include more rapid pattern interrupts every 3.5 seconds.",
  ],
  recommendations: [
    "Add punchy uppercase on-screen text punchlines to reinforce spoken takeaways.",
    "Utilize dynamic B-roll cutaways on every key revelation.",
    "Align sound design hits with on-screen text appearances.",
  ],
  segment_observations: [
    {
      segment_id: "seg_1",
      time_range: "0:00–0:03",
      section: "HOOK",
      observation: "Spoken pace is 2.8 wps (8 words in 3.0s). High velocity hook.",
      retention_risk: "low",
      suggestion: null,
    },
    {
      segment_id: "seg_2",
      time_range: "0:03–0:07",
      section: "PROBLEM",
      observation: "Spoken pace is 3.1 wps. Pacing is fast; syllables may blur in fast playback.",
      retention_risk: "medium",
      suggestion: "Shorten spoken dialogue by 2 words.",
    },
  ],
  metrics: {
    total_word_count: 52,
    words_per_second: 2.85,
    pacing_assessment: "Optimal pacing (2.85 wps) — matches native short-form cadence",
    detected_filler_words: [],
    hook_duration_seconds: 3.0,
    cta_duration_seconds: 3.0,
  },
  analyzed_at: "2026-09-28T14:00:00Z",
  provider_used: "heuristic_mock",
};

describe("Script Retention Analyzer Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.analyzeScript).mockResolvedValue(mockAnalysis);
    vi.mocked(api.analyzeScriptById).mockResolvedValue(mockAnalysis);
    vi.mocked(api.getScripts).mockResolvedValue([]);
  });

  it("renders RetentionScoreGauge with correct score, metrics, and rating", () => {
    render(<RetentionScoreGauge analysis={mockAnalysis} />);

    expect(screen.getByText("91")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("Exceptional Retention Potential")).toBeInTheDocument();
    expect(screen.getByText("Why 24fps Feels Like Cinema")).toBeInTheDocument();
    expect(screen.getByText("2.85")).toBeInTheDocument();
    expect(screen.getByText("3s")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
  });

  it("renders CategoryScoresGrid with all 9 retention categories", () => {
    render(<CategoryScoresGrid analysis={mockAnalysis} />);

    expect(screen.getByText("9-Dimension Retention Breakdown")).toBeInTheDocument();

    const expectedLabels = [
      "Hook Clarity",
      "Hook Strength",
      "Story & Pacing Progression",
      "Information Density",
      "Filler & Repetition",
      "Segment Timing",
      "Curiosity & Open Loops",
      "CTA Strength",
      "Retention Potential",
    ];

    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(
      screen.getByText("Opening hook is concise and delivers core message immediately.")
    ).toBeInTheDocument();
  });

  it("renders WeakPointsAndRecommendations and filler word alerts", () => {
    const analysisWithFillers: ScriptAnalysisResponse = {
      ...mockAnalysis,
      metrics: {
        ...mockAnalysis.metrics,
        detected_filler_words: ["basically", "actually"],
      },
      weak_points: ["Spoken pacing is relaxed", "Conversational padding detected"],
    };

    render(<WeakPointsAndRecommendations analysis={analysisWithFillers} />);

    expect(screen.getByText("Identified Retention Hazards")).toBeInTheDocument();
    expect(screen.getByText("Actionable Recommendations")).toBeInTheDocument();
    expect(screen.getByText('"basically"')).toBeInTheDocument();
    expect(screen.getByText('"actually"')).toBeInTheDocument();
    expect(screen.getByText("Spoken pacing is relaxed")).toBeInTheDocument();
  });

  it("renders SegmentTimelineAnalysis with timestamp ranges and risk indicators", () => {
    render(<SegmentTimelineAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText("Beat-by-Beat Timeline Analysis")).toBeInTheDocument();
    expect(screen.getByText("0:00–0:03")).toBeInTheDocument();
    expect(screen.getByText("0:03–0:07")).toBeInTheDocument();
    expect(screen.getByText("HOOK")).toBeInTheDocument();
    expect(screen.getByText("PROBLEM")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
    expect(screen.getByText("Watch Drop-Off")).toBeInTheDocument();
    expect(screen.getByText("Shorten spoken dialogue by 2 words.")).toBeInTheDocument();
  });

  it("renders ScriptSelector and handles preset clicks", () => {
    const mockOnSelect = vi.fn();
    const mockOnAnalyzeSample = vi.fn();

    render(
      <ScriptSelector
        currentScriptId={null}
        onSelectScriptId={mockOnSelect}
        onAnalyzeSample={mockOnAnalyzeSample}
        isLoading={false}
      />
    );

    const viralBtn = screen.getByText("Viral Pace");
    expect(viralBtn).toBeInTheDocument();
    fireEvent.click(viralBtn);
    expect(mockOnAnalyzeSample).toHaveBeenCalledWith("viral");

    const fillerBtn = screen.getByText("Filler Test");
    fireEvent.click(fillerBtn);
    expect(mockOnAnalyzeSample).toHaveBeenCalledWith("filler");
  });

  it("renders RetentionWorkspace and runs default viral analysis", async () => {
    vi.mocked(api.analyzeScript).mockResolvedValue(mockAnalysis);

    render(<RetentionWorkspace initialScriptId={null} />);

    await waitFor(() => {
      expect(api.analyzeScript).toHaveBeenCalled();
      expect(screen.getAllByText("91")[0]).toBeInTheDocument();
      expect(screen.getByText("Exceptional Retention Potential")).toBeInTheDocument();
    });
  });

  it("renders RetentionWorkspace with initialScriptId and calls analyzeScriptById", async () => {
    vi.mocked(api.analyzeScriptById).mockResolvedValue(mockAnalysis);

    render(<RetentionWorkspace initialScriptId="test-script-1" />);

    await waitFor(() => {
      expect(api.analyzeScriptById).toHaveBeenCalledWith("test-script-1");
      expect(screen.getAllByText("91")[0]).toBeInTheDocument();
      expect(screen.getByText("Back to Studio")).toBeInTheDocument();
    });
  });
});
