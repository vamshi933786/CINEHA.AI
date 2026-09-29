import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RetentionScoreGauge } from "../components/analyzer/RetentionScoreGauge";
import { CategoryScoresGrid } from "../components/analyzer/CategoryScoresGrid";
import { WeakPointsAndRecommendations } from "../components/analyzer/WeakPointsAndRecommendations";
import { SegmentTimelineAnalysis } from "../components/analyzer/SegmentTimelineAnalysis";
import { ScriptSelector } from "../components/analyzer/ScriptSelector";
import { RetentionWorkspace } from "../components/analyzer/RetentionWorkspace";
import RetentionAnalyzerPage from "../app/analyzer/page";
import { api } from "../lib/api";
import type { ScriptAnalysisResponse } from "../types/analyzer";
import type { Script } from "../types/script";

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

const mockSavedScripts: Script[] = [
  {
    id: "script-101",
    title: "5 Lighting Hacks with Phone",
    topic: "Smartphone Lighting",
    platform: "Instagram Reels",
    language: "English",
    duration_seconds: 30,
    tone: "Cinematic",
    hook: "Stop using your phone flashlight!",
    segments: [],
    cta: "Follow for more",
    provider_used: "heuristic_mock",
    current_version: 1,
    created_at: "2026-09-28T12:00:00Z",
    updated_at: "2026-09-28T12:00:00Z",
  },
  {
    id: "script-102",
    title: "Gimbal Ninja Walk Masterclass",
    topic: "Gimbal Movement",
    platform: "YouTube Shorts",
    language: "Tanglish",
    duration_seconds: 60,
    tone: "Educational",
    hook: "Why your gimbal footage is still shaky",
    segments: [],
    cta: "Save this tip",
    provider_used: "heuristic_mock",
    current_version: 2,
    created_at: "2026-09-28T13:00:00Z",
    updated_at: "2026-09-28T13:00:00Z",
  },
];

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

  // Task 2: Required verification test suites
  it("renders RetentionAnalyzerPage completely with header and breadcrumbs", async () => {
    render(<RetentionAnalyzerPage />);

    expect(screen.getByText("Script Retention Analyzer")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Comprehensive diagnostic engine evaluating 9 psychological short-form retention criteria/
      )
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("91")[0]).toBeInTheDocument();
    });
  });

  it("makes saved scripts available in the selector listbox", async () => {
    vi.mocked(api.getScripts).mockResolvedValue(mockSavedScripts);

    render(
      <ScriptSelector
        currentScriptId={null}
        onSelectScriptId={vi.fn()}
        onAnalyzeSample={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(api.getScripts).toHaveBeenCalled();
    });

    const triggerBtn = screen.getByRole("button", {
      name: /select script to analyze/i,
    });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).toHaveAttribute("aria-expanded", "false");

    // Open dropdown
    fireEvent.click(triggerBtn);
    expect(triggerBtn).toHaveAttribute("aria-expanded", "true");

    // Check that scripts appear in the listbox
    expect(screen.getByText("5 Lighting Hacks with Phone")).toBeInTheDocument();
    expect(screen.getByText("Gimbal Ninja Walk Masterclass")).toBeInTheDocument();
    expect(screen.getByText(/Saved Screenplays \(2\)/)).toBeInTheDocument();
  });

  it("allows user to select a script from the dropdown reliably", async () => {
    vi.mocked(api.getScripts).mockResolvedValue(mockSavedScripts);
    const mockOnSelectScriptId = vi.fn();

    render(
      <ScriptSelector
        currentScriptId={null}
        onSelectScriptId={mockOnSelectScriptId}
        onAnalyzeSample={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(api.getScripts).toHaveBeenCalled();
    });

    // Open dropdown
    const triggerBtn = screen.getByRole("button", {
      name: /select script to analyze/i,
    });
    fireEvent.click(triggerBtn);

    // Click script option
    const optionBtn = screen.getByText("5 Lighting Hacks with Phone");
    fireEvent.click(optionBtn);

    expect(mockOnSelectScriptId).toHaveBeenCalledWith("script-101");
    // Dropdown closes after selection
    expect(triggerBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("passes selected script to analysis in RetentionWorkspace", async () => {
    vi.mocked(api.getScripts).mockResolvedValue(mockSavedScripts);
    vi.mocked(api.analyzeScriptById).mockResolvedValue({
      ...mockAnalysis,
      script_id: "script-101",
      title: "5 Lighting Hacks with Phone",
      overall_score: 87,
    });

    render(<RetentionWorkspace initialScriptId={null} />);

    await waitFor(() => {
      expect(api.getScripts).toHaveBeenCalled();
      expect(api.analyzeScript).toHaveBeenCalled();
    });

    // Open selector
    const triggerBtn = screen.getByRole("button", {
      name: /select script to analyze/i,
    });
    fireEvent.click(triggerBtn);

    // Select script
    const scriptOption = screen.getByText("5 Lighting Hacks with Phone");
    fireEvent.click(scriptOption);

    await waitFor(() => {
      expect(api.analyzeScriptById).toHaveBeenCalledWith("script-101");
      expect(screen.getAllByText("5 Lighting Hacks with Phone").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("87")).toBeInTheDocument();
    });
  });

  it("displays empty script state with studio link when no scripts exist", async () => {
    vi.mocked(api.getScripts).mockResolvedValue([]);

    render(
      <ScriptSelector
        currentScriptId={null}
        onSelectScriptId={vi.fn()}
        onAnalyzeSample={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(api.getScripts).toHaveBeenCalled();
    });

    const triggerBtn = screen.getByRole("button", {
      name: /select script to analyze/i,
    });
    fireEvent.click(triggerBtn);

    expect(
      screen.getByText("No saved screenplays found in Script Studio.")
    ).toBeInTheDocument();
    expect(screen.getByText("Create in Script Studio")).toBeInTheDocument();
  });

  it("renders non-collapsing loading state during script analysis", async () => {
    vi.mocked(api.analyzeScript).mockResolvedValue(mockAnalysis);

    render(<RetentionWorkspace initialScriptId={null} />);

    // Wait for initial analysis to complete
    await waitFor(() => {
      expect(screen.getAllByText("Why 24fps Feels Like Cinema").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("91")[0]).toBeInTheDocument();
    });

    // Now mock a slow re-analysis
    let resolveReanalysis: (val: any) => void;
    const reanalysisPromise = new Promise((resolve) => {
      resolveReanalysis = resolve;
    });
    vi.mocked(api.analyzeScript).mockReturnValue(reanalysisPromise as any);

    const reanalyzeBtn = screen.getByRole("button", { name: /re-analyze/i });
    fireEvent.click(reanalyzeBtn);

    // Shows smooth update banner while keeping the score dashboard mounted
    expect(
      screen.getByText(/Updating 9-dimension retention audit for/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("91")[0]).toBeInTheDocument();

    // Resolve re-analysis
    await act(async () => {
      resolveReanalysis!(mockAnalysis);
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Updating 9-dimension retention audit for/)
      ).not.toBeInTheDocument();
    });
  });

  it("displays dismissible error banner when script analysis fails", async () => {
    vi.mocked(api.analyzeScriptById).mockRejectedValue(
      new Error("Script ID not found in database")
    );

    render(<RetentionWorkspace initialScriptId="invalid-script-id" />);

    await waitFor(() => {
      expect(
        screen.getByText("Script ID not found in database")
      ).toBeInTheDocument();
      expect(screen.getByText("Analysis Error:")).toBeInTheDocument();
    });

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText("Script ID not found in database")
    ).not.toBeInTheDocument();
  });

  it("verifies accessible ARIA, keyboard Escape dismissal, and overscroll-contain", async () => {
    vi.mocked(api.getScripts).mockResolvedValue(mockSavedScripts);

    render(
      <ScriptSelector
        currentScriptId="script-101"
        onSelectScriptId={vi.fn()}
        onAnalyzeSample={vi.fn()}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(api.getScripts).toHaveBeenCalled();
    });

    const triggerBtn = screen.getByRole("button", {
      name: /select script to analyze/i,
    });
    expect(triggerBtn).toHaveAttribute("aria-haspopup", "listbox");
    expect(triggerBtn).toHaveAttribute("aria-expanded", "false");

    // Open dropdown
    fireEvent.click(triggerBtn);
    expect(triggerBtn).toHaveAttribute("aria-expanded", "true");

    const listbox = screen.getByRole("listbox", { name: /saved screenplays/i });
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveClass("overscroll-contain");

    // Options have role="option" and aria-selected
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");

    // Test Escape key closes dropdown
    fireEvent.keyDown(document, { key: "Escape" });
    expect(triggerBtn).toHaveAttribute("aria-expanded", "false");
  });
});
