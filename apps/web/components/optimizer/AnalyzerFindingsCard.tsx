"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Lightbulb,
  Scissors,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import type { ScriptAnalysisResponse } from "../../types/analyzer";
import {
  type OptimizationGoalKey,
  deriveRecommendedOptimizationGoals,
  SUPPORTED_OPTIMIZATION_GOALS,
} from "../../types/optimizer";

interface AnalyzerFindingsCardProps {
  analysis: ScriptAnalysisResponse;
  selectedGoals: OptimizationGoalKey[];
  onApplyGoals: (goals: OptimizationGoalKey[]) => void;
  scriptId?: string | null;
}

export const AnalyzerFindingsCard: React.FC<AnalyzerFindingsCardProps> = ({
  analysis,
  selectedGoals,
  onApplyGoals,
  scriptId,
}) => {
  const recommendedGoals = deriveRecommendedOptimizationGoals(analysis);
  const areAllRecommendedApplied =
    recommendedGoals.length > 0 &&
    recommendedGoals.every((g) => selectedGoals.includes(g));

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    if (score >= 70) return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    if (score >= 50) return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    return "bg-rose-500/10 text-rose-300 border-rose-500/30";
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#131b2e] to-[#0f121d] p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Header with Diagnostic Score and Return Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Analyzer Diagnostic Context
              </h3>
              <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Retention Audit
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live findings forwarded from your Retention Analyzer diagnostic.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${getScoreBadge(
              analysis.overall_score
            )}`}
          >
            <span>Score:</span>
            <span className={`text-sm ${getScoreColor(analysis.overall_score)}`}>
              {analysis.overall_score}/100
            </span>
            <span className="text-slate-400 font-sans font-normal text-[11px] hidden sm:inline">
              • {analysis.overall_rating}
            </span>
          </div>

          <Link
            href={scriptId && scriptId !== "custom" ? `/analyzer?script_id=${scriptId}` : "/analyzer"}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors underline"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Audit</span>
          </Link>
        </div>
      </div>

      {/* Weak Points & Actionable Directives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identified Drop-off Hazards */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Identified Drop-Off Hazards ({analysis.weak_points.length})
            </span>
          </div>

          {analysis.weak_points.length === 0 ? (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              No severe drop-off hazards identified in audit.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analysis.weak_points.slice(0, 3).map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] leading-snug">{w}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Flagged filler words tray */}
          {analysis.metrics?.detected_filler_words &&
            analysis.metrics.detected_filler_words.length > 0 && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                  <Scissors className="w-3 h-3" /> Flagged Fluff:
                </span>
                {analysis.metrics.detected_filler_words.map((w, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-rose-200 border border-rose-500/30 line-through"
                  >
                    "{w}"
                  </span>
                ))}
              </div>
            )}
        </div>

        {/* Actionable Directives */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              Audit Directives ({analysis.recommendations.length})
            </span>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {analysis.recommendations.slice(0, 3).map((r, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <span className="text-[11px] leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Goals Quick Action Bar */}
      {recommendedGoals.length > 0 && (
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/30 -mx-5 -mb-5 p-4 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">
              Recommended Optimization Goals:
            </span>
            {recommendedGoals.map((key) => {
              const meta = SUPPORTED_OPTIMIZATION_GOALS.find((g) => g.key === key);
              const isSelected = selectedGoals.includes(key);
              return (
                <span
                  key={key}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-800 text-slate-400 border-white/10"
                  }`}
                >
                  {meta?.label || key}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onApplyGoals(recommendedGoals)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
              areAllRecommendedApplied
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            }`}
          >
            {areAllRecommendedApplied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recommended Goals Applied</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Recommended Goals</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
