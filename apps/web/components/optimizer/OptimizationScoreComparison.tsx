"use client";

import React from "react";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  RETENTION_CATEGORIES,
  type ScriptAnalysisResponse,
} from "../../types/analyzer";

interface OptimizationScoreComparisonProps {
  beforeAnalysis: ScriptAnalysisResponse;
  afterAnalysis: ScriptAnalysisResponse;
}

export const OptimizationScoreComparison: React.FC<OptimizationScoreComparisonProps> = ({
  beforeAnalysis,
  afterAnalysis,
}) => {
  const beforeScore = beforeAnalysis.overall_score;
  const afterScore = afterAnalysis.overall_score;
  const delta = afterScore - beforeScore;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "from-emerald-500/20 to-teal-500/5 border-emerald-500/30";
    if (score >= 70) return "from-cyan-500/20 to-blue-500/5 border-cyan-500/30";
    if (score >= 50) return "from-amber-500/20 to-orange-500/5 border-amber-500/30";
    return "from-rose-500/20 to-pink-500/5 border-rose-500/30";
  };

  return (
    <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-5 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232738]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Retention Score Delta
            </h3>
            <p className="text-xs text-slate-400">
              Comparative 9-dimension diagnostic benchmark before & after optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {delta > 0 ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              +{delta} Points Gain
            </span>
          ) : delta === 0 ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              No Score Change
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
              {delta} Points
            </span>
          )}
        </div>
      </div>

      {/* Primary Score Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        {/* Before Score */}
        <div className="bg-[#161823] border border-[#232738] rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
              Original Retention Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${getScoreColor(beforeScore)}`}>
                {beforeScore}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              Rating: <strong className="text-slate-200">{beforeAnalysis.overall_rating}</strong>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#1d2030] border border-[#2e344d] text-center text-slate-300 text-xs font-semibold">
            {beforeAnalysis.overall_rating}
          </div>
        </div>

        {/* After Score */}
        <div className={`bg-gradient-to-br ${getScoreBg(afterScore)} border rounded-xl p-4 flex items-center justify-between relative overflow-hidden`}>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-cyan-300/90 block mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              Optimized Retention Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${getScoreColor(afterScore)}`}>
                {afterScore}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              {delta > 0 && (
                <span className="text-xs font-semibold text-emerald-400 ml-1">
                  (+{delta})
                </span>
              )}
            </div>
            <span className="text-xs text-slate-300 mt-1 inline-block">
              Rating: <strong className="text-white">{afterAnalysis.overall_rating}</strong>
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-center text-cyan-300 text-xs font-semibold">
            {afterAnalysis.overall_rating}
          </div>
        </div>
      </div>

      {/* 9-Dimension Category Comparison */}
      <div className="mt-4 pt-4 border-t border-[#232738]">
        <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Dimension-by-Dimension Retention Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {RETENTION_CATEGORIES.map((cat) => {
            const beforeVal = beforeAnalysis[cat.key]?.score ?? 0;
            const afterVal = afterAnalysis[cat.key]?.score ?? 0;
            const catDelta = afterVal - beforeVal;

            return (
              <div
                key={cat.key}
                className="bg-[#161824] border border-[#24293a] rounded-xl p-2.5 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-slate-200 capitalize truncate" title={cat.label}>
                    {cat.label}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-semibold shrink-0">
                    <span className="text-slate-400">{beforeVal}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                    <span className={afterVal >= beforeVal ? "text-emerald-400" : "text-rose-400"}>
                      {afterVal}
                    </span>
                    {catDelta !== 0 && (
                      <span className={`text-[10px] ml-0.5 ${catDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        ({catDelta > 0 ? `+${catDelta}` : catDelta})
                      </span>
                    )}
                  </div>
                </div>

                {/* Comparative bar */}
                <div className="w-full bg-[#202538] rounded-full h-1.5 overflow-hidden flex relative">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${beforeVal}%`, opacity: 0.4 }}
                  />
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${
                      afterVal >= 80
                        ? "bg-emerald-400"
                        : afterVal >= 65
                        ? "bg-cyan-400"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${afterVal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytical indicator disclaimer */}
      <div className="mt-4 pt-3 border-t border-[#232738]/80 flex items-start gap-2 text-[11px] text-slate-400">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Retention scores are calculated by algorithmic short-form structural heuristics (pacing cadence, word density, hook tension, open-loop frequency). Scores are analytical indicators to guide editing, not guaranteed viral metrics.
        </p>
      </div>
    </div>
  );
};
