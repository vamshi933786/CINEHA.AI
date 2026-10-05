export interface CategoryCompleteness {
  category: string;
  completed: boolean;
  weight: number;
  details: string;
}

export interface ProfileCompleteness {
  score: number;
  categories: CategoryCompleteness[];
  recommendations: string[];
}

export interface CreatorProfileData {
  // Profile Identity
  creator_name: string;
  display_name?: string;
  creator_type?: string;
  creator_bio?: string;
  location?: string;

  // Content Identity
  niche: string;
  secondary_niches?: string[];
  content_pillars?: string[];
  topics_to_avoid?: string[];

  // Audience Persona
  target_audience?: string;
  target_audience_age?: string;
  audience_interests?: string[];
  audience_pain_points?: string[];
  audience_sophistication?: string;

  // Voice & Style
  content_tones: string[];
  energy?: string;
  humor?: string;
  storytelling_style?: string;
  vocabulary?: string;
  custom_tone_notes?: string;

  // Content & Platform Preferences
  primary_language: string;
  secondary_languages?: string[];
  script_preference?: string;
  platforms: string[];
  preferred_aspect_ratio?: string;
  typical_duration?: string;
  cta_style?: string;
  secondary_cta_styles?: string[];
  content_goals?: string[];

  // Brand Guidance
  brand_positioning?: string;
  core_message?: string;
  words_to_use?: string[];
  words_to_avoid?: string[];
  style_rules?: string[];
  liked_examples?: string[];
  disliked_examples?: string[];
}

export interface CreatorProfile extends CreatorProfileData {
  id: string;
  created_at: string;
  updated_at: string;
  completeness?: ProfileCompleteness;
}

export interface ProfileContainerResponse {
  profile: CreatorProfile | null;
  is_configured: boolean;
}

export interface CreatorPersonaContext {
  creator_name: string;
  display_name?: string;
  creator_type: string;
  bio: string;
  location?: string;
  primary_niche: string;
  secondary_niches: string[];
  content_pillars: string[];
  topics_to_avoid: string[];
  target_audience: string;
  target_audience_age?: string;
  audience_interests: string[];
  audience_pain_points: string[];
  audience_sophistication?: string;
  tone: string;
  energy?: string;
  humor?: string;
  storytelling_style?: string;
  vocabulary?: string;
  custom_tone_notes?: string;
  primary_language: string;
  secondary_languages: string[];
  script_preference?: string;
  platforms: string[];
  preferred_duration?: string;
  preferred_aspect_ratio?: string;
  cta_style?: string;
  secondary_cta_styles: string[];
  content_goals: string[];
  brand_positioning?: string;
  core_message?: string;
  words_to_use: string[];
  words_to_avoid: string[];
  style_rules: string[];
}

export interface PersonaPreviewResponse {
  summary: string;
  example_hook: string;
  example_intro: string;
  example_cta: string;
  is_ai_generated: boolean;
}

export const CREATOR_TYPES = [
  "Filmmaker",
  "Educator",
  "Influencer",
  "Entrepreneur",
  "Coach",
  "Reviewer",
  "Storyteller",
  "Artist",
  "Other",
] as const;

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

export const AGE_RANGES = [
  "Teen",
  "18–24",
  "25–34",
  "35–44",
  "45+",
  "Mixed",
] as const;

export const SOPHISTICATION_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Mixed",
] as const;

export const TONE_PRESETS = [
  "Educational",
  "Conversational",
  "Bold",
  "Professional",
  "Humorous",
  "Inspirational",
  "Story-driven",
  "Direct",
  "Custom",
] as const;

export const TONE_OPTIONS = TONE_PRESETS;

export const ENERGY_PRESETS = [
  "Calm",
  "Balanced",
  "High-energy",
] as const;

export const HUMOR_PRESETS = [
  "None",
  "Light",
  "Frequent",
] as const;

export const STORYTELLING_PRESETS = [
  "Direct",
  "Story-driven",
  "Example-driven",
  "Educational",
  "Mixed",
] as const;

export const VOCABULARY_PRESETS = [
  "Simple",
  "Balanced",
  "Technical",
] as const;

export const LANGUAGE_OPTIONS = [
  "English",
  "Telugu",
  "Tanglish",
] as const;

export const SCRIPT_PREFERENCES = [
  "English script",
  "తెలుగు native script",
  "Tanglish / Romanized Telugu",
] as const;

export const PLATFORM_OPTIONS = [
  "Instagram Reels",
  "YouTube Shorts",
  "TikTok",
  "Facebook Reels",
  "Other",
] as const;

export const ASPECT_RATIOS = [
  "9:16",
  "1:1",
  "16:9",
] as const;

export const DURATION_OPTIONS = [
  "15 sec",
  "30 sec",
  "45 sec",
  "60 sec",
  "90 sec",
  "Custom",
] as const;

export const CTA_OPTIONS = [
  "Save",
  "Follow",
  "Subscribe",
  "Comment",
  "Share",
  "DM",
  "Visit link",
  "Question",
  "Soft CTA",
  "No CTA",
  "Custom",
] as const;

export const GOAL_OPTIONS = [
  "Increase retention",
  "Build personal brand",
  "Grow followers",
  "Drive sales & leads",
  "Educate audience",
  "Entertain viewers",
] as const;
