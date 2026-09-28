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
  created_at: string;
  updated_at: string;
  versions?: ScriptVersion[];
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
