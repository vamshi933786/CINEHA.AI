"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Clock,
  Video,
  Volume2,
  Type,
  ChevronDown,
  ChevronUp,
  Columns,
  Square,
  CheckCircle,
} from "lucide-react";
import type { Script, ScriptSegment } from "../../types/script";
import type { OptimizedScriptData } from "../../types/optimizer";

interface BeforeAfterScriptViewProps {
  originalScript: Script;
  optimizedScript: OptimizedScriptData;
}

export const BeforeAfterScriptView: React.FC<BeforeAfterScriptViewProps> = ({
  originalScript,
  optimizedScript,
}) => {
  const [viewMode, setViewMode] = useState<"split" | "original" | "optimized">("split");
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({
    "seg-0": true,
    "seg-1": true,
    "seg-2": true,
    "seg-3": true,
    "seg-4": true,
  });

  const toggleSegment = (id: string) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isHookChanged = originalScript.hook !== optimizedScript.hook;
  const isCtaChanged = originalScript.cta !== optimizedScript.cta;

  const maxSegments = Math.max(
    originalScript.segments?.length || 0,
    optimizedScript.segments?.length || 0
  );

  return (
    <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-5 shadow-xl transition-all">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232738]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Columns className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Screenplay Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Direct line-by-line inspection of retention improvements
            </p>
          </div>
        </div>

        {/* View Mode Switcher (helpful for mobile or focused reading) */}
        <div className="flex items-center gap-1 bg-[#181a26] border border-[#262b3d] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "split"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Split Comparison
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "original"
                ? "bg-slate-700/50 text-slate-200 border border-slate-600"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode("optimized")}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              viewMode === "optimized"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Optimized
          </button>
        </div>
      </div>

      {/* Comparison Container */}
      <div className="mt-5 space-y-6">
        {/* Hook Section Comparison */}
        <div className="bg-[#151724] border border-[#232738] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-[#181b2a] border-b border-[#232738] flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Opening Hook (0–3s Retention Driver)
            </span>
            {isHookChanged && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                Hook Upgraded
              </span>
            )}
          </div>

          <div
            className={`grid ${
              viewMode === "split"
                ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#232738]"
                : "grid-cols-1"
            }`}
          >
            {/* Original Hook */}
            {(viewMode === "split" || viewMode === "original") && (
              <div className="p-4 bg-[#141622]/60">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wide">
                  Original Hook
                </span>
                <p className="text-xs text-slate-300 italic leading-relaxed bg-[#191c2b] p-3 rounded-lg border border-[#262c3e]">
                  &ldquo;{originalScript.hook}&rdquo;
                </p>
              </div>
            )}

            {/* Optimized Hook */}
            {(viewMode === "split" || viewMode === "optimized") && (
              <div className="p-4 bg-[#141b2a]/60">
                <span className="text-[11px] font-semibold text-cyan-300 block mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  Optimized Hook
                  {isHookChanged && <span className="text-emerald-400 font-bold ml-1">●</span>}
                </span>
                <p className="text-xs text-cyan-100 font-medium italic leading-relaxed bg-[#172033] p-3 rounded-lg border border-cyan-500/40">
                  &ldquo;{optimizedScript.hook}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Script Segments Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Segment-by-Segment Timeline ({maxSegments} Beats)
            </h4>
            <span className="text-[11px] text-slate-400">
              Platform: {optimizedScript.platform} • Duration: {optimizedScript.duration_seconds}s
            </span>
          </div>

          {Array.from({ length: maxSegments }).map((_, idx) => {
            const origSeg: ScriptSegment | undefined = originalScript.segments?.[idx];
            const optSeg: ScriptSegment | undefined = optimizedScript.segments?.[idx];
            const segId = `seg-${idx}`;
            const isExpanded = expandedSegments[segId] ?? true;

            const isVoChanged = origSeg && optSeg && origSeg.voiceover !== optSeg.voiceover;
            const isTimingChanged =
              origSeg &&
              optSeg &&
              (origSeg.start_time !== optSeg.start_time || origSeg.end_time !== optSeg.end_time);

            return (
              <div
                key={segId}
                className="bg-[#151724] border border-[#232738] rounded-xl overflow-hidden transition-all"
              >
                {/* Segment Header */}
                <button
                  type="button"
                  onClick={() => toggleSegment(segId)}
                  className="w-full px-4 py-2.5 bg-[#181b2a] hover:bg-[#1c2033] transition flex items-center justify-between border-b border-[#232738]/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      Beat {idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#202538] text-slate-300 uppercase">
                      {optSeg?.section || origSeg?.section || "BEAT"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {optSeg?.start_time || origSeg?.start_time} - {optSeg?.end_time || origSeg?.end_time}
                    </span>
                    {isTimingChanged && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300">
                        Timing Adjusted
                      </span>
                    )}
                    {isVoChanged && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                        Copy Refined
                      </span>
                    )}
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Segment Content */}
                {isExpanded && (
                  <div
                    className={`grid ${
                      viewMode === "split"
                        ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#232738]"
                        : "grid-cols-1"
                    }`}
                  >
                    {/* Original Segment */}
                    {(viewMode === "split" || viewMode === "original") && (
                      <div className="p-4 bg-[#141622]/40 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>Original Version</span>
                          <span className="font-mono">
                            {origSeg ? `${origSeg.start_time} - ${origSeg.end_time}` : "N/A"}
                          </span>
                        </div>

                        {origSeg ? (
                          <div className="space-y-2.5">
                            {/* Voiceover */}
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Voiceover
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed bg-[#181a28] p-2.5 rounded-lg border border-[#262c3e]">
                                {origSeg.voiceover}
                              </p>
                            </div>

                            {/* Visual Direction & B-Roll */}
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Video className="w-3 h-3 text-slate-400" />
                                Visual / B-Roll
                              </span>
                              <p className="text-[11px] text-slate-400 leading-normal bg-[#181a28] p-2 rounded-lg border border-[#23283a]">
                                {origSeg.visual_direction}{" "}
                                {origSeg.b_roll && (
                                  <span className="text-slate-500">[{origSeg.b_roll}]</span>
                                )}
                              </p>
                            </div>

                            {/* On-Screen Text & Audio */}
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-[#181a28] p-2 rounded-lg border border-[#23283a]">
                                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                                  Text Overlay
                                </span>
                                <span className="text-slate-300">
                                  {origSeg.on_screen_text || "None"}
                                </span>
                              </div>
                              <div className="bg-[#181a28] p-2 rounded-lg border border-[#23283a]">
                                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                                  Audio / SFX
                                </span>
                                <span className="text-slate-300">
                                  {origSeg.audio_direction || "Natural"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No original segment</p>
                        )}
                      </div>
                    )}

                    {/* Optimized Segment */}
                    {(viewMode === "split" || viewMode === "optimized") && (
                      <div className="p-4 bg-[#141b2a]/40 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-cyan-300 font-medium">
                          <span className="flex items-center gap-1">
                            Optimized Version
                            {isVoChanged && <span className="text-emerald-400">●</span>}
                          </span>
                          <span className="font-mono text-cyan-400">
                            {optSeg ? `${optSeg.start_time} - ${optSeg.end_time}` : "N/A"}
                          </span>
                        </div>

                        {optSeg ? (
                          <div className="space-y-2.5">
                            {/* Voiceover */}
                            <div>
                              <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider block mb-1">
                                Voiceover
                              </span>
                              <p className={`text-xs leading-relaxed p-2.5 rounded-lg border transition ${
                                isVoChanged
                                  ? "bg-[#182338] text-white border-cyan-500/50 font-medium"
                                  : "bg-[#161a29] text-slate-300 border-[#262c3e]"
                              }`}>
                                {optSeg.voiceover}
                              </p>
                            </div>

                            {/* Visual Direction & B-Roll */}
                            <div>
                              <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Video className="w-3 h-3 text-cyan-400" />
                                Visual / B-Roll
                              </span>
                              <p className="text-[11px] text-slate-300 leading-normal bg-[#161a29] p-2 rounded-lg border border-[#252a3d]">
                                {optSeg.visual_direction}{" "}
                                {optSeg.b_roll && (
                                  <span className="text-cyan-400/90 font-medium">
                                    [{optSeg.b_roll}]
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* On-Screen Text & Audio */}
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-[#161a29] p-2 rounded-lg border border-[#252a3d]">
                                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                                  Text Overlay
                                </span>
                                <span className="text-cyan-200">
                                  {optSeg.on_screen_text || "None"}
                                </span>
                              </div>
                              <div className="bg-[#161a29] p-2 rounded-lg border border-[#252a3d]">
                                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                                  Audio / SFX
                                </span>
                                <span className="text-cyan-200">
                                  {optSeg.audio_direction || "Natural"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No optimized segment</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Section Comparison */}
        <div className="bg-[#151724] border border-[#232738] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-[#181b2a] border-b border-[#232738] flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Call-To-Action (Conversion Retention)
            </span>
            {isCtaChanged && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                CTA Sharpened
              </span>
            )}
          </div>

          <div
            className={`grid ${
              viewMode === "split"
                ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#232738]"
                : "grid-cols-1"
            }`}
          >
            {/* Original CTA */}
            {(viewMode === "split" || viewMode === "original") && (
              <div className="p-4 bg-[#141622]/60">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wide">
                  Original CTA
                </span>
                <p className="text-xs text-slate-300 italic leading-relaxed bg-[#191c2b] p-3 rounded-lg border border-[#262c3e]">
                  &ldquo;{originalScript.cta}&rdquo;
                </p>
              </div>
            )}

            {/* Optimized CTA */}
            {(viewMode === "split" || viewMode === "optimized") && (
              <div className="p-4 bg-[#141b2a]/60">
                <span className="text-[11px] font-semibold text-cyan-300 block mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  Optimized CTA
                  {isCtaChanged && <span className="text-emerald-400 font-bold ml-1">●</span>}
                </span>
                <p className="text-xs text-emerald-300 font-medium italic leading-relaxed bg-[#152328] p-3 rounded-lg border border-emerald-500/40">
                  &ldquo;{optimizedScript.cta}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
