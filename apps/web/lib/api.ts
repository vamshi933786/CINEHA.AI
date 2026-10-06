import { API_BASE_URL } from "./config";
import type { HealthResponse, HealthProvidersResponse } from "../types/api";
import type {
  CreatorProfileData,
  ProfileContainerResponse,
  CreatorPersonaContext,
  PersonaPreviewResponse,
} from "../types/creatorProfile";
import type {
  HookGenerationRequest,
  HookGenerationResponse,
} from "../types/hook";
import type {
  Script,
  ScriptVersion,
  ScriptGenerationPayload,
  ScriptUpdatePayload,
} from "../types/script";
import type {
  ScriptAnalysisRequest,
  ScriptAnalysisResponse,
} from "../types/analyzer";
import type {
  ScriptOptimizationRequest,
  ScriptOptimizationResponse,
  SaveOptimizedScriptRequest,
} from "../types/optimizer";
import type {
  NormalizedScriptResponse,
  SaveImportedScriptRequest,
  ScriptSourceType,
} from "../types/scriptInput";
import type {
  TranscriptionResponse,
  SupportedLanguageInfo,
  CaptionProvidersResponse,
  LanguageProcessingRequest,
  LanguageProcessingResponse,
  LanguagePairsResponse,
  CaptionCue,
  CaptionCueGenerationRequest,
  CaptionCueGenerationResponse,
  CaptionRenderOptions,
  CaptionRenderResponse,
  CaptionPipelineResponse,
} from "../types/caption";
import type { VideoAnalysisResponse } from "../types/videoAnalysis";
import type {
  ContentItem,
  ContentItemPayload,
  CalendarQueryParams,
  GenerateContentPlanRequest,
  GenerateContentPlanResponse,
  CalendarDashboardStats,
} from "../types/calendar";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async checkHealth(timeoutMs: number = 5000): Promise<HealthResponse> {
    try {
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });

      if (timer) clearTimeout(timer);

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

  async getHealthProvidersDiagnostic(
    timeoutMs: number = 5000
  ): Promise<HealthProvidersResponse | null> {
    try {
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

      const response = await fetch(`${this.baseUrl}/health/providers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });

      if (timer) clearTimeout(timer);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data as HealthProvidersResponse;
    } catch (err: any) {
      return null;
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

  async getPersonaContext(): Promise<CreatorPersonaContext> {
    const response = await fetch(`${this.baseUrl}/profile/persona`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load persona context (status: ${response.status})`);
    }

    const data = await response.json();
    return data as CreatorPersonaContext;
  }

  async generatePersonaSummary(
    profileData?: CreatorProfileData
  ): Promise<PersonaPreviewResponse> {
    const response = await fetch(`${this.baseUrl}/profile/generate-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: profileData ? JSON.stringify(profileData) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to generate persona summary (status: ${response.status})`);
    }

    const data = await response.json();
    return data as PersonaPreviewResponse;
  }

  async generateHooks(
    payload: HookGenerationRequest
  ): Promise<HookGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/hooks/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate hooks (status: ${response.status})`;
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
    return data as HookGenerationResponse;
  }

  async generateScript(payload: ScriptGenerationPayload): Promise<Script> {
    const response = await fetch(`${this.baseUrl}/scripts/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate script (status: ${response.status})`;
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
    return data as Script;
  }

  async getScripts(limit: number = 50): Promise<Script[]> {
    const response = await fetch(`${this.baseUrl}/scripts?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load scripts (status: ${response.status})`);
    }

    const data = await response.json();
    return data as Script[];
  }

  async getScript(scriptId: string): Promise<Script> {
    const response = await fetch(`${this.baseUrl}/scripts/${scriptId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load script (status: ${response.status})`);
    }

    const data = await response.json();
    return data as Script;
  }

  async updateScript(
    scriptId: string,
    payload: ScriptUpdatePayload
  ): Promise<Script> {
    const response = await fetch(`${this.baseUrl}/scripts/${scriptId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to update script (status: ${response.status})`;
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
    return data as Script;
  }

  async getScriptVersions(scriptId: string): Promise<ScriptVersion[]> {
    const response = await fetch(`${this.baseUrl}/scripts/${scriptId}/versions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load script versions (status: ${response.status})`);
    }

    const data = await response.json();
    return data as ScriptVersion[];
  }

  async analyzeScript(
    payload: ScriptAnalysisRequest
  ): Promise<ScriptAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/analyzer/script`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to analyze script (status: ${response.status})`;
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
    return data as ScriptAnalysisResponse;
  }

  async analyzeScriptById(scriptId: string, language?: string): Promise<ScriptAnalysisResponse> {
    const url = language
      ? `${this.baseUrl}/analyzer/script/${scriptId}?language=${encodeURIComponent(language)}`
      : `${this.baseUrl}/analyzer/script/${scriptId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `Failed to analyze script (status: ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage =
            typeof errorJson.detail === "string"
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as ScriptAnalysisResponse;
  }

  async optimizeScript(
    scriptId: string,
    payload: ScriptOptimizationRequest
  ): Promise<ScriptOptimizationResponse> {
    const url =
      scriptId === "custom"
        ? `${this.baseUrl}/scripts/optimize-custom`
        : `${this.baseUrl}/scripts/${scriptId}/optimize`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to optimize script (status: ${response.status})`;
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
    return data as ScriptOptimizationResponse;
  }

  async saveOptimizedScript(
    scriptId: string,
    payload: SaveOptimizedScriptRequest
  ): Promise<Script> {
    const response = await fetch(
      `${this.baseUrl}/scripts/${scriptId}/save-optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to save optimized script (status: ${response.status})`;
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
    return data as Script;
  }

  async extractScript(params: {
    file?: File | Blob;
    sourceType: ScriptSourceType;
    text?: string;
    language?: string;
  }): Promise<NormalizedScriptResponse> {
    const formData = new FormData();
    formData.append("source_type", params.sourceType);
    if (params.text) {
      formData.append("text", params.text);
    }
    if (params.language) {
      formData.append("language", params.language);
    }
    if (params.file) {
      formData.append("file", params.file);
    }

    const response = await fetch(`${this.baseUrl}/scripts/extract`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Extraction failed (status: ${response.status})`;
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
    return data as NormalizedScriptResponse;
  }

  async saveImportedScript(
    payload: SaveImportedScriptRequest
  ): Promise<Script> {
    const response = await fetch(`${this.baseUrl}/scripts/save-imported`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to save imported script (status: ${response.status})`;
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
    return data as Script;
  }

  async transcribeVideo(
    file: File,
    language: string = "English",
    durationSeconds?: number,
    provider?: string
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    if (durationSeconds !== undefined && durationSeconds !== null) {
      formData.append("duration_seconds", String(durationSeconds));
    }
    if (provider) {
      formData.append("provider", provider);
    }

    const response = await fetch(`${this.baseUrl}/captions/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Failed to transcribe video (status: ${response.status})`;
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
    return data as TranscriptionResponse;
  }

  async getCaptionLanguages(): Promise<{ languages: SupportedLanguageInfo[] }> {
    const response = await fetch(`${this.baseUrl}/captions/languages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch caption languages (status: ${response.status})`);
    }

    const data = await response.json();
    return data;
  }

  async getCaptionProviders(): Promise<CaptionProvidersResponse> {
    const response = await fetch(`${this.baseUrl}/captions/providers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch caption providers (status: ${response.status})`);
    }

    const data = await response.json();
    return data as CaptionProvidersResponse;
  }

  async processLanguage(
    payload: LanguageProcessingRequest
  ): Promise<LanguageProcessingResponse> {
    const response = await fetch(`${this.baseUrl}/captions/process-language`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Language processing failed (status: ${response.status})`;
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
    return data as LanguageProcessingResponse;
  }

  async getLanguagePairs(): Promise<LanguagePairsResponse> {
    const response = await fetch(`${this.baseUrl}/captions/language-pairs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch language pairs (status: ${response.status})`);
    }

    const data = await response.json();
    return data as LanguagePairsResponse;
  }

  async generateCaptionCues(
    payload: CaptionCueGenerationRequest
  ): Promise<CaptionCueGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/captions/generate-cues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Caption cue generation failed (status: ${response.status})`;
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
    return data as CaptionCueGenerationResponse;
  }

  async generateCaptions(
    file: File,
    language: string = "English",
    durationSeconds?: number,
    provider?: string
  ): Promise<CaptionPipelineResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    if (durationSeconds !== undefined && durationSeconds !== null) {
      formData.append("duration_seconds", String(durationSeconds));
    }
    if (provider) {
      formData.append("provider", provider);
    }

    const response = await fetch(`${this.baseUrl}/captions/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Caption generation failed (status: ${response.status})`;
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
    return data as CaptionPipelineResponse;
  }

  async renderCaptionedVideo(
    file: File,
    cues: CaptionCue[],
    language: string = "English",
    preset: string = "clean_pop",
    options?: Partial<CaptionRenderOptions>
  ): Promise<CaptionRenderResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cues", JSON.stringify(cues));
    formData.append("language", language);
    formData.append("preset", preset);
    if (options) {
      formData.append("options", JSON.stringify(options));
    }

    const response = await fetch(`${this.baseUrl}/captions/render`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Caption rendering failed (status: ${response.status})`;
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
    return data as CaptionRenderResponse;
  }

  getRenderDownloadUrl(renderId: string): string {
    return `${this.baseUrl}/captions/render/${encodeURIComponent(renderId)}/download`;
  }

  async analyzeVideo(
    file: File,
    language: string = "English",
    provider?: string
  ): Promise<VideoAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    if (provider) {
      formData.append("provider", provider);
    }

    const response = await fetch(`${this.baseUrl}/video-analysis/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Video analysis failed (status: ${response.status})`;
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
    return data as VideoAnalysisResponse;
  }

  async getVideoAnalysis(analysisId: string): Promise<VideoAnalysisResponse> {
    const response = await fetch(
      `${this.baseUrl}/video-analysis/${encodeURIComponent(analysisId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to fetch video analysis (status: ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as VideoAnalysisResponse;
  }

  async listVideoAnalyses(limit: number = 50): Promise<VideoAnalysisResponse[]> {
    const response = await fetch(
      `${this.baseUrl}/video-analysis?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data as VideoAnalysisResponse[];
  }

  // --- Content Calendar Endpoints ---

  async getContentItems(params?: CalendarQueryParams): Promise<ContentItem[]> {
    const query = new URLSearchParams();
    if (params) {
      if (params.start_date) query.set("start_date", params.start_date);
      if (params.end_date) query.set("end_date", params.end_date);
      if (params.status) query.set("status", params.status);
      if (params.platform) query.set("platform", params.platform);
      if (params.content_type) query.set("content_type", params.content_type);
      if (params.content_pillar) query.set("content_pillar", params.content_pillar);
      if (params.priority) query.set("priority", params.priority);
      if (params.search) query.set("search", params.search);
    }

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(`${this.baseUrl}/calendar${queryString}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch calendar items (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorMessage = String(errorJson.detail);
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return (await response.json()) as ContentItem[];
  }

  async getContentItem(itemId: string): Promise<ContentItem> {
    const response = await fetch(
      `${this.baseUrl}/calendar/${encodeURIComponent(itemId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch content item (${response.status})`);
    }

    return (await response.json()) as ContentItem;
  }

  async createContentItem(payload: ContentItemPayload): Promise<ContentItem> {
    const response = await fetch(`${this.baseUrl}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create content item (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage =
            typeof errorJson.detail === "string"
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return (await response.json()) as ContentItem;
  }

  async updateContentItem(
    itemId: string,
    payload: Partial<ContentItemPayload>
  ): Promise<ContentItem> {
    const response = await fetch(
      `${this.baseUrl}/calendar/${encodeURIComponent(itemId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to update content item (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage =
            typeof errorJson.detail === "string"
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
        }
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return (await response.json()) as ContentItem;
  }

  async deleteContentItem(
    itemId: string
  ): Promise<{ deleted: boolean; id: string }> {
    const response = await fetch(
      `${this.baseUrl}/calendar/${encodeURIComponent(itemId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete content item (${response.status})`);
    }

    return (await response.json()) as { deleted: boolean; id: string };
  }

  async duplicateContentItem(
    itemId: string,
    shiftDays: number = 0
  ): Promise<ContentItem> {
    const response = await fetch(
      `${this.baseUrl}/calendar/${encodeURIComponent(itemId)}/duplicate?shift_days=${shiftDays}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to duplicate content item (${response.status})`);
    }

    return (await response.json()) as ContentItem;
  }

  async generateContentPlan(
    request: GenerateContentPlanRequest
  ): Promise<GenerateContentPlanResponse> {
    const response = await fetch(`${this.baseUrl}/calendar/generate-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate content plan (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorMessage = String(errorJson.detail);
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return (await response.json()) as GenerateContentPlanResponse;
  }

  async getCalendarDashboardStats(): Promise<CalendarDashboardStats> {
    const response = await fetch(`${this.baseUrl}/calendar/stats/dashboard`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar dashboard stats (${response.status})`);
    }

    return (await response.json()) as CalendarDashboardStats;
  }
}

export const api = new ApiClient();

