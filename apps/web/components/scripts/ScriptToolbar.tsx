"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Edit2,
  Save,
  X,
  Copy,
  Check,
  Download,
  RotateCcw,
  History,
  ChevronDown,
  Activity,
} from "lucide-react";
import type { Script, ScriptVersion } from "@/types/script";

interface ScriptToolbarProps {
  script: Script | null;
  isEditing: boolean;
  isSavingVersion: boolean;
  onToggleEdit: () => void;
  onSaveVersion: () => void;
  onCancelEdit: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onExport: () => void;
  hasCopied: boolean;
  versions: ScriptVersion[];
  selectedVersionNumber: number;
  onSelectVersion: (versionNum: number) => void;
}

export function ScriptToolbar({
  script,
  isEditing,
  isSavingVersion,
  onToggleEdit,
  onSaveVersion,
  onCancelEdit,
  onRegenerate,
  onCopy,
  onExport,
  hasCopied,
  versions,
  selectedVersionNumber,
  onSelectVersion,
}: ScriptToolbarProps) {
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  if (!script) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-md">
      {/* Left: Version Selector / History */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowVersionDropdown((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/10 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>Version {selectedVersionNumber}</span>
          {versions.length > 1 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
              {versions.length}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* Dropdown Menu */}
        {showVersionDropdown && (
          <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-white/10 bg-slate-900 shadow-2xl p-1.5 z-30 space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5">
              Version History
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1">
              {versions.map((ver) => (
                <button
                  type="button"
                  key={ver.id || ver.version_number}
                  onClick={() => {
                    onSelectVersion(ver.version_number);
                    setShowVersionDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    ver.version_number === selectedVersionNumber
                      ? "bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div className="font-medium">Version {ver.version_number}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      {ver.change_summary || "Screenplay build"}
                    </div>
                  </div>
                  {ver.version_number === selectedVersionNumber && (
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              disabled={isSavingVersion}
              onClick={onSaveVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingVersion ? "Saving..." : "Save as New Version"}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Script</span>
            </button>

            <Link
              href={`/analyzer?script_id=${script.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:scale-[1.02]"
              title="Perform 9-point psychological retention analysis in Script Retention Analyzer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Analyze Retention</span>
            </Link>

            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export (.txt)</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
