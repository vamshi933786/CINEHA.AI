"use client";

import React, { useState } from "react";
import {
  Link2,
  Sparkles,
  AlertCircle,
  Youtube,
  Instagram,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { VideoURLScriptExtraction } from "@/types/scriptInput";

const SCRIPT_LANGUAGES = ["English", "Telugu", "Tanglish"];

const EXTRACTION_STEPS = [
  "Validating URL & Anti-SSRF Security Check...",
  "Resolving Video Title & Creator Metadata...",
  "Checking Official / Auto-generated Captions...",
  "Running Local Whisper Speech Recognition...",
  "Processing Language & Telugu / Tanglish Script...",
  "Finalizing Extracted Spoken Script...",
];

interface VideoURLInputPanelProps {
  onExtracted: (result: VideoURLScriptExtraction) => void;
  className?: string;
}

export function VideoURLInputPanel({
  onExtracted,
  className = "",
}: VideoURLInputPanelProps) {
  const [url, setUrl] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Platform detection helper
  const detectPlatform = (inputUrl: string): "YouTube" | "Instagram" | "TikTok" | "Unknown" => {
    const trimmed = inputUrl.trim().toLowerCase();
    if (!trimmed) return "Unknown";
    if (trimmed.includes("tiktok.com")) return "TikTok";
    if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) return "YouTube";
    if (trimmed.includes("instagram.com") || trimmed.includes("instagr.am")) return "Instagram";
    return "Unknown";
  };

  const detectedPlatform = detectPlatform(url);

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError("Please paste a valid YouTube or Instagram video URL.");
      return;
    }

    if (detectedPlatform === "TikTok") {
      setError("TikTok is not supported in this phase. Supported platforms: YouTube and Instagram.");
      return;
    }

    if (detectedPlatform === "Unknown") {
      setError("This platform is not supported. Supported platforms: YouTube and Instagram.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setCurrentStepIndex(0);

    // Multi-stage stepper
    const intervals: NodeJS.Timeout[] = [];
    EXTRACTION_STEPS.forEach((_, idx) => {
      if (idx > 0) {
        intervals.push(
          setTimeout(() => {
            setCurrentStepIndex(idx);
          }, idx * 750)
        );
      }
    });

    try {
      const result = await api.extractScriptFromUrl({
        url: cleanUrl,
        language,
      });

      onExtracted(result);
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to extract script from this video URL. The video may be private, restricted, or unavailable."
      );
    } finally {
      intervals.forEach(clearTimeout);
      setIsExtracting(false);
      setCurrentStepIndex(0);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col h-full ${className}`}
    >
      {/* Header */}
      <div className="mb-5 pb-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Video URL Script Extraction
            </h2>
            <p className="text-xs text-slate-400">
              Paste YouTube or Instagram link to transcribe & adapt
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          URL Mode
        </span>
      </div>

      <form onSubmit={handleExtract} className="space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Supported Platforms Notice */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Supported:</span>
              <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                <Youtube className="w-3.5 h-3.5" /> YouTube / Shorts
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-pink-400 font-medium">
                <Instagram className="w-3.5 h-3.5" /> Instagram Reels
              </span>
            </div>
            <span className="text-slate-500 text-[10px]">No login required</span>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Video Link (YouTube or Instagram)</span>
              {detectedPlatform === "YouTube" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                  <Youtube className="w-3 h-3" /> YouTube Detected
                </span>
              )}
              {detectedPlatform === "Instagram" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-pink-400 font-medium">
                  <Instagram className="w-3 h-3" /> Instagram Detected
                </span>
              )}
              {detectedPlatform === "TikTok" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  TikTok (Unsupported)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isExtracting}
                placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/reel/..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spoken Language & Script Output</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SCRIPT_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  disabled={isExtracting}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                    language === lang
                      ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold shadow-sm shadow-cyan-500/20"
                      : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {language === "Telugu"
                ? "Extracts dialogue in native Telugu Unicode (తెలుగు). Preserves film vocabulary."
                : language === "Tanglish"
                ? "Extracts Telugu dialogue written phonetically in Latin script (te-Latn)."
                : "Standard English speech recognition."}
            </p>
          </div>

          {/* Stepper Progress Display */}
          {isExtracting && (
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Processing Video
                </span>
                <span className="font-mono text-[11px]">
                  Step {currentStepIndex + 1} of {EXTRACTION_STEPS.length}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 transition-all duration-500 rounded-full"
                  style={{
                    width: `${((currentStepIndex + 1) / EXTRACTION_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {EXTRACTION_STEPS[currentStepIndex]}
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Extraction Issue</p>
                <p className="text-rose-200/90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <Button
            type="submit"
            variant="primary"
            disabled={isExtracting || !url.trim()}
            isLoading={isExtracting}
            className="w-full"
            leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
          >
            {isExtracting ? "Extracting Script..." : "Extract Video Script"}
          </Button>
        </div>
      </form>
    </div>
  );
}
