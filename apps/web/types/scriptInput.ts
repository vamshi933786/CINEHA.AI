export type ScriptSourceType = "text" | "pdf" | "docx" | "image" | "video_url";

export interface NormalizedScriptInput {
  sourceType: ScriptSourceType;
  text: string;
  originalFileName?: string;
  language?: string;
  extractionMethod: string;
  confidence?: number;
  providerName?: string;
  isProduction?: boolean;
  metadata?: Record<string, any>;
}

export interface OCRResult {
  extractedText: string;
  confidence?: number;
  lines?: string[];
  words?: Array<{ word: string; confidence?: number }>;
  providerName: string;
  isProduction: boolean;
  metadata?: Record<string, any>;
  error?: string;
}

export interface NormalizedScriptResponse {
  source_type: ScriptSourceType;
  text: string;
  original_file_name?: string | null;
  language: string;
  extraction_method: string;
  confidence?: number | null;
  provider_name: string;
  is_production_ocr: boolean;
  character_count: number;
  word_count: number;
  metadata: Record<string, any>;
}

export interface VideoURLScriptExtraction {
  source_url: string;
  platform: "YouTube" | "Instagram";
  video_id?: string;
  title?: string;
  creator_name?: string;
  description?: string;
  duration_seconds?: number;
  language: string;
  transcript: string;
  segments: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
  }>;
  extraction_method: "official_transcript" | "public_caption" | "local_whisper" | "hybrid_restoration";
  transcription_provider: string;
  confidence?: number;
  source_type: "video_url";
  warnings: string[];
}

export interface VideoURLExtractionRequest {
  url: string;
  language?: string;
}

export interface GenerateScriptFromURLRequest {
  url: string;
  extracted_text: string;
  original_video_title?: string;
  platform?: string;
  language?: string;
  duration_seconds?: number;
  goal: string;
  instructions?: string;
  profile_id?: string;
}

export interface SaveImportedScriptRequest {
  title: string;
  text: string;
  topic?: string;
  platform?: string;
  language?: string;
  duration_seconds?: number;
  source_type?: ScriptSourceType;
  source_url?: string;
  source_platform?: string;
  original_video_title?: string;
  extraction_method?: string;
  metadata?: Record<string, any>;
}
