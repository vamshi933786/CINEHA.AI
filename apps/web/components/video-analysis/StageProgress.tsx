"use client";

import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { ANALYSIS_STAGES, type AnalysisLoadingStage } from "@/types/videoAnalysis";

interface StageProgressProps {
  currentStage: AnalysisLoadingStage;
  filename?: string;
}

export function StageProgress({ currentStage, filename }: StageProgressProps) {
  const currentStageIndex = ANALYSIS_STAGES.findIndex((s) => s.stage === currentStage);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-8 space-y-6 shadow-2xl">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-white">Running Multimodal Retention Audit</h3>
        {filename && (
          <p className="text-xs text-slate-400 font-mono break-all">
            Asset: <span className="text-cyan-400">{filename}</span>
          </p>
        )}
        <p className="text-xs text-slate-500">
          Extracting container streams, transcribing speech with Local Whisper, and calculating structural metrics.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {ANALYSIS_STAGES.map((s, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div
              key={s.stage}
              className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "border-cyan-500/50 bg-cyan-950/20 text-white"
                  : isDone
                  ? "border-slate-800/80 bg-slate-950/40 text-slate-300"
                  : "border-transparent bg-transparent text-slate-600"
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold leading-tight ${
                      isCurrent ? "text-cyan-300" : isDone ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {idx + 1}. {s.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 font-mono animate-pulse">
                      In progress
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
