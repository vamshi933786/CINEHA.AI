import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CategoryScoresGrid } from "../components/analyzer/CategoryScoresGrid";
import { OptimizationGoalSelector } from "../components/optimizer/OptimizationGoalSelector";
import { RetentionWorkspace } from "../components/analyzer/RetentionWorkspace";
import {
  deriveRecommendedOptimizationGoals,
  LOCALIZED_GOAL_LABELS,
} from "../types/optimizer";
import { LOCALIZED_CATEGORY_LABELS, type ScriptAnalysisResponse } from "../types/analyzer";
import { api } from "../lib/api";

// Mock router navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock API client
vi.mock("../lib/api", () => ({
  api: {
    getScript: vi.fn(),
    getScripts: vi.fn().mockResolvedValue([]),
    getScriptVersions: vi.fn().mockResolvedValue([]),
    analyzeScript: vi.fn(),
    analyzeScriptById: vi.fn(),
    optimizeScript: vi.fn(),
    saveOptimizedScript: vi.fn(),
    saveImportedScript: vi.fn(),
  },
}));

const mockTeluguAnalysis: ScriptAnalysisResponse = {
  script_id: "telugu-1",
  title: "ఫోన్ సినిమా వీడియో",
  language: "Telugu",
  overall_score: 85,
  overall_rating: "బలమైన రీటెన్షన్ సామర్థ్యం (Strong Retention)",
  hook_clarity: { score: 75, rating: "మధ్యస్థం", explanation: "మొదటి 3 సెకన్లలో హుక్ వేగాన్ని పెంచాలి." },
  hook_strength: { score: 78, rating: "మంచిది", explanation: "ఆసక్తికరమైన ప్రారంభం." },
  pacing_progression: { score: 85, rating: "వేగవంతమైనది", explanation: "కథ వేగం సరైనది." },
  information_density: { score: 82, rating: "సమతుల్యం", explanation: "సమాచారం చక్కగా ఉంది." },
  filler_repetition: { score: 70, rating: "వృథా పదాలు", explanation: "కొన్ని వృథా పదాలు ఉన్నాయి." },
  segment_timing: { score: 88, rating: "ఉత్తమం", explanation: "సమయం బాగుంది." },
  curiosity_open_loops: { score: 72, rating: "తక్కువ", explanation: "ఆసక్తిని పెంచే ఓపెన్ లూప్స్ అవసరం." },
  cta_strength: { score: 75, rating: "స్పష్టత అవసరం", explanation: "యాక్షన్ మరింత స్పష్టంగా ఉండాలి." },
  overall_retention_potential: { score: 85, rating: "మంచి రీటెన్షన్", explanation: "వీక్షకులు చివరిదాకా చూస్తారు." },
  weak_points: [
    "హుక్ ప్రారంభంలో కొద్దిగా బలహీనంగా ఉంది.",
    "వృథా పదాలు మరియు పునరావృతం తగ్గించాలి.",
    "వీక్షకులలో ఆసక్తి మరియు కుతూహలం పెంచాలి.",
  ],
  recommendations: [
    "మొదటి 2 సెకన్లలోనే ప్రధాన సీక్రెట్ వెల్లడించండి.",
    "చివరిలో స్పష్టమైన కాల్ టు యాక్షన్ ఇవ్వండి.",
  ],
  segment_observations: [],
  metrics: {
    total_word_count: 50,
    words_per_second: 3.3,
    pacing_assessment: "Optimal",
    detected_filler_words: [],
    hook_duration_seconds: 3.0,
    cta_duration_seconds: 3.0,
  },
  analyzed_at: new Date().toISOString(),
  provider_used: "heuristic_mock",
};

