"use client";

import React from "react";
import {
  Target,
  Zap,
  TrendingUp,
  Layers,
  Scissors,
  Clock,
  HelpCircle,
  Flame,
  Award,
} from "lucide-react";
import type { ScriptAnalysisResponse, CategoryScore } from "@/types/analyzer";
import { RETENTION_CATEGORIES } from "@/types/analyzer";

interface CategoryScoresGridProps {
  analysis: ScriptAnalysisResponse;
}

const iconMap: Record<string, React.ElementType> = {
  Target,
  Zap,
  TrendingUp,
  Layers,
  Scissors,
  Clock,
  HelpCircle,
  Flame,
  Award,
};

export function CategoryScoresGrid({ analysis }: CategoryScoresGridProps) {
  const getBadgeStyle = (score: number) => {
    if (score >= 88) {
      return {
        pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
        scoreColor: "text-emerald-400",
      };
    }
    if (score >= 75) {
      return {
        pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        bar: "bg-gradient-to-r from-cyan-500 to-blue-400",
        scoreColor: "text-cyan-400",
      };
    }
    if (score >= 60) {
      return {
        pill: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        bar: "bg-gradient-to-r from-amber-500 to-orange-400",
        scoreColor: "text-amber-400",
      };
    }
    return {
      pill: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      bar: "bg-gradient-to-r from-rose-500 to-red-400",
      scoreColor: "text-rose-400",
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>9-Dimension Retention Breakdown</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep-dive heuristic scoring evaluating auditory, psychological, and conversion retention factors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RETENTION_CATEGORIES.map((cat, idx) => {
          const catData = analysis[cat.key] as CategoryScore;
          const Icon = iconMap[cat.iconName] || Target;
          const styles = getBadgeStyle(catData?.score ?? 0);

          return (
            <div
              key={cat.key}
              className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-slate-900/60 p-4 transition-all duration-200 hover:border-white/15 hover:bg-slate-900/90 hover:shadow-lg"
            >
              {/* Header: Icon, Category Name, Score */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 text-slate-300 group-hover:text-cyan-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">0{idx + 1}</span>
                        <h4 className="text-sm font-semibold text-slate-100">{cat.label}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xl font-black font-mono ${styles.scoreColor}`}>
                      {catData?.score ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/100</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${styles.bar}`}
                    style={{ width: `${Math.max(5, catData?.score ?? 0)}%` }}
                  />
                </div>

                {/* Rating Badge */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles.pill}`}
                  >
                    {catData?.rating || "Evaluated"}
                  </span>
                </div>

                {/* In-depth qualitative explanation */}
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                  {catData?.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
