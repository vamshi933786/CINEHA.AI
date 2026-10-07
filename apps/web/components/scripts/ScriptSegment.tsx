"use client";

import React from "react";
import type { ScriptSegment as ScriptSegmentType, ScriptVisual } from "@/types/script";
import { Mic, Video, Layers, Type, Music, Clock, Sparkles } from "lucide-react";

interface ScriptSegmentProps {
  segment: ScriptSegmentType;
  index: number;
  isEditing: boolean;
  onChange?: (updated: ScriptSegmentType) => void;
  attachedVisual?: ScriptVisual;
}

export function ScriptSegment({
  segment,
  index,
  isEditing,
  onChange,
  attachedVisual,
}: ScriptSegmentProps) {
  const handleFieldChange = (field: keyof ScriptSegmentType, value: string) => {
    if (onChange) {
      onChange({
        ...segment,
        [field]: value,
      });
    }
  };

  const getSectionBadgeColor = (sec: string) => {
    const s = sec.toUpperCase();
    if (s.includes("HOOK")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (s.includes("PROBLEM") || s.includes("MISTAKE")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (s.includes("SOLUTION") || s.includes("BREAKDOWN")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s.includes("CTA") || s.includes("OUTRO")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  };

  return (
    <div
      data-testid={`script-segment-${segment.id || index}`}
      className="relative rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-white/20"
    >
      {/* Header: Timestamp and Section Label */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {segment.start_time} — {segment.end_time}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getSectionBadgeColor(
              segment.section
            )}`}
          >
            {segment.section}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Beat #{index + 1}
        </span>
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <div className="space-y-4 pt-1">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <span className="text-amber-400">Section Label</span>
            </label>
            <input
              type="text"
              value={segment.section}
              onChange={(e) => handleFieldChange("section", e.target.value)}
              className="w-full rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voiceover / Dialogue</span>
            </label>
            <textarea
              rows={2}
              value={segment.voiceover}
              onChange={(e) => handleFieldChange("voiceover", e.target.value)}
              className="w-full rounded-lg bg-slate-800/80 p-2.5 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none resize-y"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>Visual Direction</span>
            </label>
            <textarea
              rows={2}
              value={segment.visual_direction}
              onChange={(e) => handleFieldChange("visual_direction", e.target.value)}
              className="w-full rounded-lg bg-slate-800/80 p-2.5 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>B-Roll Cutaway</span>
              </label>
              <input
                type="text"
                value={segment.b_roll || ""}
                onChange={(e) => handleFieldChange("b_roll", e.target.value)}
                placeholder="Optional B-roll cue"
                className="w-full rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>On-Screen Text</span>
              </label>
              <input
                type="text"
                value={segment.on_screen_text}
                onChange={(e) => handleFieldChange("on_screen_text", e.target.value)}
                className="w-full rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio & Sound Cue</span>
            </label>
            <input
              type="text"
              value={segment.audio_direction || ""}
              onChange={(e) => handleFieldChange("audio_direction", e.target.value)}
              placeholder="Sound effect, foley, or music cue"
              className="w-full rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-white border border-white/10 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        /* Screenplay View Mode */
        <div className="space-y-3">
          {/* Voiceover */}
          <div className="rounded-lg bg-cyan-950/20 border border-cyan-500/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 mb-1">
              <Mic className="w-3.5 h-3.5" />
              <span>Voiceover</span>
            </div>
            <p className="text-sm font-medium text-slate-100 leading-relaxed italic">
              "{segment.voiceover}"
            </p>
          </div>

          {/* Visual & B-roll */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="rounded-lg bg-slate-850 bg-slate-800/40 border border-white/5 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-400 mb-1">
                <Video className="w-3.5 h-3.5" />
                <span>Visual Direction</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                {segment.visual_direction}
              </p>
            </div>

            {segment.b_roll && (
              <div className="rounded-lg bg-slate-850 bg-slate-800/40 border border-white/5 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>B-Roll Cutaway</span>
                </div>
                <p className="text-xs text-slate-300 leading-normal">
                  {segment.b_roll}
                </p>
              </div>
            )}
          </div>

          {/* On-screen text & Audio */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {segment.on_screen_text && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                <Type className="w-3 h-3 text-amber-400" />
                <span className="font-mono tracking-wide">{segment.on_screen_text}</span>
              </div>
            )}
            {segment.audio_direction && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                <Music className="w-3 h-3 text-indigo-400" />
                <span>{segment.audio_direction}</span>
              </div>
            )}
          </div>

          {/* Attached AI Visual Concept */}
          {attachedVisual && (
            <div className="mt-3 p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between gap-3 transition">
              <div className="flex items-center gap-3 min-w-0">
                {attachedVisual.image_url ? (
                  <img
                    src={attachedVisual.image_url}
                    alt={attachedVisual.concept_title}
                    className="w-12 h-16 rounded-lg object-cover border border-white/10 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-16 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      AI Visual Concept
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {attachedVisual.visual_type} • {attachedVisual.aspect_ratio}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{attachedVisual.concept_title}</p>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{attachedVisual.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
