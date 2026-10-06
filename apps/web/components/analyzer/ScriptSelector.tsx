"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Layers,
  Search,
  Check,
  ArrowRight,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Script } from "@/types/script";

export type PresetKey = "viral" | "filler" | "cinematic" | "telugu_viral" | "tanglish_viral";

export interface ScriptSelectorProps {
  currentScriptId: string | null;
  onSelectScriptId: (scriptId: string) => void;
  onAnalyzeSample: (sampleKey: PresetKey) => void;
  isLoading: boolean;
  activeScriptTitle?: string;
  activePreset?: PresetKey | null;
}

export function ScriptSelector({
  currentScriptId,
  onSelectScriptId,
  onAnalyzeSample,
  isLoading,
  activeScriptTitle,
  activePreset = null,
}: ScriptSelectorProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadScripts() {
      setLoadingScripts(true);
      try {
        const data = await api.getScripts(50);
        if (isMounted) {
          setScripts(data || []);
        }
      } catch (err) {
        console.error("Failed to load scripts for selector:", err);
      } finally {
        if (isMounted) {
          setLoadingScripts(false);
        }
      }
    }
    loadScripts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click or tap
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key and return focus to trigger button
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const activeScript = scripts.find((s) => s.id === currentScriptId);

  // Compute clean display title
  const displayTitle = activeScript
    ? activeScript.title || activeScript.topic
    : activeScriptTitle
    ? activeScriptTitle
    : activePreset
    ? `Sample: ${activePreset.charAt(0).toUpperCase() + activePreset.slice(1)} Pace`
    : "Select Script to Analyze";

  const filteredScripts = searchQuery.trim()
    ? scripts.filter((s) => {
        const query = searchQuery.toLowerCase();
        return (
          (s.title || "").toLowerCase().includes(query) ||
          (s.topic || "").toLowerCase().includes(query) ||
          (s.platform || "").toLowerCase().includes(query)
        );
      })
    : scripts;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md"
    >
      {/* Left: Script selection trigger and dropdown */}
      <div className="flex items-center gap-3 min-w-0 max-w-full">
        <div className="relative">
          <button
            ref={buttonRef}
            id="script-selector-button"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls="script-selector-listbox"
            aria-label="Select script to analyze"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isOpen
                ? "bg-slate-750 text-white border-cyan-500/40 ring-1 ring-cyan-500/30"
                : "bg-slate-800 hover:bg-slate-750 text-slate-200 border-white/10"
            }`}
          >
            {loadingScripts ? (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="max-w-[170px] sm:max-w-[220px] md:max-w-[300px] truncate text-left">
              {loadingScripts ? "Loading scripts..." : displayTitle}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                isOpen ? "rotate-180 text-cyan-400" : ""
              }`}
            />
          </button>

          {/* Accessible, bounded, non-trapping dropdown */}
          {isOpen && (
            <div
              id="script-selector-listbox"
              role="listbox"
              aria-label="Saved screenplays"
              className="absolute left-0 top-full mt-2 w-72 sm:w-96 max-w-[calc(100vw-2.5rem)] rounded-xl border border-white/15 bg-slate-900 shadow-2xl p-2.5 z-50 overscroll-contain animate-fadeIn"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Saved Screenplays ({scripts.length})
                </span>
                <button
                  type="button"
                  aria-label="Close script selector"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search filter if there are more than 4 scripts */}
              {scripts.length > 4 && (
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter scripts..."
                    aria-label="Filter screenplays"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              )}

              {/* Bounded scroll area with overscroll-contain */}
              <div className="max-h-64 sm:max-h-80 overflow-y-auto overscroll-contain space-y-1 pr-1">
                {scripts.length === 0 ? (
                  <div className="px-3 py-4 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      No saved screenplays found in Script Studio.
                    </p>
                    <Link
                      href="/scripts"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>Create in Script Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : filteredScripts.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-slate-400 text-center">
                    No screenplays match "{searchQuery}".
                  </div>
                ) : (
                  filteredScripts.map((s) => (
                    <button
                      key={s.id}
                      role="option"
                      aria-selected={s.id === currentScriptId}
                      type="button"
                      onClick={() => {
                        onSelectScriptId(s.id);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                        s.id === currentScriptId
                          ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-medium">
                          {s.title || s.topic}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                          {s.platform} • {s.duration_seconds}s • v{s.current_version}
                        </span>
                      </div>
                      {s.id === currentScriptId && (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active script metadata badges */}
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
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            activePreset === "viral"
              ? "text-emerald-200 bg-emerald-500/25 border border-emerald-400 shadow-sm shadow-emerald-500/20"
              : "text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
          }`}
          title="Analyze high-velocity retention script"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Viral Pace</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("filler")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            activePreset === "filler"
              ? "text-rose-200 bg-rose-500/25 border border-rose-400 shadow-sm shadow-rose-500/20"
              : "text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
          }`}
          title="Analyze script with detected conversational filler words"
        >
          <Layers className="w-3 h-3 text-rose-400" />
          <span>Filler Test</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("cinematic")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            activePreset === "cinematic"
              ? "text-cyan-200 bg-cyan-500/25 border border-cyan-400 shadow-sm shadow-cyan-500/20"
              : "text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20"
          }`}
          title="Analyze cinematic mobile filmmaking guide"
        >
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span>Cinematic</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("telugu_viral")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            activePreset === "telugu_viral"
              ? "text-amber-200 bg-amber-500/25 border border-amber-400 shadow-sm shadow-amber-500/20"
              : "text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20"
          }`}
          title="తెలుగు స్క్రిప్ట్ రీటెన్షన్ ఆడిట్ (Telugu Unicode sample)"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>తెలుగు</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAnalyzeSample("tanglish_viral")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            activePreset === "tanglish_viral"
              ? "text-purple-200 bg-purple-500/25 border border-purple-400 shadow-sm shadow-purple-500/20"
              : "text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
          }`}
          title="Tanglish (te-Latn) screenplay sample"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Tanglish</span>
        </button>
      </div>
    </div>
  );
}