describe("Multilingual Retention Analyzer and Optimizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("correctly derives recommended optimization goals from Telugu analysis weak points", () => {
    const goals = deriveRecommendedOptimizationGoals(mockTeluguAnalysis);

    // Should detect "హుక్" -> improve_hook
    expect(goals).toContain("improve_hook");
    // Should detect "వృథా" -> remove_filler
    expect(goals).toContain("remove_filler");
    // Should detect "ఆసక్తి" -> strengthen_curiosity
    expect(goals).toContain("strengthen_curiosity");
    // Should detect "యాక్షన్" / score < 80 -> improve_cta
    expect(goals).toContain("improve_cta");
  });

  it("renders localized category titles in CategoryScoresGrid for Telugu", () => {
    render(<CategoryScoresGrid analysis={mockTeluguAnalysis} />);

    // Check localized titles
    expect(screen.getByText("హుక్ స్పష్టత (Hook Clarity)")).toBeInTheDocument();
    expect(screen.getByText("వృథా పదాలు & పునరావృతం (Filler Words)")).toBeInTheDocument();
    expect(screen.getByText("మొత్తం రీటెన్షన్ సామర్థ్యం (Retention)")).toBeInTheDocument();
    expect(screen.getByText("మొదటి 3 సెకన్లలో హుక్ వేగాన్ని పెంచాలి.")).toBeInTheDocument();
  });

  it("renders localized category titles in CategoryScoresGrid for Tanglish", () => {
    const tanglishAnalysis: ScriptAnalysisResponse = {
      ...mockTeluguAnalysis,
      language: "Tanglish",
    };
    render(<CategoryScoresGrid analysis={tanglishAnalysis} />);

    expect(screen.getByText("Hook Clarity (స్పష్టత)")).toBeInTheDocument();
    expect(screen.getByText("CTA Strength (యాక్షన్)")).toBeInTheDocument();
  });

  it("renders localized labels and descriptions in OptimizationGoalSelector for Telugu", () => {
    const onToggle = vi.fn();
    render(
      <OptimizationGoalSelector
        selectedGoals={["improve_hook"]}
        recommendedGoals={["improve_hook", "remove_filler"]}
        onToggleGoal={onToggle}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
        instructions=""
        onInstructionsChange={vi.fn()}
        language="Telugu"
      />
    );

    // Section header
    expect(screen.getByText("రీటెన్షన్ ఆప్టిమైజేషన్ లక్ష్యాలు")).toBeInTheDocument();
    // Localized goal labels
    expect(screen.getByText("హుక్‌ను బలోపేతం చేయండి (Improve Hook)")).toBeInTheDocument();
    expect(screen.getByText("వృథా పదాలను తొలగించండి (Remove Filler)")).toBeInTheDocument();
    expect(screen.getByText("కుతూహలాన్ని పెంచండి (Curiosity Loops)")).toBeInTheDocument();
  });

  it("renders localized labels and descriptions in OptimizationGoalSelector for Tanglish", () => {
    render(
      <OptimizationGoalSelector
        selectedGoals={["improve_hook"]}
        recommendedGoals={["improve_hook"]}
        onToggleGoal={vi.fn()}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
        instructions=""
        onInstructionsChange={vi.fn()}
        language="Tanglish"
      />
    );

    expect(screen.getByText("Retention Goals (లక్ష్యాలు)")).toBeInTheDocument();
    expect(screen.getByText("Hook ni Strong Cheyandi (Improve Hook)")).toBeInTheDocument();
    expect(screen.getByText("Filler Words Remove Cheyandi (Remove Filler)")).toBeInTheDocument();
  });

  it("renders language pill buttons and preset triggers in RetentionWorkspace", async () => {
    (api.analyzeScript as any).mockResolvedValue(mockTeluguAnalysis);

    render(<RetentionWorkspace />);

    // Wait for initial viral preset to resolve
    await waitFor(() => {
      expect(api.analyzeScript).toHaveBeenCalledTimes(1);
    });

    // Language pills and presets are present
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    const teluguButtons = screen.getAllByRole("button", { name: "తెలుగు" });
    expect(teluguButtons.length).toBeGreaterThanOrEqual(2);
    const tanglishButtons = screen.getAllByRole("button", { name: "Tanglish" });
    expect(tanglishButtons.length).toBeGreaterThanOrEqual(2);

    // Clicking Telugu preset triggers analysis with Telugu language
    const teluguPresetBtn = teluguButtons[1];
    fireEvent.click(teluguPresetBtn);

    await waitFor(() => {
      expect(api.analyzeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "Telugu",
        })
      );
    });
  });
});
