"use client";

import React, { useState, useEffect } from "react";
import { FileText, ChevronDown, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import type { Script } from "../../types/script";

interface OptimizerScriptSelectorProps {
  currentScriptId: string | null;
  onSelectScriptId: (scriptId: string) => void;
  isLoading: boolean;
}

export const OptimizerScriptSelector: React.FC<OptimizerScriptSelectorProps> = ({
  currentScriptId,
  onSelectScriptId,
  isLoading,
}) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadScripts() {
      setLoadingScripts(true);
      try {
        const data = await api.getScripts(25);
        setScripts(data || []);
      } catch (err) {
        console.error("Failed to load scripts for optimizer selector:", err);
      } finally {
        setLoadingScripts(false);
      }
    }
    loadScripts();
  }, []);

  const activeScript = scripts.find((s) => s.id === currentScriptId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#232738] bg-[#12131a] shadow-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isLoading || loadingScripts}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#181a28] hover:bg-[#1f2336] text-slate-200 border border-[#262c3e] transition"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[220px] truncate">
              {activeScript ? activeScript.title : "Select Screenplay to Optimize"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-[#262c3e] bg-[#131522] shadow-2xl p-2 z-50 max-h-72 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 block">
                Saved Screenplays ({scripts.length})
              </span>
              {scripts.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">
                  No saved screenplays found. Create one in Script Studio first.
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex flex-col mb-1 ${
                      s.id === currentScriptId
                        ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                        : "text-slate-300 hover:bg-[#1a1d2e] border border-transparent"
                    }`}
                  >
                    <span className="truncate font-medium">{s.title || s.topic}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
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
            <span className="px-2.5 py-1 rounded-lg bg-[#181a28] border border-[#232738] text-[11px] text-slate-300 font-medium">
              {activeScript.platform}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#181a28] border border-[#232738] text-[11px] text-slate-300 font-medium">
              {activeScript.duration_seconds}s
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#181a28] border border-[#232738] text-[11px] text-cyan-300 font-mono">
              v{activeScript.current_version}
            </span>
          </div>
        )}
      </div>

      {loadingScripts && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Loading scripts...</span>
        </div>
      )}
    </div>
  );
};
