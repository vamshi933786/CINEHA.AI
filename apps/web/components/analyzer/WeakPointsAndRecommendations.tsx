"use client";

import React from "react";
import { AlertTriangle, Lightbulb, Scissors, CheckCircle, Sparkles } from "lucide-react";
import type { ScriptAnalysisResponse } from "@/types/analyzer";

interface WeakPointsAndRecommendationsProps {
  analysis: ScriptAnalysisResponse;
}

export function WeakPointsAndRecommendations({
  analysis,
}: WeakPointsAndRecommendationsProps) {
  const { weak_points, recommendations, metrics } = analysis;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Identified Weak Points & Drop-Off Hazards */}
      <div className="flex flex-col rounded-2xl border border-rose-500/20 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Identified Retention Hazards</h3>
              <p className="text-[11px] text-slate-400">
                Moments of viewer friction, pacing drag, or cognitive overload.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            {weak_points.length} {weak_points.length === 1 ? "Issue" : "Issues"}
          </span>
        </div>

        {/* Filler words alert tray if any detected */}
        {metrics.detected_filler_words.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <Scissors className="w-3.5 h-3.5 text-rose-400" />
              <span>Flagged Conversational Fluff</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {metrics.detected_filler_words.map((word, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-rose-500/20 text-rose-200 border border-rose-500/40 line-through decoration-rose-400"
                >
                  "{word}"
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-rose-300/80">
              Cut these words to instantly boost speech velocity and avoid audience skip triggers.
            </p>
          </div>
        )}

        {/* List of weak points */}
        <div className="mt-4 space-y-2.5 flex-1">
          {weak_points.length === 0 ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-950/40 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>No critical retention hazards detected. Excellent script structure!</span>
            </div>
          ) : (
            weak_points.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-rose-500/20 transition-colors"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-[10px] font-bold text-rose-400 font-mono mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{point}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Concrete Optimization Directives */}
      <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Actionable Recommendations</h3>
              <p className="text-[11px] text-slate-400">
                Directives to elevate watch time, average completion, and shares.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {recommendations.length} Action Items
          </span>
        </div>

        {/* List of recommendations */}
        <div className="mt-4 space-y-2.5 flex-1">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-emerald-500/20 transition-colors"
            >
              <div className="p-1 rounded-md bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
