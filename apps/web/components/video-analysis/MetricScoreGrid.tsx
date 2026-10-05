"use client";

import React, { useState } from "react";
import {
  Zap,
  Eye,
  Layers,
  Activity,
  Compass,
  Repeat,
  BookOpen,
  HelpCircle,
  Megaphone,
  Subtitles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VideoAnalysisMetric } from "@/types/videoAnalysis";

interface MetricScoreGridProps {
  metrics: VideoAnalysisMetric[];
}

const METRIC_ICONS: Record<string, React.ElementType> = {
  hook_strength: Zap,
  opening_clarity: Eye,
  retention_structure: Layers,
  pacing: Activity,
  information_density: Compass,
  filler_repetition: Repeat,
  story_flow: BookOpen,
  curiosity_open_loops: HelpCircle,
  cta_strength: Megaphone,
  accessibility_readiness: Subtitles,
};

export function MetricScoreGrid({ metrics }: MetricScoreGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-500";
    if (score >= 70) return "text-cyan-400 bg-cyan-500";
    if (score >= 50) return "text-amber-400 bg-amber-500";
    return "text-rose-400 bg-rose-500";
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 85) return "emerald";
    if (score >= 70) return "accent";
    if (score >= 50) return "amber";
    return "rose";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>10-Dimensional Retention Diagnostics</span>
        </h3>
        <span className="text-xs text-slate-400">Click any dimension for evidence & tweaks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const Icon = METRIC_ICONS[metric.id] || Zap;
          const isExpanded = expandedId === metric.id;
          const scoreClass = getScoreColor(metric.score);
          const textColor = scoreClass.split(" ")[0];
          const barColor = scoreClass.split(" ")[1];

          return (
            <div
              key={metric.id}
              onClick={() => toggleExpand(metric.id)}
              className={`cursor-pointer rounded-xl border p-4.5 transition-all duration-200 ${
                isExpanded
                  ? "border-cyan-500/50 bg-slate-900/90 shadow-lg shadow-cyan-950/20"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              <div className="space-y-3">
                {/* Metric Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{metric.label}</h4>
                      <Badge variant={getBadgeVariant(metric.score)} size="sm" className="mt-0.5 text-[10px]">
                        {metric.rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-extrabold font-mono ${textColor}`}>{metric.score}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(5, metric.score)}%` }}
                  />
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed">{metric.summary}</p>

                {/* Expanded Details: Evidence and Recommendation */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
                    {/* Empirical Evidence */}
                    {metric.evidence && metric.evidence.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Observed Signals:
                        </p>
                        <ul className="space-y-1">
                          {metric.evidence.map((ev, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Recommendation */}
                    {metric.recommendation && (
                      <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[11px] uppercase tracking-wider text-cyan-300 block">
                            Recommended Tweak:
                          </span>
                          <span className="leading-snug">{metric.recommendation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
