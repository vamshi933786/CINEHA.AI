"use client";

import React, { useState, useEffect } from "react";
import { FileText, ChevronDown, Sparkles, RefreshCw, Layers } from "lucide-react";
import { api } from "@/lib/api";
import type { Script } from "@/types/script";

interface ScriptSelectorProps {
  currentScriptId: string | null;
  onSelectScriptId: (scriptId: string) => void;
  onAnalyzeSample: (sampleKey: "viral" | "filler" | "cinematic") => void;
  isLoading: boolean;
}

export function ScriptSelector({
  currentScriptId,
  onSelectScriptId,
  onAnalyzeSample,
  isLoading,
}: ScriptSelectorProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadScripts() {
      setLoadingScripts(true);
      try {
        const data = await api.getScripts(20);
        setScripts(data || []);
      } catch (err) {
        console.error("Failed to load scripts for selector:", err);
      } finally {
        setLoadingScripts(false);
      }
    }
    loadScripts();
  }, []);

  const activeScript = scripts.find((s) => s.id === currentScriptId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md">
      {/* Left: Script selection dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isLoading || loadingScripts}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[200px] truncate">
              {activeScript ? activeScript.title : "Select Script to Analyze"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-slate-900 shadow-2xl p-2 z-50 max-h-60 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                Saved Screenplays ({scripts.length})
              </span>
              {scripts.length === 0 ? (
                <div className="px-2 py-3 text-xs text-slate-500 text-center">
                  No saved scripts found in Script Studio.
                </div>
              ) : (
                scripts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectScriptId(s.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                      s.id === currentScriptId
                        ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{s.title || s.topic}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {s.platform} • {s.duration_seconds}s • v{s.current_version}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {activeScript && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/5 text-[11px] text-slate-300">
              {activeScript.platform}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/5 text-[11px] text-slate-300">
              {activeScript.duration_seconds}s
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/5 text-[11px] text-cyan-400 font-mono">
              v{activeScript.current_version}
            </span>
          </div>
        )}
      </div>

      {/* Right: Quick test sample triggers */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
          Test Presets:
        </span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("viral")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95"
          title="Analyze high-velocity retention script"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Viral Pace</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("filler")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95"
          title="Analyze script with detected conversational filler words"
        >
          <Layers className="w-3 h-3 text-rose-400" />
          <span>Filler Test</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("cinematic")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all active:scale-95"
          title="Analyze cinematic mobile filmmaking guide"
        >
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span>Cinematic</span>
        </button>
      </div>
    </div>
  );
}
