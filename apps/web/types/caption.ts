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

