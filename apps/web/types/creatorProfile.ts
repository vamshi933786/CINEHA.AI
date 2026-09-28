export interface CreatorProfileData {
  creator_name: string;
  niche: string;
  target_audience?: string;
  platforms: string[];
  primary_language: string;
  content_tones: string[];
  creator_bio?: string;
  content_goals: string[];
}

export interface CreatorProfile extends CreatorProfileData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileContainerResponse {
  profile: CreatorProfile | null;
  is_configured: boolean;
}

export const NICHE_PRESETS = [
  "Cinematography",
  "Mobile Filmmaking",
  "Technology",
  "Education",
  "Fitness",
  "Fashion",
  "Finance",
  "Travel",
  "Food",
  "Entertainment",
] as const;

export const PLATFORM_OPTIONS = [
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
] as const;

export const LANGUAGE_OPTIONS = [
  "English",
  "Telugu",
  "Tanglish",
] as const;

export const TONE_OPTIONS = [
  "Educational",
  "Entertaining",
  "Storytelling",
  "Professional",
  "Casual",
  "Motivational",
  "Cinematic",
  "Conversational",
] as const;

export const GOAL_OPTIONS = [
  "Increase retention",
  "Grow followers",
  "Generate leads",
  "Build personal brand",
  "Educate audience",
  "Increase engagement",
] as const;
