"use client";

import React from "react";
import { Gauge, Clock, Zap, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ScriptAnalysisResponse } from "@/types/analyzer";

interface RetentionScoreGaugeProps {
  analysis: ScriptAnalysisResponse;
}

export function RetentionScoreGauge({ analysis }: RetentionScoreGaugeProps) {
  const { overall_score, overall_rating, metrics, provider_used } = analysis;

  // Determine score color theme
  const getScoreTheme = (score: number) => {
    if (score >= 88) {
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        glow: "shadow-emerald-500/20",
        gradient: "from-emerald-400 to-teal-300",
        track: "stroke-emerald-400",
      };
    }
    if (score >= 75) {
      return {
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        bg: "bg-cyan-500/10",
        glow: "shadow-cyan-500/20",
        gradient: "from-cyan-400 to-blue-400",
        track: "stroke-cyan-400",
      };
    }
    if (score >= 60) {
      return {
        text: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
        glow: "shadow-amber-500/20",
        gradient: "from-amber-400 to-orange-400",
        track: "stroke-amber-400",
      };
    }
    return {
      text: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      glow: "shadow-rose-500/20",
      gradient: "from-rose-400 to-red-500",
      track: "stroke-rose-400",
    };
  };

  const theme = getScoreTheme(overall_score);

  // SVG Circular Gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall_score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl">
      {/* Background ambient glow */}
      <div
        className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          overall_score >= 75 ? "bg-cyan-500" : "bg-amber-500"
        }`}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Circular gauge + High-level verdict */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${theme.track}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-black tracking-tight ${theme.text}`}>
                {overall_score}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text}`}
              >
                <Activity className="w-3 h-3" />
                {overall_rating}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {provider_used === "gemini" ? "⚡️ Gemini Pro Audit" : "🛡️ Heuristic Speech-Science"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {analysis.title || "Retention Diagnostic Report"}
            </h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Multi-dimensional psychological retention audit evaluated across 9 core short-form
              retention pillars including 0–3s hook velocity, information density, and conversion friction.
            </p>
          </div>
        </div>

        {/* Right: Concrete speech & pacing metrics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Delivery Velocity
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">
                {metrics.words_per_second}
              </span>
              <span className="text-[11px] text-slate-400">wps</span>
            </div>
            <span className="text-[10px] text-cyan-300/80 truncate mt-0.5">
              {metrics.pacing_assessment.split("—")[0]}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Hook Duration
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">
                {metrics.hook_duration_seconds}s
              </span>
              <span className="text-[11px] text-slate-400">beat 1</span>
            </div>
            <span
              className={`text-[10px] mt-0.5 font-medium ${
                metrics.hook_duration_seconds <= 4.0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {metrics.hook_duration_seconds <= 4.0 ? "Optimal 0–3s" : "High cognitive load"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-indigo-400" />
              Spoken Density
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">
                {metrics.total_word_count}
              </span>
              <span className="text-[11px] text-slate-400">words</span>
            </div>
            <span className="text-[10px] text-indigo-300/80 mt-0.5">
              {metrics.detected_filler_words.length === 0
                ? "Zero conversational fluff"
                : `${metrics.detected_filler_words.length} filler phrases`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
