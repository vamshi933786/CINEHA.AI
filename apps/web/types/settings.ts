export type SettingsSectionId =
  | "appearance"
  | "providers"
  | "language"
  | "video"
  | "captions"
  | "privacy"
  | "diagnostics"
  | "about";

export type ThemeMode = "system" | "dark" | "light";
export type InterfaceDensity = "comfortable" | "compact";

export interface AppearanceSettings {
  theme: ThemeMode;
  reducedMotion: boolean;
  density: InterfaceDensity;
}

export type LLMProviderChoice = "gemini" | "mock";
export type TranscriptionProviderChoice = "local_whisper" | "production" | "mock";

export interface AIProviderSettings {
  preferredLLM: LLMProviderChoice;
  preferredTranscription: TranscriptionProviderChoice;
  enableHybridTeluguRestoration: boolean;
}

export type AppLanguageChoice = "en";
export type CaptionLanguageChoice = "en" | "te" | "tanglish";
export type SpokenLanguageChoice = "auto" | "en" | "te";

export interface LanguageSettings {
  appLanguage: AppLanguageChoice;
  captionLanguageDefault: CaptionLanguageChoice;
  spokenLanguageDefault: SpokenLanguageChoice;
}

export type AspectRatioChoice = "9:16" | "1:1" | "16:9";

export interface VideoDefaultsSettings {
  defaultAspectRatio: AspectRatioChoice;
  autoAnalyzePacing: boolean;
  autoDetectVisualHooks: boolean;
  autoSceneSegmentation: boolean;
  maxServerUploadSizeMb: number;
}

export type CaptionFontSize = "small" | "medium" | "large" | "xlarge";
export type CaptionIntensity = "subtle" | "normal" | "punchy";

export interface CaptionDefaultsSettings {
  templateId: string;
  language: CaptionLanguageChoice;
  positionX: number; // 0 to 100 percentage
  positionY: number; // 0 to 100 percentage
  fontSize: CaptionFontSize;
  animationIntensity: CaptionIntensity;
  safeAreaGuide: boolean;
}

export interface PrivacySettings {
  localTelemetryEnabled: boolean;
  persistDraftsLocally: boolean;
  autoPurgeTransientAudio: boolean;
}

export interface AppSettings {
  version: number;
  appearance: AppearanceSettings;
  ai: AIProviderSettings;
  language: LanguageSettings;
  video: VideoDefaultsSettings;
  captions: CaptionDefaultsSettings;
  privacy: PrivacySettings;
}

export const SETTINGS_STORAGE_KEY = "cinehai_settings";
export const SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: SETTINGS_SCHEMA_VERSION,
  appearance: {
    theme: "dark",
    reducedMotion: false,
    density: "comfortable",
  },
  ai: {
    preferredLLM: "gemini",
    preferredTranscription: "local_whisper",
    enableHybridTeluguRestoration: true,
  },
  language: {
    appLanguage: "en",
    captionLanguageDefault: "te",
    spokenLanguageDefault: "te",
  },
  video: {
    defaultAspectRatio: "9:16",
    autoAnalyzePacing: true,
    autoDetectVisualHooks: true,
    autoSceneSegmentation: true,
    maxServerUploadSizeMb: 100,
  },
  captions: {
    templateId: "clean",
    language: "te",
    positionX: 50,
    positionY: 82,
    fontSize: "medium",
    animationIntensity: "normal",
    safeAreaGuide: true,
  },
  privacy: {
    localTelemetryEnabled: true,
    persistDraftsLocally: true,
    autoPurgeTransientAudio: true,
  },
};

export interface SafeProviderStatus {
  id: string;
  name: string;
  category: "llm" | "transcription";
  status: "active" | "configured" | "available" | "mock_only" | "offline";
  description: string;
  badgeText: string;
  badgeVariant: "emerald" | "accent" | "amber" | "neutral" | "rose";
  isProduction: boolean;
  notes?: string;
}

export interface SystemDiagnosticsReport {
  apiStatus: "healthy" | "degraded" | "unreachable" | "loading";
  databaseStatus: "connected" | "disconnected" | "unknown";
  activeLLM: string;
  geminiConfigured: boolean;
  geminiModel: string;
  localWhisperAvailable: boolean;
  localWhisperModel: string;
  openaiWhisperConfigured: boolean;
  maxVideoSizeMb: number;
  environment: string;
  version: string;
  lastChecked: string;
  latencyMs?: number;
}
