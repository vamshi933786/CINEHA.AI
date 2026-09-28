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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
