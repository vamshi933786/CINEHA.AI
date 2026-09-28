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
