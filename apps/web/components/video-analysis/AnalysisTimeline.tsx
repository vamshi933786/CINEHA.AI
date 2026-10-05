"use client";

import React from "react";
import { Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VideoAnalysisSegment } from "@/types/videoAnalysis";

interface AnalysisTimelineProps {
  segments: VideoAnalysisSegment[];
  durationSeconds: number;
  currentTime?: number;
  onSeek: (seconds: number) => void;
}

const SEGMENT_COLORS: Record<string, { bg: string; border: string; text: string; badge: "default" | "accent" | "emerald" | "amber" | "rose" | "neutral" | "outline" }> = {
  HOOK: { bg: "bg-cyan-950/30", border: "border-cyan-500/40", text: "text-cyan-400", badge: "accent" },
  CONTEXT: { bg: "bg-purple-950/30", border: "border-purple-500/40", text: "text-purple-400", badge: "default" },
  VALUE: { bg: "bg-blue-950/30", border: "border-blue-500/40", text: "text-blue-400", badge: "default" },
  PAYOFF: { bg: "bg-emerald-950/30", border: "border-emerald-500/40", text: "text-emerald-400", badge: "emerald" },
  CTA: { bg: "bg-amber-950/30", border: "border-amber-500/40", text: "text-amber-400", badge: "amber" },
};


function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AnalysisTimeline({
  segments,
  durationSeconds,
  currentTime = 0,
  onSeek,
}: AnalysisTimelineProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400 text-xs">
        No spoken speech segments detected in this video asset.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Narrative Progression Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real time-coded beats. Click any segment to jump to that moment in the video.
          </p>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {segments.length} structural beat(s) mapped
        </span>
      </div>

      {/* Visual Bar Timeline */}
      <div className="w-full bg-slate-950 rounded-xl p-2 border border-slate-800/80">
        <div className="relative w-full h-8 flex gap-1 rounded-lg overflow-hidden bg-slate-900">
          {segments.map((seg) => {
            const widthPct = Math.max(8, (seg.duration_seconds / Math.max(1, durationSeconds)) * 100);
            const style = SEGMENT_COLORS[seg.label] || SEGMENT_COLORS.VALUE;
            const isActive = currentTime >= seg.start_seconds && currentTime <= seg.end_seconds;

            return (
              <button
                key={seg.segment_id}
                type="button"
                onClick={() => onSeek(seg.start_seconds)}
                style={{ width: `${widthPct}%` }}
                title={`${seg.label} (${formatTimestamp(seg.start_seconds)} - ${formatTimestamp(seg.end_seconds)})`}
                className={`h-full border transition-all duration-150 flex items-center justify-center text-[10px] font-mono font-bold truncate px-1 ${
                  style.bg
                } ${style.border} ${style.text} ${
                  isActive ? "ring-2 ring-white z-10 brightness-125" : "hover:brightness-110"
                }`}
              >
                [{seg.label}]
              </button>
            );
          })}
        </div>
      </div>

      {/* Segment Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {segments.map((seg) => {
          const style = SEGMENT_COLORS[seg.label] || SEGMENT_COLORS.VALUE;
          const isActive = currentTime >= seg.start_seconds && currentTime <= seg.end_seconds;

          return (
            <div
              key={seg.segment_id}
              onClick={() => onSeek(seg.start_seconds)}
              className={`group cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isActive
                  ? "border-cyan-400/80 bg-cyan-950/20 shadow-md shadow-cyan-950/40"
                  : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <button
                  type="button"
                  aria-label={`Jump to ${seg.label} at ${formatTimestamp(seg.start_seconds)}`}
                  className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 transition-colors flex-shrink-0 mt-0.5 sm:mt-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={style.badge} size="sm" className="font-mono text-[10px]">
                      {seg.label}
                    </Badge>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      {formatTimestamp(seg.start_seconds)} – {formatTimestamp(seg.end_seconds)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">({seg.duration_seconds.toFixed(1)}s)</span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    &ldquo;{seg.transcript}&rdquo;
                  </p>
                </div>
              </div>

              {seg.observation && (
                <div className="sm:max-w-xs text-[11px] text-slate-400 italic sm:text-right flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                  {seg.observation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
