import type { Script, ScriptSegment } from "./script";
import type { ScriptAnalysisResponse } from "./analyzer";

export type OptimizationGoalKey =
  | "improve_hook"
  | "improve_pacing"
  | "remove_filler"
  | "strengthen_curiosity"
  | "improve_cta"
  | "general_retention";

export interface OptimizationGoalMeta {
  key: OptimizationGoalKey;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  color: string;
}

export const SUPPORTED_OPTIMIZATION_GOALS: OptimizationGoalMeta[] = [
  {
    key: "improve_hook",
    label: "Improve Hook",
    shortLabel: "Hook",
    description: "Re-engineer opening 0–3s with scroll-stopping psychological tension and contrarian friction.",
    iconName: "Zap",
    color: "from-amber-500 to-orange-400",
  },
  {
    key: "improve_pacing",
    label: "Improve Pacing",
    shortLabel: "Pacing",
    description: "Rebalance beat timecodes and delivery velocity (2.2–3.2 words/sec) to eliminate dead time.",
    iconName: "Clock",
    color: "from-cyan-500 to-blue-400",
  },
  {
    key: "remove_filler",
    label: "Remove Filler",
    shortLabel: "Clean Fluff",
    description: "Detect and purge conversational padding, weak modifiers, and unscripted verbal clutter.",
    iconName: "Scissors",
    color: "from-rose-500 to-pink-400",
  },
  {
    key: "strengthen_curiosity",
    label: "Strengthen Curiosity / Open Loops",
    shortLabel: "Curiosity",
    description: "Insert psychological open loops and delayed gratification to hold viewer watch-time to the payoff.",
    iconName: "HelpCircle",
    color: "from-purple-500 to-indigo-400",
  },
  {
    key: "improve_cta",
    label: "Improve CTA",
    shortLabel: "CTA",
    description: "Convert polite or multi-ask closing beats into a decisive single-action conversion command.",
    iconName: "Flame",
    color: "from-emerald-500 to-teal-400",
  },
  {
    key: "general_retention",
    label: "General Retention Optimization",
    shortLabel: "Full Retention",
    description: "Holistic upgrade combining hook friction, filler purging, visual choreography, and CTA punch.",
    iconName: "Sparkles",
    color: "from-fuchsia-500 to-purple-400",
  },
];

export interface ScriptChangeItem {
  section: string;
  field: string;
  before: string;
  after: string;
  reason: string;
}

export interface ScriptOptimizationRequest {
  goals: string[];
  instructions?: string;
  target_retention_areas?: string[];
  script_text?: string;
  title?: string;
  topic?: string;
  platform?: string;
  language?: string;
  duration_seconds?: number;
  tone?: string;
  hook?: string;
  segments?: ScriptSegment[];
  cta?: string;
}

export interface OptimizerHandoffPayload {
  scriptId: string | null;
  title: string;
  scriptText?: string;
  sourceType?: string;
  language?: string;
  durationSeconds?: number;
  hook?: string;
  segments?: ScriptSegment[];
  cta?: string;
  analysis: ScriptAnalysisResponse;
  weakPoints: string[];
  recommendations: string[];
  recommendedGoals: OptimizationGoalKey[];
  timestamp: number;
}

const OPTIMIZER_HANDOFF_KEY = "cineha_optimizer_handoff";

export function deriveRecommendedOptimizationGoals(
  analysis: ScriptAnalysisResponse
): OptimizationGoalKey[] {
  const goals: OptimizationGoalKey[] = [];

  // 1. Hook weaknesses
  if (
    analysis.hook_clarity.score < 80 ||
    analysis.hook_strength.score < 80 ||
    analysis.weak_points.some((w) => w.toLowerCase().includes("hook"))
  ) {
    goals.push("improve_hook");
  }

  // 2. Filler phrases
  if (
    analysis.filler_repetition.score < 80 ||
    (analysis.metrics.detected_filler_words &&
      analysis.metrics.detected_filler_words.length > 0) ||
    analysis.weak_points.some(
      (w) => w.toLowerCase().includes("filler") || w.toLowerCase().includes("fluff")
    )
  ) {
    goals.push("remove_filler");
  }

  // 3. Pacing / duration / timing
  if (
    analysis.pacing_progression.score < 80 ||
    analysis.segment_timing.score < 80 ||
    analysis.metrics.pacing_assessment !== "Optimal" ||
    analysis.weak_points.some(
      (w) => w.toLowerCase().includes("pace") || w.toLowerCase().includes("timing")
    )
  ) {
    goals.push("improve_pacing");
  }

  // 4. Curiosity / open loops
  if (
    analysis.curiosity_open_loops.score < 80 ||
    analysis.weak_points.some(
      (w) => w.toLowerCase().includes("loop") || w.toLowerCase().includes("curiosity")
    )
  ) {
    goals.push("strengthen_curiosity");
  }

  // 5. Call to action
  if (
    analysis.cta_strength.score < 80 ||
    analysis.weak_points.some(
      (w) => w.toLowerCase().includes("cta") || w.toLowerCase().includes("call to action")
    )
  ) {
    goals.push("improve_cta");
  }

  // If no specific goal triggered or overall potential is weak, include general_retention
  if (goals.length === 0 || analysis.overall_score < 75) {
    goals.push("general_retention");
  }

  return goals;
}

export function saveOptimizerHandoff(payload: OptimizerHandoffPayload): void {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(OPTIMIZER_HANDOFF_KEY, JSON.stringify(payload));
    } catch (_) {}
  }
}

export function getOptimizerHandoff(): OptimizerHandoffPayload | null {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(OPTIMIZER_HANDOFF_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as OptimizerHandoffPayload;
    } catch (_) {
      return null;
    }
  }
  return null;
}

export function clearOptimizerHandoff(): void {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(OPTIMIZER_HANDOFF_KEY);
    } catch (_) {}
  }
}

export interface OptimizedScriptData {
  title: string;
  topic: string;
  platform: string;
  language: string;
  duration_seconds: number;
  tone: string;
  hook: string;
  segments: ScriptSegment[];
  cta: string;
}

export interface ScriptOptimizationResponse {
  script_id: string;
  original_script: Script;
  optimized_script: OptimizedScriptData;
  analysis_before: ScriptAnalysisResponse;
  analysis_after: ScriptAnalysisResponse;
  changes_made: ScriptChangeItem[];
  optimization_goals: string[];
  provider_used: string;
  is_saved: boolean;
}

export interface SaveOptimizedScriptRequest {
  title?: string;
  hook?: string;
  segments: ScriptSegment[];
  cta?: string;
  change_summary: string;
}
