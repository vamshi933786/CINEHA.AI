"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  Edit3,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  MessageSquare,
} from "lucide-react";
import type {
  TranscriptionResult,
  TranscriptSegment,
  TranscriptWord,
} from "@/types/caption";

interface TranscriptEditorProps {
  transcription: TranscriptionResult;
  onUpdateTranscription: (updated: TranscriptionResult) => void;
  disabled?: boolean;
}

function formatSeconds(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export function TranscriptEditor({
  transcription,
  onUpdateTranscription,
  disabled = false,
}: TranscriptEditorProps) {
  const [viewMode, setViewMode] = useState<"segments" | "full">("segments");
  const [expandedWordSegmentId, setExpandedWordSegmentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update a single segment's text while preserving its timing data
  const handleSegmentTextChange = (segmentId: string, newText: string) => {
    const updatedSegments = transcription.segments.map((seg) => {
      if (seg.id === segmentId) {
        return {
          ...seg,
          text: newText,
        };
      }
      return seg;
    });

    const updatedFullText = updatedSegments.map((s) => s.text).join("\n\n");

    onUpdateTranscription({
      ...transcription,
      segments: updatedSegments,
      full_text: updatedFullText,
    });
  };

  // Update full transcript text
  const handleFullTextChange = (newFullText: string) => {
    onUpdateTranscription({
      ...transcription,
      full_text: newFullText,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription.full_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalWords = transcription.full_text.trim()
    ? transcription.full_text.trim().split(/\s+/).length
    : 0;

  const hasWordTimings = Boolean(
    transcription.metadata?.word_timings_available ??
      transcription.segments.some((seg) => seg.words && seg.words.length > 0)
  );

  return (
    <div className="rounded-2xl border border-[#232738] bg-[#12131a] shadow-xl overflow-hidden">
      {/* Editor Header */}
      <div className="p-4 sm:p-5 border-b border-[#212536] flex flex-wrap items-center justify-between gap-3 bg-[#151722]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Interactive Transcript Editor
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                {transcription.segments.length} Timed Cues
              </span>
              {hasWordTimings ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Word timings available
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Segment timings only
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Timestamps remain immutable while you correct names, jargon, or phrasing.
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Copy Action */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-[#181a28] border border-[#262c3e] flex items-center">
            <button
              type="button"
              onClick={() => setViewMode("segments")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "segments"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Timed Segments
            </button>
            <button
              type="button"
              onClick={() => setViewMode("full")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "full"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Full Transcript
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#181a28] hover:bg-[#1f2336] text-slate-300 border border-[#262c3e] transition"
            title="Copy full transcript"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-4 sm:p-5">
        {viewMode === "segments" ? (
          /* Segment List with Immutable Timestamps and Editable Text */
          <div className="space-y-3.5">
            {transcription.segments.map((seg, index) => {
              const hasWords = seg.words && seg.words.length > 0;
              const isExpanded = expandedWordSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  className="rounded-xl border border-[#23273a] bg-[#161826] p-4 transition-all hover:border-[#2d334d]"
                >
                  {/* Timing & Speaker Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#21253a]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1f2336] border border-[#2e344d] text-cyan-300 flex items-center gap-1.5 shadow-inner">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>
                          {formatSeconds(seg.start_time)} → {formatSeconds(seg.end_time)}
                        </span>
                      </span>

                      {seg.speaker && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 border border-violet-500/30 text-violet-300">
                          {seg.speaker}
                        </span>
                      )}

                      {seg.confidence && (
                        <span className="text-[10px] text-slate-400">
                          {Math.round(seg.confidence * 100)}% Confidence
                        </span>
                      )}
                    </div>

                    {hasWords && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedWordSegmentId(isExpanded ? null : seg.id)
                        }
                        className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition"
                      >
                        <span>{seg.words?.length} words</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Editable Segment Text */}
                  <div className="pt-3">
                    <label htmlFor={`seg-input-${seg.id}`} className="sr-only">
                      Edit segment {index + 1} transcript text
                    </label>
                    <textarea
                      id={`seg-input-${seg.id}`}
                      rows={2}
                      value={seg.text}
                      disabled={disabled}
                      onChange={(e) => handleSegmentTextChange(seg.id, e.target.value)}
                      placeholder="Enter transcript segment..."
                      className="w-full bg-[#11121c] border border-[#282d42] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 resize-y leading-relaxed transition"
                    />
                  </div>

                  {/* Word-level Timestamps Drilldown */}
                  {hasWords && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#21253a] bg-[#12131f]/70 rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                        Word Timings (Micro-Cues)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {seg.words?.map((w, wIdx) => (
                          <div
                            key={`${seg.id}-w-${wIdx}`}
                            className="px-2 py-1 rounded-lg bg-[#191c2b] border border-[#282d44] text-[11px] flex items-center gap-1.5"
                          >
                            <span className="text-slate-100 font-medium">{w.text}</span>
                            <span className="text-[9px] font-mono text-cyan-400">
                              {w.start_time.toFixed(2)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Full Continuous Transcript View */
          <div className="space-y-3">
            <label htmlFor="full-transcript-editor" className="sr-only">
              Full continuous transcript text
            </label>
            <textarea
              id="full-transcript-editor"
              rows={12}
              value={transcription.full_text}
              disabled={disabled}
              onChange={(e) => handleFullTextChange(e.target.value)}
              placeholder="Full transcript text..."
              className="w-full bg-[#11121c] border border-[#282d42] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 resize-y leading-relaxed font-sans transition"
            />
          </div>
        )}
      </div>

      {/* Editor Footer / Metrics */}
      <div className="px-5 py-3 border-t border-[#212536] bg-[#151722]/90 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span>
            Words: <strong className="text-slate-200 font-mono">{totalWords}</strong>
          </span>
          <span>•</span>
          <span>
            Segments:{" "}
            <strong className="text-slate-200 font-mono">
              {transcription.segments.length}
            </strong>
          </span>
          <span>•</span>
          <span>
            Language:{" "}
            <strong className="text-cyan-300 font-medium">
              {transcription.language}
            </strong>
          </span>
          <span>•</span>
          <span>
            Timings:{" "}
            <strong className="text-slate-200 font-mono">
              {hasWordTimings ? "Word + Segment" : "Segment Only"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Timing bounds are locked for downstream motion captions.</span>
        </div>
      </div>
    </div>
  );
}
