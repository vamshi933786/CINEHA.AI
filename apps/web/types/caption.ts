export interface CaptionSource {
  source_type: "video_upload" | "audio_upload" | "youtube_url" | "custom_storage";
  filename?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  duration_seconds?: number | null;
  storage_path?: string | null;
  metadata?: Record<string, any>;
}

export interface TranscriptWord {
  text: string;
  start_time: number;
  end_time: number;
  confidence?: number | null;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  words?: TranscriptWord[];
  speaker?: string | null;
  confidence?: number | null;
}

export interface TranscriptionResult {
  language: string;
  language_code?: string | null;
  is_transliteration?: boolean;
  script_type?: string;
  segments: TranscriptSegment[];
  full_text: string;
  duration_seconds?: number | null;
  provider_name: string;
  is_production_provider: boolean;
  confidence?: number | null;
  metadata?: Record<string, any>;
}

export interface CaptionCueWord {
  text: string;
  start_time: number;
  end_time: number;
  confidence?: number | null;
}

export interface CaptionCueSettings {
  max_characters_per_line: number;
  max_lines: number;
  minimum_cue_duration: number;
  maximum_cue_duration: number;
  preferred_words_per_cue: number;
  gap_threshold: number;
}

export interface CaptionCue {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  duration: number;
  language: string;
  language_code: string;
  lines: string[];
  source_segment_ids: string[];
  segment_id?: string | null;
  words?: CaptionCueWord[];
  manually_edited: boolean;
  position?: Record<string, any> | null;
  style?: Record<string, any> | null;
  metadata?: Record<string, any>;
}

export interface CaptionCueGenerationRequest {
  segments: TranscriptSegment[];
  language: string;
  language_code?: string;
  is_transliteration?: boolean;
  script_type?: string;
  caption_source_type: "original" | "translated" | "transliterated";
  settings?: CaptionCueSettings;
}

export interface CaptionCueGenerationResult {
  cues: CaptionCue[];
  cue_count: number;
  total_caption_duration: number;
  timing_granularity: "word" | "segment";
  settings_used: CaptionCueSettings;
  caption_source_type: string;
  warnings: string[];
  metadata: Record<string, any>;
}

export interface CaptionCueGenerationResponse {
  result: CaptionCueGenerationResult;
  notice?: string | null;
}

export interface CaptionAppearanceSettings {
  alignment: "left" | "center" | "right";
  vertical_position: "top" | "center" | "bottom";
  font_size: "small" | "medium" | "large";
  background: "none" | "box";
  show_safe_area: boolean;
}

export type CaptionMode = "plain" | "motion";

export type MotionCaptionPreset =
  | "clean_pop"
  | "karaoke"
  | "bold_bounce"
  | "minimal_fade"
  | "punchy";

export type MotionEntranceAnimation = "none" | "fade" | "pop" | "slide_up";
export type MotionExitAnimation = "none" | "fade" | "slide_down";
export type MotionWordAnimation = "none" | "pop" | "emphasis" | "highlight";
export type MotionAnimationIntensity = "low" | "medium" | "high";
export type MotionActiveWordStyle = "off" | "highlight" | "scale" | "bold";

export interface MotionCaptionSettings {
  preset: MotionCaptionPreset;
  entrance_animation: MotionEntranceAnimation;
  exit_animation: MotionExitAnimation;
  word_animation: MotionWordAnimation;
  intensity: MotionAnimationIntensity;
  active_word_style: MotionActiveWordStyle;
  font_weight: "normal" | "bold" | "black";
  primary_color: string;
  active_color: string;
  active_bg_color: string;
  respect_reduced_motion: boolean;
}

export interface MotionPresetDefinition {
  id: MotionCaptionPreset;
  name: string;
  description: string;
  badge?: string;
  requiresWordTimings?: boolean;
  settings: Partial<MotionCaptionSettings>;
}

