"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Save,
  Sparkles,
  ArrowLeft,
  Activity,
  Copy,
  Check,
  Cpu,
  RefreshCw,
} from "lucide-react";
import type { OptimizedScriptData } from "../../types/optimizer";

interface OptimizerToolbarProps {
  scriptId?: string;
  currentVersion: number;
  isSaving: boolean;
  isOptimizing: boolean;
  isSaved: boolean;
  providerUsed?: string;
  optimizedScript?: OptimizedScriptData;
  onSaveVersion: () => void;
  onRunOptimization: () => void;
}

export const OptimizerToolbar: React.FC<OptimizerToolbarProps> = ({
  scriptId,
  currentVersion,
  isSaving,
  isOptimizing,
  isSaved,
  providerUsed,
  optimizedScript,
  onSaveVersion,
  onRunOptimization,
}) => {
  const [copied, setCopied] = useState(false);

  const nextVersion = currentVersion + 1;

  const handleCopy = async () => {
    if (!optimizedScript) return;
    try {
      const scriptText = [
        `TITLE: ${optimizedScript.title}`,
        `HOOK: ${optimizedScript.hook}`,
        "",
        ...optimizedScript.segments.map(
          (s, i) =>
            `BEAT ${i + 1} (${s.start_time} - ${s.end_time}) [${s.section}]\nVOICEOVER: ${s.voiceover}\nVISUAL: ${s.visual_direction}${s.b_roll ? ` [B-Roll: ${s.b_roll}]` : ""}\nTEXT: ${s.on_screen_text || "None"}\nAUDIO: ${s.audio_direction || "Natural"}\n`
        ),
        `CTA: ${optimizedScript.cta}`,
      ].join("\n");

      await navigator.clipboard.writeText(scriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
      {/* Left Navigation and Status */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/studio"
          className="text-xs px-3 py-1.5 rounded-xl bg-[#181a28] border border-[#252b3d] text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Script Studio
        </Link>

        {scriptId && (
          <Link
            href={`/analyzer?script_id=${scriptId}`}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#181a28] border border-[#252b3d] text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/50 transition flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            Retention Audit
          </Link>
        )}

        {providerUsed && (
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#181b2a] border border-[#262c3e] text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Engine:{" "}
            <strong className="text-slate-200 uppercase font-mono">
              {providerUsed.replace(/_/g, " ")}
            </strong>
          </span>
        )}

        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#181b2a] border border-[#262c3e] text-slate-400 font-mono">
          Current: <strong className="text-slate-200">v{currentVersion}</strong>
        </span>

        {isSaved && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Committed to v{currentVersion}
          </span>
        )}
      </div>

      {/* Right Primary Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {optimizedScript && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs px-3 py-2 rounded-xl bg-[#181a28] border border-[#252b3d] text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copy Screenplay
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="text-xs px-4 py-2 rounded-xl bg-[#181d2f] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
          {isOptimizing ? "Optimizing..." : optimizedScript ? "Re-Optimize" : "Run Optimization"}
        </button>

        {optimizedScript && (
          <button
            type="button"
            onClick={onSaveVersion}
            disabled={isSaving || isSaved}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-lg ${
              isSaved
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/50 shadow-emerald-950/40"
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Saving..." : isSaved ? "Saved" : `Save as Version ${nextVersion}`}
          </button>
        )}
      </div>
    </div>
  );
};
