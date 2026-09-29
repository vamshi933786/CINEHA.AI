export type ScriptSourceType = "text" | "pdf" | "docx" | "image";

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

export interface SaveImportedScriptRequest {
  title: string;
  text: string;
  topic?: string;
  platform?: string;
  language?: string;
  duration_seconds?: number;
}
