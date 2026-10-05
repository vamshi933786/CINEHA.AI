"use client";

import React, { useState } from "react";
import { Copy, Check, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VideoTranscriptInfo } from "@/types/videoAnalysis";

interface TranscriptPanelProps {
  transcript: VideoTranscriptInfo;
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!transcript.text) return;
    navigator.clipboard.writeText(transcript.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!transcript.available || !transcript.text.trim()) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-300">No Spoken Transcript Available</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Speech transcription was not detected in this video asset. Only video container metadata and heuristic visual parameters are available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Extracted Spoken Transcript</h3>
          <Badge variant="accent" size="sm">
            {transcript.language}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {transcript.word_count} words • {transcript.words_per_second} words/sec
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>

      {transcript.notice && (
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-purple-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>{transcript.notice}</span>
        </div>
      )}

      {/* Transcript text box */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-text">
        {transcript.text}
      </div>
    </div>
  );
}
