import { API_BASE_URL } from "./config";
import type { HealthResponse } from "../types/api";
import type {
  CreatorProfileData,
  ProfileContainerResponse,
} from "../types/creatorProfile";

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

  async getProfile(): Promise<ProfileContainerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load profile (status: ${response.status})`);
      }

      const data = await response.json();
      return data as ProfileContainerResponse;
    } catch (err: any) {
      return {
        profile: null,
        is_configured: false,
      };
    }
  }

  async updateProfile(
    profileData: CreatorProfileData
  ): Promise<ProfileContainerResponse> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to save profile (status: ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          if (Array.isArray(errorJson.detail)) {
            errorMessage = errorJson.detail
              .map((d: any) => d.msg || JSON.stringify(d))
              .join(", ");
          } else {
            errorMessage = errorJson.detail;
          }
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as ProfileContainerResponse;
  }
}

export const api = new ApiClient();
