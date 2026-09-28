import { API_BASE_URL } from "./config";
import type { HealthResponse } from "../types/api";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data as HealthResponse;
    } catch (err: any) {
      return {
        status: "unreachable",
        project_name: "CINEHA AI API",
        version: "unknown",
        environment: "unknown",
        database: "disconnected",
        active_provider: "none",
        max_video_size_mb: 100,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const api = new ApiClient();
