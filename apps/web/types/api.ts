export interface HealthResponse {
  status: "healthy" | "degraded" | "unreachable";
  project_name: string;
  version: string;
  environment: string;
  database: string;
  active_provider: string;
  max_video_size_mb: number;
  timestamp: string;
}

export interface HealthProvidersResponse {
  active_provider: string;
  selected_llm_provider: string;
  gemini: {
    configured: boolean;
    model: string;
    provider_class: string;
    supported_features: string[];
    fallback_provider: string;
  };
  local_whisper?: {
    available: boolean;
    model: string;
    provider_class: string;
  };
  caption_transcription: {
    active_provider: string;
    model: string;
    configured: boolean;
    engine: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
