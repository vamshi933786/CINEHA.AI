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

export interface CaptionCue {
  id: string;
  segment_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: TranscriptWord[];
  position?: Record<string, any> | null;
  style?: Record<string, any> | null;
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
  providers: TranscriptionProviderInfo[];
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
