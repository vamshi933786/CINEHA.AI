"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Palette,
  Cpu,
  Languages,
  Video,
  Subtitles,
  Shield,
  Activity,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AppSettings,
  SettingsSectionId,
  DEFAULT_APP_SETTINGS,
  SystemDiagnosticsReport,
} from "@/types/settings";
import { HealthProvidersResponse } from "@/types/api";
import {
  loadAppSettings,
  saveAppSettings,
  resetAppSettings,
  clearLocalPreferences,
  subscribeToSettingsChange,
} from "@/lib/settingsStorage";
import { api } from "@/lib/api";

import { useSettings, SettingsContext } from "@/providers/SettingsProvider";

import { AppearanceSection } from "./AppearanceSection";
import { ProvidersSection } from "./ProvidersSection";
import { LanguageSection } from "./LanguageSection";
import { VideoDefaultsSection } from "./VideoDefaultsSection";
import { CaptionDefaultsSection } from "./CaptionDefaultsSection";
import { PrivacySection } from "./PrivacySection";
import { SystemDiagnosticsSection } from "./SystemDiagnosticsSection";
import { AboutSection } from "./AboutSection";

interface NavTabItem {
  id: SettingsSectionId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "accent" | "emerald" | "amber" | "rose" | "neutral";
}

export function SettingsWorkspace() {
  const context = useContext(SettingsContext);
  const [localSettings, setLocalSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    if (context) return;
    const loaded = loadAppSettings();
    setLocalSettings(loaded);

    const unsubscribe = subscribeToSettingsChange((updated) => {
      setLocalSettings(updated);
    });

    return () => {
      unsubscribe();
    };
  }, [context]);

  const settings = context ? context.settings : localSettings;
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("appearance");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<SystemDiagnosticsReport | null>(null);
  const [providersDiagnostic, setProvidersDiagnostic] = useState<HealthProvidersResponse | null>(null);

  // Fetch live system diagnostics
  const fetchDiagnostics = useCallback(async () => {
    setIsDiagnosticsLoading(true);
    const start = performance.now();
    try {
      const [health, provs] = await Promise.all([
        api.checkHealth(),
        api.getHealthProvidersDiagnostic(),
      ]);
      const latency = Math.round(performance.now() - start);

      setProvidersDiagnostic(provs);
      setDiagnosticsReport({
        apiStatus: health.status,
        databaseStatus: health.database === "connected" ? "connected" : "disconnected",
        activeLLM: provs?.selected_llm_provider || "GeminiLLMProvider",
        geminiConfigured: provs?.gemini?.configured ?? true,
        geminiModel: provs?.gemini?.model || "gemini-3.5-flash-lite",
        localWhisperAvailable: provs?.local_whisper?.available ?? true,
        localWhisperModel: provs?.local_whisper?.model || "base",
        openaiWhisperConfigured: provs?.caption_transcription?.configured ?? false,
        maxVideoSizeMb: health.max_video_size_mb || 100,
        environment: health.environment || "development",
        version: health.version || "1.0.0",
        lastChecked: new Date().toLocaleTimeString(),
        latencyMs: latency,
      });
    } catch (err) {
      setDiagnosticsReport({
        apiStatus: "unreachable",
        databaseStatus: "disconnected",
        activeLLM: "OfflineHeuristicMockProvider",
        geminiConfigured: false,
        geminiModel: "offline",
        localWhisperAvailable: false,
        localWhisperModel: "base",
        openaiWhisperConfigured: false,
        maxVideoSizeMb: 100,
        environment: "offline",
        version: "1.0.0",
        lastChecked: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsDiagnosticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  // Flash saved feedback
  const triggerSaveFeedback = (message: string = "Changes saved") => {
    setSaveFeedback(message);
    const timer = setTimeout(() => {
      setSaveFeedback(null);
    }, 2200);
    return () => clearTimeout(timer);
  };

  const handleUpdate = (updates: Partial<AppSettings>) => {
    if (context) {
      context.updateSettings(updates);
    } else {
      const updated = saveAppSettings((prev) => ({
        ...prev,
        ...updates,
      }));
      setLocalSettings(updated);
    }
    triggerSaveFeedback("Saved");
  };

  const handleResetAll = () => {
    if (context) {
      context.resetSettings();
    } else {
      const fresh = resetAppSettings();
      setLocalSettings(fresh);
    }
    triggerSaveFeedback("Reset to default settings");
  };

  const handleClearPreferences = () => {
    if (context) {
      context.clearPreferences();
    } else {
      const fresh = clearLocalPreferences();
      setLocalSettings(fresh);
    }
    triggerSaveFeedback("Preferences cleared");
  };

  const themeBadge =
    settings.appearance.theme === "dark"
      ? "Dark"
      : settings.appearance.theme === "light"
      ? "Light"
      : "System";

  const navTabs: NavTabItem[] = [
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette className="w-4 h-4" />,
      badge: themeBadge,
      badgeVariant: "neutral",
    },
    {
      id: "providers",
      label: "AI Providers",
      icon: <Cpu className="w-4 h-4" />,
      badge: providersDiagnostic?.gemini?.configured ? "Active" : "Check",
      badgeVariant: "accent",
    },
    {
      id: "language",
      label: "Language",
      icon: <Languages className="w-4 h-4" />,
      badge: settings.language.captionLanguageDefault.toUpperCase(),
      badgeVariant: "emerald",
    },
    {
      id: "video",
      label: "Video Defaults",
      icon: <Video className="w-4 h-4" />,
      badge: settings.video.defaultAspectRatio,
      badgeVariant: "neutral",
    },
    {
      id: "captions",
      label: "Caption Defaults",
      icon: <Subtitles className="w-4 h-4" />,
      badge: "10 Presets",
      badgeVariant: "accent",
    },
    {
      id: "privacy",
      label: "Privacy & Data",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "diagnostics",
      label: "System Diagnostics",
      icon: <Activity className="w-4 h-4" />,
      badge: diagnosticsReport?.apiStatus === "healthy" ? "Healthy" : undefined,
      badgeVariant: "emerald",
    },
    {
      id: "about",
      label: "About & Creator",
      icon: <Info className="w-4 h-4" />,
      badge: "Sai Panga",
      badgeVariant: "accent",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Toast Save Feedback Banner */}
      {saveFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-cine-surface border border-cine-accent/50 shadow-xl shadow-cine-accent/15 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{saveFeedback}</span>
        </div>
      )}

      {/* Main Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Column (Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <aside className="lg:col-span-3 w-full">
          <div className="rounded-2xl bg-cine-surface/90 border border-cine-border/80 p-2 sm:p-3 sticky top-4">
            <div className="px-3 py-2 hidden lg:flex items-center justify-between border-b border-cine-border/50 mb-2">
              <span className="text-xs font-semibold text-cine-muted uppercase tracking-wider">
                Settings Navigation
              </span>
              <Sliders className="w-3.5 h-3.5 text-cine-muted" />
            </div>

            {/* Navigation Tabs List */}
            <nav
              className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none"
              aria-label="Settings sections"
            >
              {navTabs.map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-testid={`settings-nav-${tab.id}`}
                    type="button"
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink w-auto lg:w-full text-left ${
                      isActive
                        ? "bg-cine-accent text-white shadow-md shadow-cine-accent/25 font-semibold"
                        : "text-cine-muted hover:text-cine-text hover:bg-cine-card"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? "text-white" : "text-cine-muted"}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </div>

                    {tab.badge && (
                      <span
                        className={`hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-cine-card text-cine-muted border border-cine-border"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="lg:col-span-9 w-full min-w-0">
          {activeSection === "appearance" && (
            <AppearanceSection
              settings={settings.appearance}
              onChange={(updates) =>
                handleUpdate({
                  appearance: { ...settings.appearance, ...updates },
                })
              }
            />
          )}

          {activeSection === "providers" && (
            <ProvidersSection
              settings={settings.ai}
              onChange={(updates) =>
                handleUpdate({
                  ai: { ...settings.ai, ...updates },
                })
              }
              diagnostics={providersDiagnostic}
              isLoading={isDiagnosticsLoading}
            />
          )}

          {activeSection === "language" && (
            <LanguageSection
              settings={settings.language}
              onChange={(updates) =>
                handleUpdate({
                  language: { ...settings.language, ...updates },
                })
              }
            />
          )}

          {activeSection === "video" && (
            <VideoDefaultsSection
              settings={settings.video}
              onChange={(updates) =>
                handleUpdate({
                  video: { ...settings.video, ...updates },
                })
              }
              serverMaxUploadMb={diagnosticsReport?.maxVideoSizeMb || 100}
            />
          )}

          {activeSection === "captions" && (
            <CaptionDefaultsSection
              settings={settings.captions}
              onChange={(updates) =>
                handleUpdate({
                  captions: { ...settings.captions, ...updates },
                })
              }
            />
          )}

          {activeSection === "privacy" && (
            <PrivacySection
              settings={settings.privacy}
              onChange={(updates) =>
                handleUpdate({
                  privacy: { ...settings.privacy, ...updates },
                })
              }
              onResetAll={handleResetAll}
              onClearPreferences={handleClearPreferences}
            />
          )}

          {activeSection === "diagnostics" && (
            <SystemDiagnosticsSection
              report={diagnosticsReport}
              onRunDiagnostics={fetchDiagnostics}
              isLoading={isDiagnosticsLoading}
            />
          )}

          {activeSection === "about" && <AboutSection />}
        </main>
      </div>
    </div>
  );
}