export interface CaptionProject {
  id: string;
  title: string;
  source_video?: CaptionSource | null;
  transcription?: TranscriptionResult | null;
  source_language: string;
  target_languages?: string[];
  caption_style?: string | null;
  caption_mode?: string | null;
  export_state?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TranscriptionResponse {
  project_id: string;
  caption_source: CaptionSource;
  transcription: TranscriptionResult;
  notice?: string | null;
}

export interface SupportedLanguageInfo {
  name: string;
  code: string;
  script: string;
  is_transliteration: boolean;
  description: string;
}

export interface TranscriptionProviderInfo {
  id: string;
  name: string;
  is_production: boolean;
  is_configured: boolean;
  description: string;
}

export interface CaptionProvidersResponse {
  default_provider: string;
  is_production_configured: boolean;
  is_production_language_configured?: boolean;
  default_language_processor?: string;
  providers: TranscriptionProviderInfo[];
  language_processors?: TranscriptionProviderInfo[];
}

export const SUPPORTED_CAPTION_LANGUAGES: SupportedLanguageInfo[] = [
  {
    name: "English",
    code: "en",
    script: "Latin",
    is_transliteration: false,
    description: "Standard English speech recognition",
  },
  {
    name: "Telugu",
    code: "te",
    script: "Telugu",
    is_transliteration: false,
    description: "Native Telugu script speech recognition",
  },
  {
    name: "Hindi",
    code: "hi",
    script: "Devanagari",
    is_transliteration: false,
    description: "Native Devanagari Hindi speech recognition",
  },
  {
    name: "Tanglish",
    code: "te-Latn",
    script: "Latin",
    is_transliteration: true,
    description: "Telugu spoken audio transcribed phonetically into Roman/Latin characters",
  },
];

export type LanguageProcessingMode = "translation" | "transliteration" | "none";

export interface ProcessedTranscriptSegment {
  id: string;
  original_text: string;
  text: string;
  start_time: number;
  end_time: number;
  words?: TranscriptWord[];
  speaker?: string | null;
  confidence?: number | null;
}

export interface LanguageProcessingRequest {
  source_language: string;
  target_language: string;
  processing_mode: LanguageProcessingMode;
  segments: TranscriptSegment[];
  full_text?: string | null;
  provider?: string | null;
}

export interface LanguageProcessingResult {
  source_language: string;
  target_language: string;
  target_language_code: string;
  is_transliteration: boolean;
  script_type: string;
  processing_mode: LanguageProcessingMode;
  segments: ProcessedTranscriptSegment[];
  full_text: string;
  original_full_text: string;
  provider_name: string;
  is_production_provider: boolean;
  word_timings_available: boolean;
  notice?: string | null;
  metadata?: Record<string, any>;
}

export interface LanguageProcessingResponse {
  result: LanguageProcessingResult;
  notice?: string | null;
}

export interface LanguagePair {
  source: string;
  target: string;
  mode: "translation" | "transliteration";
}

export interface LanguagePairsResponse {
  translation_pairs: LanguagePair[];
  transliteration_pairs: LanguagePair[];
  supported_languages: string[];
}

export interface CaptionStudioLanguageOption {
  id: "English" | "Telugu" | "Tanglish";
  name: string;
  label: string;
  code: string;
  script: string;
  is_transliteration: boolean;
  description: string;
}

export const CAPTION_STUDIO_LANGUAGES: CaptionStudioLanguageOption[] = [
  {
    id: "English",
    name: "English",
    label: "English",
    code: "en",
    script: "Latin",
    is_transliteration: false,
    description: "Standard English speech recognition with timed word cues",
  },
  {
    id: "Telugu",
    name: "Telugu",
    label: "Telugu (తెలుగు)",
    code: "te",
    script: "Telugu",
    is_transliteration: false,
    description: "Native Telugu script with Unicode font rendering",
  },
  {
    id: "Tanglish",
    name: "Tanglish",
    label: "Tanglish",
    code: "te-Latn",
    script: "Latin",
    is_transliteration: true,
    description: "Conversational language written phonetically in Latin characters",
  },
];

export interface CaptionRenderOptions {
  preset: MotionCaptionPreset;
  font_size: "small" | "medium" | "large";
  alignment: "left" | "center" | "right";
  vertical_position: "top" | "center" | "bottom";
  background: "none" | "box" | "outline";
  primary_color: string;
  active_color: string;
  active_bg_color: string;
  font_weight: "normal" | "bold" | "black";
}

export interface CaptionRenderResult {
  render_id: string;
  status: "completed" | "failed";
  output_filename: string;
  mime_type: string;
  file_size: number;
  duration: number;
  caption_language: string;
  caption_count: number;
  download_url: string;
  video_width?: number;
  video_height?: number;
  preset_used: string;
  metadata?: Record<string, any>;
}

export interface CaptionRenderResponse {
  result: CaptionRenderResult;
  notice?: string | null;
}

export interface CaptionPipelineResponse {
  project_id: string;
  caption_source: CaptionSource;
  transcription: TranscriptionResult;
  processed_transcription?: TranscriptionResult | null;
  cues: CaptionCue[];
  selected_language: string;
  cue_count: number;
  total_caption_duration: number;
  timing_granularity: "word" | "segment";
  is_production_provider: boolean;
  notice?: string | null;
}

