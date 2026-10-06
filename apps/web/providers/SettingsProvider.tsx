"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  ThemeMode,
  InterfaceDensity,
} from "@/types/settings";
import {
  loadAppSettings,
  saveAppSettings,
  resetAppSettings,
  clearLocalPreferences,
  subscribeToSettingsChange,
} from "@/lib/settingsStorage";

export interface SettingsContextType {
  settings: AppSettings;
  resolvedTheme: "dark" | "light";
  resolvedReducedMotion: boolean;
  resolvedDensity: InterfaceDensity;
  isLoading: boolean;
  updateSetting: <K extends keyof AppSettings>(
    section: K,
    updates: Partial<AppSettings[K]>
  ) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  clearPreferences: () => void;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

function applyDomAttributes(
  theme: "dark" | "light",
  reducedMotion: boolean,
  density: InterfaceDensity
) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 1. Theme application
  root.setAttribute("data-theme", theme);
  root.classList.remove("dark", "light");
  root.classList.add(theme);

  // 2. Reduced Motion
  if (reducedMotion) {
    root.setAttribute("data-reduced-motion", "true");
  } else {
    root.removeAttribute("data-reduced-motion");
  }

  // 3. Density
  root.setAttribute("data-density", density);

  // 4. Meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#080B11" : "#F8FAFC");
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== "undefined") {
      return loadAppSettings();
    }
    return DEFAULT_APP_SETTINGS;
  });

  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  });

  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Synchronize system media query listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // 1. Color scheme query
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleColorSchemeChange);
    } else if ("addListener" in colorSchemeQuery) {
      (colorSchemeQuery as any).addListener(handleColorSchemeChange);
    }

    // 2. Reduced motion query
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSystemReducedMotion(e.matches);
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    } else if ("addListener" in motionQuery) {
      (motionQuery as any).addListener(handleMotionChange);
    }

    // 3. Cross-component / cross-tab settings change listener
    const unsubscribe = subscribeToSettingsChange((fresh) => {
      setSettings(fresh);
    });

    return () => {
      if (colorSchemeQuery.removeEventListener) {
        colorSchemeQuery.removeEventListener("change", handleColorSchemeChange);
      } else if ("removeListener" in colorSchemeQuery) {
        (colorSchemeQuery as any).removeListener(handleColorSchemeChange);
      }

      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener("change", handleMotionChange);
      } else if ("removeListener" in motionQuery) {
        (motionQuery as any).removeListener(handleMotionChange);
      }

      unsubscribe();
    };
  }, []);

  // Compute resolved values
  const resolvedTheme = useMemo<"dark" | "light">(() => {
    if (settings.appearance.theme === "system") {
      return systemTheme;
    }
    return settings.appearance.theme === "light" ? "light" : "dark";
  }, [settings.appearance.theme, systemTheme]);

  const resolvedReducedMotion = useMemo<boolean>(() => {
    return settings.appearance.reducedMotion || systemReducedMotion;
  }, [settings.appearance.reducedMotion, systemReducedMotion]);

  const resolvedDensity = useMemo<InterfaceDensity>(() => {
    return settings.appearance.density === "compact" ? "compact" : "comfortable";
  }, [settings.appearance.density]);

  // Apply to DOM whenever resolved values change
  useEffect(() => {
    applyDomAttributes(resolvedTheme, resolvedReducedMotion, resolvedDensity);
  }, [resolvedTheme, resolvedReducedMotion, resolvedDensity]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(section: K, updates: Partial<AppSettings[K]>) => {
      const updated = saveAppSettings((current) => ({
        ...current,
        [section]: {
          ...(current[section] as any),
          ...updates,
        },
      }));
      setSettings(updated);
    },
    []
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const updated = saveAppSettings((current) => ({
      ...current,
      ...updates,
    }));
    setSettings(updated);
  }, []);

  const handleResetSettings = useCallback(() => {
    const fresh = resetAppSettings();
    setSettings(fresh);
    // Also clean any session storage handoff keys if desired
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        Object.keys(window.sessionStorage).forEach((k) => {
          if (k.startsWith("cineha_") || k.startsWith("cinehai_")) {
            window.sessionStorage.removeItem(k);
          }
        });
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const handleClearPreferences = useCallback(() => {
    const fresh = clearLocalPreferences();
    setSettings(fresh);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        Object.keys(window.sessionStorage).forEach((k) => {
          if (k.startsWith("cineha_") || k.startsWith("cinehai_")) {
            window.sessionStorage.removeItem(k);
          }
        });
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const contextValue = useMemo<SettingsContextType>(
    () => ({
      settings,
      resolvedTheme,
      resolvedReducedMotion,
      resolvedDensity,
      isLoading,
      updateSetting,
      updateSettings,
      resetSettings: handleResetSettings,
      clearPreferences: handleClearPreferences,
    }),
    [
      settings,
      resolvedTheme,
      resolvedReducedMotion,
      resolvedDensity,
      isLoading,
      updateSetting,
      updateSettings,
      handleResetSettings,
      handleClearPreferences,
    ]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    // Return a safe fallback for isolated unit tests or SSR components not wrapped in provider
    const fallbackSettings = loadAppSettings();
    return {
      settings: fallbackSettings,
      resolvedTheme: fallbackSettings.appearance.theme === "light" ? "light" : "dark",
      resolvedReducedMotion: fallbackSettings.appearance.reducedMotion,
      resolvedDensity: fallbackSettings.appearance.density,
      isLoading: false,
      updateSetting: (section, updates) => {
        saveAppSettings((prev) => {
          const nextSection =
            typeof prev[section] === "object" && prev[section] !== null
              ? { ...(prev[section] as Record<string, any>), ...(updates as Record<string, any>) }
              : updates;
          return {
            ...prev,
            [section]: nextSection,
          };
        });
      },
      updateSettings: (updates) => {
        saveAppSettings((prev) => ({
          ...prev,
          ...updates,
        }));
      },
      resetSettings: () => {
        resetAppSettings();
      },
      clearPreferences: () => {
        clearLocalPreferences();
      },
    };
  }
  return context;
}
