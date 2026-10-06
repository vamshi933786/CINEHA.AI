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

export const LOCALIZED_GOAL_LABELS: Record<
  string,
  Record<OptimizationGoalKey, { label: string; shortLabel: string; description: string }>
> = {
  English: {
    improve_hook: {
      label: "Improve Hook",
      shortLabel: "Hook",
      description: "Re-engineer opening 0–3s with scroll-stopping psychological tension and contrarian friction.",
    },
    improve_pacing: {
      label: "Improve Pacing",
      shortLabel: "Pacing",
      description: "Rebalance beat timecodes and delivery velocity (2.2–3.2 words/sec) to eliminate dead time.",
    },
    remove_filler: {
      label: "Remove Filler",
      shortLabel: "Clean Fluff",
      description: "Detect and purge conversational padding, weak modifiers, and unscripted verbal clutter.",
    },
    strengthen_curiosity: {
      label: "Strengthen Curiosity / Open Loops",
      shortLabel: "Curiosity",
      description: "Insert psychological open loops and delayed gratification to hold viewer watch-time to the payoff.",
    },
    improve_cta: {
      label: "Improve CTA",
      shortLabel: "CTA",
      description: "Convert polite or multi-ask closing beats into a decisive single-action conversion command.",
    },
    general_retention: {
      label: "General Retention Optimization",
      shortLabel: "Full Retention",
      description: "Holistic upgrade combining hook friction, filler purging, visual choreography, and CTA punch.",
    },
  },
  Telugu: {
    improve_hook: {
      label: "హుక్‌ను బలోపేతం చేయండి (Improve Hook)",
      shortLabel: "హుక్ (Hook)",
      description: "తొలి 3 సెకన్లలోనే ప్రేక్షకుల దృష్టిని ఆకర్షించేలా బలమైన హుక్‌ను రూపొందించండి.",
    },
    improve_pacing: {
      label: "కథ వేగాన్ని సరిచేయండి (Improve Pacing)",
      shortLabel: "పేసింగ్ (Pacing)",
      description: "బోరింగ్ లేదా నెమ్మదిగా ఉన్న భాగాలను సరిచేసి ఆసక్తికరమైన వేగాన్ని ఇవ్వండి.",
    },
    remove_filler: {
      label: "వృథా పదాలను తొలగించండి (Remove Filler)",
      shortLabel: "క్లీన్ ఫ్లఫ్ (Clean Fluff)",
      description: "అనవసరమైన పదాలు మరియు పునరావృత వివరణలను తొలగించి స్క్రిప్ట్‌ను స్పష్టంగా మార్చండి.",
    },
    strengthen_curiosity: {
      label: "కుతూహలాన్ని పెంచండి (Curiosity Loops)",
      shortLabel: "క్యూరియాసిటీ (Curiosity)",
      description: "వీక్షకులు చివరిదాకా చూసేలా సరికొత్త ఓపెన్ లూప్స్ జోడించండి.",
    },
    improve_cta: {
      label: "స్పష్టమైన CTA ఇవ్వండి (Improve CTA)",
      shortLabel: "కాల్ టు యాక్షన్ (CTA)",
      description: "వీక్షకులు వెంటనే స్పందించేలా స్పష్టమైన మరియు బలమైన చర్యను సూచించండి.",
    },
    general_retention: {
      label: "పూర్తి రీటెన్షన్ ఆప్టిమైజేషన్ (General Retention)",
      shortLabel: "పూర్తి రీటెన్షన్ (Retention)",
      description: "హుక్, పేసింగ్, ఫ్లో మరియు CTA అన్నింటినీ సంపూర్ణంగా రీటెన్షన్ కోసం మెరుగుపరచండి.",
    },
  },
  Tanglish: {
    improve_hook: {
      label: "Hook ni Strong Cheyandi (Improve Hook)",
      shortLabel: "Hook",
      description: "First 3 seconds lone scroll stop chese strong tension build cheyandi.",
    },
    improve_pacing: {
      label: "Pacing Fast Cheyandi (Improve Pacing)",
      shortLabel: "Pacing",
      description: "Dead time lekunda beats ni rebalance chesi flow fast ga maintain cheyandi.",
    },
    remove_filler: {
      label: "Filler Words Remove Cheyandi (Remove Filler)",
      shortLabel: "Clean Fluff",
      description: "Unnecessary repetition and sodhi words ni cut chesi crisp ga marchandi.",
    },
    strengthen_curiosity: {
      label: "Curiosity & Open Loops (Strengthen Curiosity)",
      shortLabel: "Curiosity",
      description: "End varaku chudela open loops and tension maintain cheyandi.",
    },
    improve_cta: {
      label: "Strong CTA Add Cheyandi (Improve CTA)",
      shortLabel: "CTA",
      description: "Ending lo clear single action command ivvandi.",
    },
    general_retention: {
      label: "Complete Retention Boost (General Retention)",
      shortLabel: "Full Retention",
      description: "Hook nundi CTA daka full script ni retention kosam optimize cheyandi.",
    },
  },
};

export function deriveRecommendedOptimizationGoals(
  analysis: ScriptAnalysisResponse
): OptimizationGoalKey[] {
  const goals: OptimizationGoalKey[] = [];

  // 1. Hook weaknesses
  if (
    analysis.hook_clarity.score < 80 ||
    analysis.hook_strength.score < 80 ||
    analysis.weak_points.some((w) => w.toLowerCase().includes("hook") || w.includes("హుక్"))
  ) {
    goals.push("improve_hook");
  }

  // 2. Filler phrases
  if (
    analysis.filler_repetition.score < 80 ||
    (analysis.metrics.detected_filler_words &&
      analysis.metrics.detected_filler_words.length > 0) ||
    analysis.weak_points.some(
      (w) =>
        w.toLowerCase().includes("filler") ||
        w.toLowerCase().includes("fluff") ||
        w.includes("వృథా") ||
        w.includes("పునరావృతం") ||
        w.toLowerCase().includes("waste")
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
      (w) =>
        w.toLowerCase().includes("pace") ||
        w.toLowerCase().includes("timing") ||
        w.includes("వేగం") ||
        w.includes("పేసింగ్") ||
        w.toLowerCase().includes("speed")
    )
  ) {
    goals.push("improve_pacing");
  }

  // 4. Curiosity / open loops
  if (
    analysis.curiosity_open_loops.score < 80 ||
    analysis.weak_points.some(
      (w) =>
        w.toLowerCase().includes("loop") ||
        w.toLowerCase().includes("curiosity") ||
        w.includes("ఆసక్తి") ||
        w.includes("కుతూహలం")
    )
  ) {
    goals.push("strengthen_curiosity");
  }

  // 5. Call to action
  if (
    analysis.cta_strength.score < 80 ||
    analysis.weak_points.some(
      (w) =>
        w.toLowerCase().includes("cta") ||
        w.toLowerCase().includes("call to action") ||
        w.includes("యాక్షన్")
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
