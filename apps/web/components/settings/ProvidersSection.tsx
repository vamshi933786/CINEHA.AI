"use client";

import React from "react";
import {
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud,
  Check,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AIProviderSettings,
  LLMProviderChoice,
  TranscriptionProviderChoice,
} from "@/types/settings";
import { HealthProvidersResponse } from "@/types/api";

export interface ProvidersSectionProps {
  settings: AIProviderSettings;
  onChange: (updates: Partial<AIProviderSettings>) => void;
  diagnostics: HealthProvidersResponse | null;
  isLoading?: boolean;
}

export function ProvidersSection({
  settings,
  onChange,
  diagnostics,
  isLoading = false,
}: ProvidersSectionProps) {
  const geminiConfigured = diagnostics?.gemini?.configured ?? true;
  const geminiModel = diagnostics?.gemini?.model || "gemini-3.5-flash-lite";
  const localWhisperAvailable = diagnostics?.local_whisper?.available ?? true;
  const localWhisperModel = diagnostics?.local_whisper?.model || "base";
  const openaiConfigured = diagnostics?.caption_transcription?.configured ?? false;

  return (
    <div className="space-y-6">
      {/* Security Guarantee Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <span className="font-semibold text-white block">
            Zero-Leak Security Architecture
          </span>
          <p className="text-slate-300">
            All AI credentials and model secrets remain strictly isolated in server-side environment variables (<code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[11px] text-indigo-300">apps/api/.env</code>). No raw tokens, keys, or bearer credentials are ever delivered to or stored inside the client browser.
          </p>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-3">
          Configured AI Engines & Diagnostics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Gemini Card */}
          <Card className="border-cine-border bg-cine-surface/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Google Gemini</h4>
                    <span className="text-xs text-slate-400 font-mono">{geminiModel}</span>
                  </div>
                </div>
                <Badge
                  variant={geminiConfigured ? "emerald" : "amber"}
                  size="sm"
                >
                  {geminiConfigured ? "Active & Configured" : "Key Required"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-400 leading-relaxed">
                Primary LLM intelligence engine powering viral hook synthesis, 2-column visual screenplays, retention drop-off analysis, and hybrid Telugu speech restoration.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Hook Generator", "Script Studio", "Retention Curve", "Script Optimizer", "Telugu Restoration"].map(
                  (feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {feature}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Local Whisper Card */}
          <Card className="border-cine-border bg-cine-surface/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Local Whisper</h4>
                    <span className="text-xs text-slate-400 font-mono">model: {localWhisperModel}</span>
                  </div>
                </div>
                <Badge
                  variant={localWhisperAvailable ? "emerald" : "amber"}
                  size="sm"
                >
                  {localWhisperAvailable ? "Available On-Device" : "Installing"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-400 leading-relaxed">
                High-performance offline neural speech transcription. Delivers genuine acoustic word-level timestamps without network egress or API billing.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Word Timestamps", "Zero Cloud Cost", "Apple Silicon / CPU", "Offline Private"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* OpenAI Whisper Cloud */}
          <Card className="border-cine-border bg-cine-surface/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">OpenAI Whisper Cloud</h4>
                    <span className="text-xs text-slate-400 font-mono">whisper-1</span>
                  </div>
                </div>
                <Badge
                  variant={openaiConfigured ? "emerald" : "neutral"}
                  size="sm"
                >
                  {openaiConfigured ? "Configured" : "Standby / Fallback"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-400 leading-relaxed">
                Cloud speech-to-text API fallback. Activated when configured in backend environment or when selected for high-concurrency cloud deployments.
              </p>
            </CardContent>
          </Card>

          {/* Heuristic Mock Engine */}
          <Card className="border-cine-border bg-cine-surface/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Offline Mock Engine</h4>
                    <span className="text-xs text-slate-400 font-mono">heuristic-rule-engine</span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  Development Only
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic mock provider used for automated testing, offline sandbox exploration, and CI/CD validation without requiring active external API keys.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Provider Routing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>AI Routing & Execution Preferences</CardTitle>
          <CardDescription>
            Choose your preferred engines for generation, transcription, and restoration tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LLM Engine Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Preferred LLM Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "gemini" as LLMProviderChoice,
                  label: "Google Gemini 3.5 Flash Lite",
                  badge: "Recommended",
                  desc: "State-of-the-art multilingual speed, high retention intelligence, and native Telugu reasoning.",
                },
                {
                  id: "mock" as LLMProviderChoice,
                  label: "Development Mock Engine",
                  badge: "Offline",
                  desc: "Deterministic rule-based templates for offline testing without network connectivity.",
                },
              ].map((opt) => {
                const isSelected = settings.preferredLLM === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ preferredLLM: opt.id })}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-cine-accent bg-cine-accent/10"
                        : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="accent" size="sm">{opt.badge}</Badge>
                        {isSelected && <Check className="w-4 h-4 text-cine-accent" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 leading-relaxed">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transcription Provider Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Preferred Speech-to-Text Transcription Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "local_whisper" as TranscriptionProviderChoice,
                  label: "Local Whisper",
                  badge: "Free & Private",
                  desc: "Zero-cost on-device neural transcription with authentic word timestamps.",
                },
                {
                  id: "production" as TranscriptionProviderChoice,
                  label: "OpenAI Whisper",
                  badge: "Cloud API",
                  desc: "Cloud Whisper API for remote instances without local GPU/CPU compute.",
                },
                {
                  id: "mock" as TranscriptionProviderChoice,
                  label: "Development Mock",
                  badge: "Offline",
                  desc: "Simulated screenplay cues for unit tests and local layout debugging.",
                },
              ].map((opt) => {
                const isSelected = settings.preferredTranscription === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ preferredTranscription: opt.id })}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-cine-accent bg-cine-accent/10"
                        : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-cine-accent" />}
                    </div>
                    <span className="text-xs text-slate-400 leading-relaxed">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hybrid Telugu Restoration Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-cine-border">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Two-Stage Hybrid Telugu Restoration</h4>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
                  Automatically passes colloquial/code-switched Whisper Telugu transcripts through Gemini 3.5 Flash Lite to restore authentic Telugu words while preserving strict 1:1 segment timing.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-auto">
              <input
                type="checkbox"
                checked={settings.enableHybridTeluguRestoration}
                onChange={(e) => onChange({ enableHybridTeluguRestoration: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Hybrid Telugu Restoration"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
