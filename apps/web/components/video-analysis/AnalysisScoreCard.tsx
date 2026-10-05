"use client";

import React from "react";
import { Sparkles, Film, Clock, Gauge, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VideoAnalysisResponse } from "@/types/videoAnalysis";

interface AnalysisScoreCardProps {
  analysis: VideoAnalysisResponse;
}

export function AnalysisScoreCard({ analysis }: AnalysisScoreCardProps) {
  const { overall_score, overall_rating, summary, video, transcript } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    if (score >= 70) return "text-cyan-400 border-cyan-500/30 bg-cyan-950/20";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-950/20";
    return "text-rose-400 border-rose-500/30 bg-rose-950/20";
  };

  const getBadgeVariant = (score: number) => {
    if (score >= 85) return "emerald";
    if (score >= 70) return "accent";
    if (score >= 50) return "amber";
    return "rose";
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      {/* Header with Title and Overall Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Retention Potential Audit</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Creator-facing structural heuristic grounded in real speech delivery and hook velocity.
          </p>
        </div>

        <Badge variant={getBadgeVariant(overall_score)} size="md" className="self-start sm:self-auto font-semibold">
          {overall_rating}
        </Badge>
      </div>

      {/* Main Score Display and Executive Summary */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div
          className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 shadow-lg ${getScoreColor(
            overall_score
          )}`}
        >
          <span className="text-3xl font-extrabold font-mono tracking-tight">{overall_score}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">out of 100</span>
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-slate-200">Executive Summary</h3>
          <p className="text-xs text-slate-300/90 leading-relaxed">{summary}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Scores evaluate content structure and do not predict algorithm virality or impressions.</span>
          </div>
        </div>
      </div>

      {/* Video Container Signals / Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">Duration</p>
            <p className="text-xs font-bold text-slate-200 font-mono">{video.duration_seconds.toFixed(1)}s</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-2.5">
          <Film className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">Resolution</p>
            <p className="text-xs font-bold text-slate-200 font-mono">
              {video.width}×{video.height}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-2.5">
          <Gauge className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">Frame Rate</p>
            <p className="text-xs font-bold text-slate-200 font-mono">{video.fps} fps</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-2.5">
          {video.has_audio ? (
            <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase">Audio Track</p>
            <p className="text-xs font-bold text-slate-200 font-mono">
              {video.has_audio ? transcript.language : "No Audio"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
