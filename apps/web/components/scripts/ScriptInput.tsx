"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  User,
  Sliders,
  AlertCircle,
  ExternalLink,
  Zap,
  Clock,
  Globe,
  Radio,
  Share2,
} from "lucide-react";
import { useCreatorProfile } from "@/providers/CreatorProfileProvider";
import {
  SCRIPT_PLATFORMS,
  SCRIPT_LANGUAGES,
  SCRIPT_DURATIONS,
  CTA_PRESETS,
} from "@/types/script";

export interface ScriptFormData {
  topic: string;
  context: string;
  platform: string;
  language: string;
  duration_seconds: number;
  tone: string;
  hookMode: "auto" | "custom";
  hook: string;
  ctaPreset: string;
  customCta: string;
}

interface ScriptInputProps {
  formData: ScriptFormData;
  onChange: (data: Partial<ScriptFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  generationStage: string;
  error: string | null;
}

export function ScriptInput({
  formData,
  onChange,
  onSubmit,
  isGenerating,
  generationStage,
  error,
}: ScriptInputProps) {
  const { profile, isConfigured } = useCreatorProfile();

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="mb-5 pb-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Script Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Configure parameters & AI screenplay generation
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          Studio Mode
        </span>
      </div>

      {/* Creator Persona Banner */}
      <div className="mb-5">
        {isConfigured && profile ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Persona Connected: {profile.creator_name}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Niche: <strong className="text-slate-200">{profile.niche}</strong> • Default Tone:{" "}
              <strong className="text-slate-200">{profile.content_tones.slice(0, 2).join(", ")}</strong>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <span>No Creator Profile Configured</span>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Set Up Profile <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Complete your Creator Profile to personalize your script tone, niche, and hooks automatically.
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Topic / Idea */}
          <div>
            <label
              htmlFor="script-topic"
              className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5"
            >
              Topic / Video Concept <span className="text-rose-400">*</span>
            </label>
            <input
              id="script-topic"
              type="text"
              required
              value={formData.topic}
              onChange={(e) => onChange({ topic: e.target.value })}
              placeholder="e.g. 3 Lighting Mistakes That Ruin Your Mobile Video"
              className="w-full rounded-xl bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Optional Context */}
          <div>
            <label
              htmlFor="script-context"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Optional Context / Gear / Angle
            </label>
            <input
              id="script-context"
              type="text"
              value={formData.context}
              onChange={(e) => onChange({ context: e.target.value })}
              placeholder="e.g. iPhone 15 Pro with a bedside lamp in a small bedroom"
              className="w-full rounded-xl bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Platform & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="script-platform"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Platform</span>
              </label>
              <select
                id="script-platform"
                value={formData.platform}
                onChange={(e) => onChange({ platform: e.target.value })}
                className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
              >
                {SCRIPT_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="script-language"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Language</span>
              </label>
              <select
                id="script-language"
                value={formData.language}
                onChange={(e) => onChange({ language: e.target.value })}
                className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
              >
                {SCRIPT_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Duration</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {SCRIPT_DURATIONS.map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => onChange({ duration_seconds: dur })}
                  className={`py-2 px-1 rounded-lg text-xs font-mono font-medium transition-all text-center ${
                    formData.duration_seconds === dur
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 border border-cyan-400"
                      : "bg-slate-800/60 text-slate-300 border border-white/5 hover:border-white/20"
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {/* Tone Override */}
          <div>
            <label
              htmlFor="script-tone"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Tone Override (Optional)
            </label>
            <input
              id="script-tone"
              type="text"
              value={formData.tone}
              onChange={(e) => onChange({ tone: e.target.value })}
              placeholder={profile ? profile.content_tones.join(", ") : "Cinematic, Engaging, Punchy"}
              className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Hook Mode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Opening Hook</span>
              </label>
              <div className="flex rounded-lg bg-slate-800 p-0.5 border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => onChange({ hookMode: "auto" })}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                    formData.hookMode === "auto"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Auto-Generate
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ hookMode: "custom" })}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                    formData.hookMode === "custom"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom / Selected
                </button>
              </div>
            </div>

            {formData.hookMode === "custom" && (
              <textarea
                rows={2}
                value={formData.hook}
                onChange={(e) => onChange({ hook: e.target.value })}
                placeholder="Paste a hook generated from Hook Generator or enter custom hook dialogue..."
                className="w-full rounded-xl bg-slate-800/80 p-2.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none resize-none"
              />
            )}
          </div>

          {/* CTA Goal */}
          <div>
            <label
              htmlFor="script-cta-preset"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>CTA Goal</span>
            </label>
            <select
              id="script-cta-preset"
              value={formData.ctaPreset}
              onChange={(e) => onChange({ ctaPreset: e.target.value })}
              className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none mb-2"
            >
              {CTA_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>

            {formData.ctaPreset === "Custom CTA" && (
              <input
                type="text"
                value={formData.customCta}
                onChange={(e) => onChange({ customCta: e.target.value })}
                placeholder="Enter custom call to action..."
                className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2 mt-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Button & Realistic Progress Stage */}
        <div className="pt-3">
          {isGenerating ? (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm font-semibold">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Generating Screenplay...</span>
              </div>
              <p className="text-xs text-cyan-300/80 font-mono tracking-wide animate-pulse">
                {generationStage || "Structuring the hook..."}
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!formData.topic.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Structured Script</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
