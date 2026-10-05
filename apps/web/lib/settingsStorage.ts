import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_SCHEMA_VERSION,
} from "@/types/settings";

function isObject(val: unknown): val is Record<string, any> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Deep merge source into target defaults, guaranteeing all required fields exist.
 */
function mergeWithDefaults(
  defaults: AppSettings,
  stored: Record<string, any>
): AppSettings {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    appearance: {
      theme:
        stored.appearance?.theme === "light" ||
        stored.appearance?.theme === "dark" ||
        stored.appearance?.theme === "system"
          ? stored.appearance.theme
          : defaults.appearance.theme,
      reducedMotion:
        typeof stored.appearance?.reducedMotion === "boolean"
          ? stored.appearance.reducedMotion
          : defaults.appearance.reducedMotion,
      density:
        stored.appearance?.density === "compact" ||
        stored.appearance?.density === "comfortable"
          ? stored.appearance.density
          : defaults.appearance.density,
    },
    ai: {
      preferredLLM:
        stored.ai?.preferredLLM === "gemini" || stored.ai?.preferredLLM === "mock"
          ? stored.ai.preferredLLM
          : defaults.ai.preferredLLM,
      preferredTranscription:
        stored.ai?.preferredTranscription === "local_whisper" ||
        stored.ai?.preferredTranscription === "production" ||
        stored.ai?.preferredTranscription === "mock"
          ? stored.ai.preferredTranscription
          : defaults.ai.preferredTranscription,
      enableHybridTeluguRestoration:
        typeof stored.ai?.enableHybridTeluguRestoration === "boolean"
          ? stored.ai.enableHybridTeluguRestoration
          : defaults.ai.enableHybridTeluguRestoration,
    },
    language: {
      appLanguage: defaults.language.appLanguage,
      captionLanguageDefault:
        stored.language?.captionLanguageDefault === "en" ||
        stored.language?.captionLanguageDefault === "te" ||
        stored.language?.captionLanguageDefault === "tanglish"
          ? stored.language.captionLanguageDefault
          : defaults.language.captionLanguageDefault,
      spokenLanguageDefault:
        stored.language?.spokenLanguageDefault === "auto" ||
        stored.language?.spokenLanguageDefault === "en" ||
        stored.language?.spokenLanguageDefault === "te"
          ? stored.language.spokenLanguageDefault
          : defaults.language.spokenLanguageDefault,
    },
    video: {
      defaultAspectRatio:
        stored.video?.defaultAspectRatio === "9:16" ||
        stored.video?.defaultAspectRatio === "1:1" ||
        stored.video?.defaultAspectRatio === "16:9"
          ? stored.video.defaultAspectRatio
          : defaults.video.defaultAspectRatio,
      autoAnalyzePacing:
        typeof stored.video?.autoAnalyzePacing === "boolean"
          ? stored.video.autoAnalyzePacing
          : defaults.video.autoAnalyzePacing,
      autoDetectVisualHooks:
        typeof stored.video?.autoDetectVisualHooks === "boolean"
          ? stored.video.autoDetectVisualHooks
          : defaults.video.autoDetectVisualHooks,
      autoSceneSegmentation:
        typeof stored.video?.autoSceneSegmentation === "boolean"
          ? stored.video.autoSceneSegmentation
          : defaults.video.autoSceneSegmentation,
      maxServerUploadSizeMb: defaults.video.maxServerUploadSizeMb,
    },
    captions: {
      templateId:
        typeof stored.captions?.templateId === "string" && stored.captions.templateId
          ? stored.captions.templateId
          : defaults.captions.templateId,
      language:
        stored.captions?.language === "en" ||
        stored.captions?.language === "te" ||
        stored.captions?.language === "tanglish"
          ? stored.captions.language
          : defaults.captions.language,
      positionX:
        typeof stored.captions?.positionX === "number" &&
        stored.captions.positionX >= 0 &&
        stored.captions.positionX <= 100
          ? stored.captions.positionX
          : defaults.captions.positionX,
      positionY:
        typeof stored.captions?.positionY === "number" &&
        stored.captions.positionY >= 0 &&
        stored.captions.positionY <= 100
          ? stored.captions.positionY
          : defaults.captions.positionY,
      fontSize:
        stored.captions?.fontSize === "small" ||
        stored.captions?.fontSize === "medium" ||
        stored.captions?.fontSize === "large" ||
        stored.captions?.fontSize === "xlarge"
          ? stored.captions.fontSize
          : defaults.captions.fontSize,
      animationIntensity:
        stored.captions?.animationIntensity === "subtle" ||
        stored.captions?.animationIntensity === "normal" ||
        stored.captions?.animationIntensity === "punchy"
          ? stored.captions.animationIntensity
          : defaults.captions.animationIntensity,
      safeAreaGuide:
        typeof stored.captions?.safeAreaGuide === "boolean"
          ? stored.captions.safeAreaGuide
          : defaults.captions.safeAreaGuide,
    },
    privacy: {
      localTelemetryEnabled:
        typeof stored.privacy?.localTelemetryEnabled === "boolean"
          ? stored.privacy.localTelemetryEnabled
          : defaults.privacy.localTelemetryEnabled,
      persistDraftsLocally:
        typeof stored.privacy?.persistDraftsLocally === "boolean"
          ? stored.privacy.persistDraftsLocally
          : defaults.privacy.persistDraftsLocally,
      autoPurgeTransientAudio: defaults.privacy.autoPurgeTransientAudio,
    },
  };
}

/**
 * Load settings from localStorage with schema validation, recovery from malformed JSON, and default fallbacks.
 */
export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) {
      console.warn("[CINEHAI Settings] Corrupted settings structure detected. Reverting to defaults.");
      return DEFAULT_APP_SETTINGS;
    }

    // Merge with defaults to guarantee all fields exist and apply migrations
    return mergeWithDefaults(DEFAULT_APP_SETTINGS, parsed);
  } catch (err) {
    console.warn("[CINEHAI Settings] Failed to parse stored settings. Reverting to defaults.", err);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Save settings to localStorage and notify listeners.
 */
export function saveAppSettings(
  updates: Partial<AppSettings> | ((current: AppSettings) => AppSettings)
): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const current = loadAppSettings();
    const nextSettings =
      typeof updates === "function" ? updates(current) : { ...current, ...updates };

    const validated = mergeWithDefaults(DEFAULT_APP_SETTINGS, nextSettings);
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validated));

    window.dispatchEvent(
      new CustomEvent("cinehai_settings_changed", { detail: validated })
    );

    return validated;
  } catch (err) {
    console.error("[CINEHAI Settings] Error saving settings to localStorage:", err);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Reset application settings to factory defaults without touching database records or creator profile.
 */
export function resetAppSettings(): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(DEFAULT_APP_SETTINGS)
    );
    window.dispatchEvent(
      new CustomEvent("cinehai_settings_changed", { detail: DEFAULT_APP_SETTINGS })
    );
    return DEFAULT_APP_SETTINGS;
  } catch (err) {
    console.error("[CINEHAI Settings] Error resetting settings:", err);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Clear local preferences key from localStorage.
 */
export function clearLocalPreferences(): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("cinehai_settings_changed", { detail: DEFAULT_APP_SETTINGS })
    );
    return DEFAULT_APP_SETTINGS;
  } catch (err) {
    console.error("[CINEHAI Settings] Error clearing settings:", err);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Subscribe to settings changes across components.
 */
export function subscribeToSettingsChange(
  callback: (settings: AppSettings) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AppSettings>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("cinehai_settings_changed", handler);
  return () => {
    window.removeEventListener("cinehai_settings_changed", handler);
  };
}
