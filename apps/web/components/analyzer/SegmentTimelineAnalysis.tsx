"use client";

import React from "react";
import { GitCommit, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import type { ScriptAnalysisResponse, SegmentObservation } from "@/types/analyzer";

interface SegmentTimelineAnalysisProps {
  analysis: ScriptAnalysisResponse;
}

export function SegmentTimelineAnalysis({ analysis }: SegmentTimelineAnalysisProps) {
  const { segment_observations } = analysis;

  const getRiskBadge = (risk: SegmentObservation["retention_risk"]) => {
    switch (risk) {
      case "low":
        return {
          pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          label: "Low Risk",
        };
      case "medium":
        return {
          pill: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          label: "Watch Drop-Off",
        };
      case "high":
        return {
          pill: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: AlertCircle,
          label: "High Drop Hazard",
        };
      default:
        return {
          pill: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          icon: GitCommit,
          label: "Evaluated",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            <span>Beat-by-Beat Timeline Analysis</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Micro-level diagnostics pinpointing viewer engagement, delivery speed, and sensory cues across each video beat.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {segment_observations.length} {segment_observations.length === 1 ? "Beat" : "Beats"} Analyzed
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-indigo-500 before:to-purple-500">
        {segment_observations.map((seg, idx) => {
          const riskMeta = getRiskBadge(seg.retention_risk);
          const Icon = riskMeta.icon;

          return (
            <div
              key={seg.segment_id || idx}
              className="relative rounded-xl border border-white/5 bg-slate-950/60 p-4 transition-all hover:border-white/15 hover:bg-slate-950/90"
            >
              {/* Timeline dot */}
              <div
                className={`absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                  seg.retention_risk === "high"
                    ? "bg-rose-500 shadow-md shadow-rose-500/50"
                    : seg.retention_risk === "medium"
                    ? "bg-amber-400 shadow-md shadow-amber-500/50"
                    : "bg-cyan-400 shadow-md shadow-cyan-500/50"
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-800 text-slate-200 border border-white/10">
                    {seg.time_range}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    {seg.section}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskMeta.pill}`}
                  >
                    <Icon className="w-3 h-3" />
                    {riskMeta.label}
                  </span>
                </div>
              </div>

              {/* Observation statement */}
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                {seg.observation}
              </p>

              {/* Suggestion if present */}
              {seg.suggestion && (
                <div className="mt-2.5 flex items-start gap-2 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 text-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">Retention Tweak: </span>
                    <span>{seg.suggestion}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
