import { ScriptSegment } from "./script";

export interface CategoryScore {
  score: number;
  rating: string;
  explanation: string;
}

export interface SegmentObservation {
  segment_id: string;
  time_range: string;
  section: string;
  observation: string;
  retention_risk: "low" | "medium" | "high";
  suggestion?: string | null;
}

export interface ScriptAnalysisMetrics {
  total_word_count: number;
  words_per_second: number;
  pacing_assessment: string;
  detected_filler_words: string[];
  hook_duration_seconds: number;
  cta_duration_seconds: number;
}

export interface ScriptAnalysisRequest {
  script_id?: string;
  title?: string;
  topic?: string;
  platform?: string;
  language?: string;
  duration_seconds?: number;
  hook?: string;
  segments?: ScriptSegment[];
  cta?: string;
  script_text?: string;
  source_type?: string;
}

export interface ScriptAnalysisResponse {
  script_id?: string | null;
  title: string;
  overall_score: number;
  overall_rating: string;
  hook_clarity: CategoryScore;
  hook_strength: CategoryScore;
  pacing_progression: CategoryScore;
  information_density: CategoryScore;
  filler_repetition: CategoryScore;
  segment_timing: CategoryScore;
  curiosity_open_loops: CategoryScore;
  cta_strength: CategoryScore;
  overall_retention_potential: CategoryScore;
  weak_points: string[];
  recommendations: string[];
  segment_observations: SegmentObservation[];
  metrics: ScriptAnalysisMetrics;
  analyzed_at: string;
  provider_used: string;
}

export interface RetentionCategoryMeta {
  key: keyof Pick<
    ScriptAnalysisResponse,
    | "hook_clarity"
    | "hook_strength"
    | "pacing_progression"
    | "information_density"
    | "filler_repetition"
    | "segment_timing"
    | "curiosity_open_loops"
    | "cta_strength"
    | "overall_retention_potential"
  >;
  label: string;
  description: string;
  iconName: string;
}

export const RETENTION_CATEGORIES: RetentionCategoryMeta[] = [
  {
    key: "hook_clarity",
    label: "Hook Clarity",
    description: "Evaluates how fast the core subject and context are understood in 0–3s.",
    iconName: "Target",
  },
  {
    key: "hook_strength",
    label: "Hook Strength",
    description: "Measures scroll-stopping friction, pattern interrupts, and curiosity.",
    iconName: "Zap",
  },
  {
    key: "pacing_progression",
    label: "Story & Pacing Progression",
    description: "Evaluates narrative velocity, beat transitions, and momentum.",
    iconName: "TrendingUp",
  },
  {
    key: "information_density",
    label: "Information Density",
    description: "Balance of voiceover with visual direction and on-screen graphic text.",
    iconName: "Layers",
  },
  {
    key: "filler_repetition",
    label: "Filler & Repetition",
    description: "Detection of conversational padding, redundant phrasing, and dead air.",
    iconName: "Scissors",
  },
  {
    key: "segment_timing",
    label: "Segment Timing",
    description: "Beat duration ratios aligned with platform watch-time tolerances.",
    iconName: "Clock",
  },
  {
    key: "curiosity_open_loops",
    label: "Curiosity & Open Loops",
    description: "Psychological tension that withholds resolution until the end.",
    iconName: "HelpCircle",
  },
  {
    key: "cta_strength",
    label: "CTA Strength",
    description: "Single-action conversion command clarity without decision fatigue.",
    iconName: "Flame",
  },
  {
    key: "overall_retention_potential",
    label: "Retention Potential",
    description: "Weighted composite probability of completion and repeat replays.",
    iconName: "Award",
  },
];
