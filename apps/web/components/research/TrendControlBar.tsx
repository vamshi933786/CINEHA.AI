"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Compass,
  Layers,
  Clock,
  Smartphone,
  Globe2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ResearchLanguage, ResearchDepth, TimeHorizon } from "@/types/trendResearch";
import type { CreatorProfile } from "@/types/creatorProfile";

interface TrendControlBarProps {
  topic: string;
  setTopic: (t: string) => void;
  language: ResearchLanguage;
  setLanguage: (l: ResearchLanguage) => void;
  platform: string;
  setPlatform: (p: string) => void;
  niche: string;
  setNiche: (n: string) => void;
  audience: string;
  setAudience: (a: string) => void;
  depth: ResearchDepth;
  setDepth: (d: ResearchDepth) => void;
  horizon: TimeHorizon;
  setHorizon: (h: TimeHorizon) => void;
  count: number;
  setCount: (c: number) => void;
  isLoading: boolean;
  onAnalyze: () => void;
  creatorProfile: CreatorProfile | null;
}

const QUICK_SUGGESTIONS = [
  "1-Light Budget Setup",
  "Handheld Camera Moves",
  "Smartphone Color Grading",
  "3-Second Visual Hook",
  "Small Bedroom Depth",
  "Why Budget Gear Wins",
];

const PLATFORMS = ["Instagram Reels", "YouTube Shorts", "TikTok"];
const DEPTHS: ResearchDepth[] = ["Quick Opportunities", "Deep Dive", "Comprehensive"];
const HORIZONS: TimeHorizon[] = ["Current Momentum", "Next 30 Days", "Evergreen"];
const LANGUAGES: { id: ResearchLanguage; label: string; sub: string }[] = [
  { id: "English", label: "English", sub: "Global Reach" },
  { id: "Telugu", label: "తెలుగు", sub: "Unicode Script" },
  { id: "Tanglish", label: "Tanglish", sub: "te-Latn" },
];

export function TrendControlBar({
  topic,
  setTopic,
  language,
  setLanguage,
  platform,
  setPlatform,
  niche,
  setNiche,
  audience,
  setAudience,
  depth,
  setDepth,
  horizon,
  setHorizon,
  count,
  setCount,
  isLoading,
  onAnalyze,
  creatorProfile,
}: TrendControlBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-cine-surface border border-cine-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Banner: Persona grounding */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cine-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-cine-text">
              Trend & Content Opportunity Engine
            </h2>
            <p className="text-xs text-cine-muted">
              Grounded in short-form retention psychology, creator pillars, and zero fake metrics
            </p>
          </div>
        </div>

        {creatorProfile && (
          <div className="flex items-center gap-1.5 text-xs text-cine-muted bg-cine-card px-2.5 py-1 rounded-md border border-cine-border">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Profile:</span>
            <span className="font-medium text-cine-text">
              {creatorProfile.creator_name || "Creator"}
            </span>
            <span className="text-cine-border">•</span>
            <span className="text-indigo-400">{niche || creatorProfile.niche}</span>
          </div>
        )}
      </div>

      {/* Main Seed Topic Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-cine-text flex items-center justify-between">
          <span>Seed Topic or Opportunity Vector (Optional)</span>
          <span className="text-cine-muted font-normal">
            Leave blank to auto-curate for your active persona
          </span>
        </label>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-cine-muted absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 1-Light cinematic setup, Smartphone Log exposure, or leave blank to curate for your profile..."
            className="w-full bg-cine-card border border-cine-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-cine-text placeholder:text-cine-muted/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                e.preventDefault();
                onAnalyze();
              }
            }}
          />
          {topic && (
            <button
              type="button"
              onClick={() => setTopic("")}
              className="absolute right-3 text-cine-muted hover:text-cine-text p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-cine-muted mr-1 font-mono">Quick ideas:</span>
          {QUICK_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setTopic(sug)}
              className="text-[11px] px-2 py-0.5 rounded bg-cine-card hover:bg-cine-border/50 text-cine-muted hover:text-cine-text border border-cine-border/60 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Language Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cine-text flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Language</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-cine-card p-1 rounded-lg border border-cine-border">
            {LANGUAGES.map((lang) => {
              const active = language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all text-center flex flex-col items-center justify-center ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-cine-muted hover:text-cine-text hover:bg-cine-surface/50"
                  }`}
                >
                  <span>{lang.label}</span>
                  <span
                    className={`text-[9px] ${
                      active ? "text-indigo-100" : "text-cine-muted/70"
                    }`}
                  >
                    {lang.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cine-text flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Platform</span>
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-cine-card border border-cine-border rounded-lg px-3 py-2.5 text-xs text-cine-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Horizon Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cine-text flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Horizon</span>
          </label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as TimeHorizon)}
            className="w-full bg-cine-card border border-cine-border rounded-lg px-3 py-2.5 text-xs text-cine-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {HORIZONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Toggle & Drawer */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-cine-muted hover:text-cine-text flex items-center gap-1.5 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters (Niche, Depth, Count)"}</span>
          {showAdvanced ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 mt-3 border-t border-cine-border/50">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cine-text">
                Niche Override
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={creatorProfile?.niche || "Cinematography"}
                className="w-full bg-cine-card border border-cine-border rounded-lg px-3 py-2 text-xs text-cine-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cine-text">
                Research Depth
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value as ResearchDepth)}
                className="w-full bg-cine-card border border-cine-border rounded-lg px-3 py-2 text-xs text-cine-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {DEPTHS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cine-text">
                Opportunity Count ({count})
              </label>
              <input
                type="range"
                min={3}
                max={8}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer mt-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Analyze Action Row */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-cine-muted flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Generates 5-factor transparent scores: Momentum (20%) + Audience Fit (25%) + Creator Fit (25%) + Opportunity (20%) + Urgency (10%)
          </span>
        </div>

        <Button
          onClick={onAnalyze}
          disabled={isLoading}
          variant="primary"
          size="md"
          className="px-6 py-2.5 font-medium flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Opportunities...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Discover Content Opportunities</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
