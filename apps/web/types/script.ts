export interface ScriptSegment {
  id: string;
  start_time: string;
  end_time: string;
  section: string;
  voiceover: string;
  visual_direction: string;
  b_roll?: string | null;
  on_screen_text: string;
  audio_direction?: string | null;
}

export interface ScriptVersion {
  id: string;
  script_id: string;
  version_number: number;
  title: string;
  segments: ScriptSegment[];
  hook: string;
  cta: string;
  change_summary: string;
  provider_used: string;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  profile_id?: string | null;
  title: string;
  topic: string;
  platform: string;
  language: string;
  duration_seconds: number;
  tone: string;
  hook: string;
  segments: ScriptSegment[];
  cta: string;
  provider_used: string;
  current_version: number;
  source_type?: string | null;
  source_url?: string | null;
  source_platform?: string | null;
  original_video_title?: string | null;
  extraction_method?: string | null;
  created_at: string;
  updated_at: string;
  versions?: ScriptVersion[];
  visuals?: ScriptVisual[];
}

export type VisualConceptType =
  | "Concept Illustration"
  | "Diagram"
  | "Process"
  | "Comparison"
  | "Before / After"
  | "Educational"
  | "Story Scene"
  | "Product Context"
  | "Metaphor"
  | "Data Explanation";

export type VisualImportance = "Essential" | "Recommended" | "Optional";

export type VisualAspectRatio = "9:16" | "1:1" | "16:9";

export type VisualStyle =
  | "Clean Educational"
  | "Cinematic"
  | "Modern 3D"
  | "Minimal Illustration"
  | "Editorial"
  | "Realistic"
  | "Infographic-style";

export type VisualStatus = "suggested" | "generating" | "ready" | "failed";

export interface ScriptVisual {
  id: string;
  script_id: string;
  script_version_id?: string | null;
  segment_id: string;
  concept_title: string;
  explanation: string;
  visual_type: VisualConceptType;
  importance: VisualImportance;
  related_script_text: string;
  suggested_prompt: string;
  prompt: string;
  aspect_ratio: VisualAspectRatio;
  style: VisualStyle;
  language: string;
  status: VisualStatus;
  image_asset_reference?: string | null;
  image_url?: string | null;
  provider?: string | null;
  model?: string | null;
  placement?: string | null;
  is_attached: boolean;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VisualProviderStatus {
  configured: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface ScriptGenerationPayload {
  topic: string;
  context?: string;
  platform: string;
  language: string;
  duration_seconds: number;
  tone?: string;
  hook?: string;
  cta?: string;
  profile_id?: string;
}

export interface ScriptUpdatePayload {
  title?: string;
  hook?: string;
  segments?: ScriptSegment[];
  cta?: string;
  change_summary?: string;
}

export const SCRIPT_PLATFORMS = [
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
] as const;

export const SCRIPT_LANGUAGES = [
  "English",
  "Telugu",
  "Tanglish",
] as const;

export const SCRIPT_DURATIONS = [15, 30, 45, 60, 90] as const;

export const CTA_PRESETS = [
  "Follow for more",
  "Comment below",
  "Save this for later",
  "Share with a creator friend",
  "Visit profile for part 2",
  "Learn more in bio",
  "Custom CTA",
] as const;
