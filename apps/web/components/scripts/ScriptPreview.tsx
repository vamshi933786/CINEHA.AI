"use client";

import React from "react";
import {
  Film,
  Zap,
  Clock,
  Globe,
  Radio,
  Share2,
  FileText,
  Sparkles,
} from "lucide-react";
import type { Script, ScriptSegment as ScriptSegmentType, ScriptVisual } from "@/types/script";
import { ScriptSegment } from "./ScriptSegment";

interface ScriptPreviewProps {
  script: Script | null;
  activeSegments: ScriptSegmentType[];
  isEditing: boolean;
  onSegmentChange: (index: number, updated: ScriptSegmentType) => void;
  onTitleChange: (newTitle: string) => void;
  onHookChange: (newHook: string) => void;
  onCtaChange: (newCta: string) => void;
  isGenerating: boolean;
  error: string | null;
  attachedVisuals?: ScriptVisual[];
}

export function ScriptPreview({
  script,
  activeSegments,
  isEditing,
  onSegmentChange,
  onTitleChange,
  onHookChange,
  onCtaChange,
  isGenerating,
  error,
  attachedVisuals,
}: ScriptPreviewProps) {
  // Empty State
  if (!script && !isGenerating) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 sm:p-12 backdrop-blur-md flex flex-col items-center justify-center text-center h-full min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Your Screenplay Will Appear Here
        </h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
          Enter a topic, choose your target short-form platform and duration, and let the AI Script Studio craft your time-coded screenplay with visual and audio cues.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/5">
            0–3s High Retention Hook
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/5">
            Voiceover & Visual Cues
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/5">
            B-Roll & Sound Design
          </span>
        </div>
      </div>
    );
  }

  // Loading State
  if (isGenerating && !script) {
    return (
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-12 backdrop-blur-md flex flex-col items-center justify-center text-center h-full min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Writing Short-Form Screenplay...
        </h3>
        <p className="text-sm text-cyan-300/80 max-w-sm font-mono text-center">
          Calibrating beats, pacing, and visual cutaways...
        </p>
      </div>
    );
  }

  if (!script) return null;

  return (
    <div className="space-y-4">
      {/* Screenplay Document Container */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-7 backdrop-blur-md shadow-2xl">
        {/* Screenplay Metadata Header */}
        <div className="pb-5 mb-6 border-b border-white/10">
          {isEditing ? (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Script Title
              </label>
              <input
                type="text"
                value={script.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full text-lg sm:text-xl font-bold text-white rounded-lg bg-slate-800/80 px-3 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {script.title}
              </h1>
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs font-semibold shrink-0">
                v{script.current_version}.0
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              {script.platform}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {script.duration_seconds} Seconds
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              {script.language}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
              Tone: {script.tone}
            </span>
          </div>
        </div>

        {/* Hook Callout Banner */}
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>0–3s Psychological Opening Hook</span>
          </div>
          {isEditing ? (
            <textarea
              rows={2}
              value={script.hook}
              onChange={(e) => onHookChange(e.target.value)}
              className="w-full text-sm font-semibold text-slate-100 rounded-lg bg-slate-800/90 p-2.5 border border-white/10 focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed italic">
              "{script.hook}"
            </p>
          )}
        </div>

        {/* Screenplay Timeline Beating List */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Screenplay Timeline ({activeSegments.length} Beats)</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Total: {script.duration_seconds}s
            </span>
          </div>

          <div className="space-y-3">
            {activeSegments.map((segment, idx) => {
              const segKey = segment.id || `seg-${idx}`;
              const attached = attachedVisuals?.find(
                (v) =>
                  v.is_attached &&
                  (v.segment_id === segment.id ||
                    v.segment_id === `seg-${idx}` ||
                    v.segment_id === `seg_${idx}` ||
                    (!v.segment_id && idx === 0))
              );
              return (
                <ScriptSegment
                  key={segKey}
                  segment={segment}
                  index={idx}
                  isEditing={isEditing}
                  onChange={(updated) => onSegmentChange(idx, updated)}
                  attachedVisual={attached}
                />
              );
            })}
          </div>
        </div>

        {/* CTA Callout Banner */}
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-cyan-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Final Call to Action (CTA)</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={script.cta}
              onChange={(e) => onCtaChange(e.target.value)}
              className="w-full text-sm font-semibold text-slate-100 rounded-lg bg-slate-800/90 px-3 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              "{script.cta}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
