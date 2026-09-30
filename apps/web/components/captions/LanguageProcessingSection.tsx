"use client";

import React, { useState } from "react";
import {
  Languages,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Undo2,
  Check,
  Columns,
  Eye,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type {
  TranscriptionResult,
  LanguageProcessingResult,
  LanguageProcessingMode,
  ProcessedTranscriptSegment,
} from "@/types/caption";

interface LanguageProcessingSectionProps {
  originalTranscription: TranscriptionResult;
  activeTranscription: TranscriptionResult;
  isProductionConfigured: boolean;
  onApplyProcessed: (processedResult: TranscriptionResult) => void;
  onRevertOriginal: () => void;
  isProcessedActive: boolean;
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

export function LanguageProcessingSection({
  originalTranscription,
  activeTranscription,
  isProductionConfigured,
  onApplyProcessed,
  onRevertOriginal,
  isProcessedActive,
  disabled = false,
}: LanguageProcessingSectionProps) {
  const sourceLanguage = originalTranscription.language;

  // Selected mode: default to transliteration if Telugu, otherwise translation
  const [mode, setMode] = useState<LanguageProcessingMode>(
    sourceLanguage === "Telugu" ? "transliteration" : "translation"
  );

  // Selected target language
  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    if (sourceLanguage === "Telugu") return "Tanglish";
    if (sourceLanguage === "English") return "Telugu";
    if (sourceLanguage === "Hindi") return "English";
    return "English";
  });

  const [selectedProvider, setSelectedProvider] = useState<string>("mock");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] =
    useState<LanguageProcessingResult | null>(null);
  const [viewMode, setViewMode] = useState<"side-by-side" | "processed" | "original">(
    "side-by-side"
  );
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Derive valid target options based on source language and mode
  const getValidTargetLanguages = (): Array<{ name: string; label: string; script: string }> => {
    if (mode === "transliteration") {
      if (sourceLanguage === "Telugu") {
        return [
          {
            name: "Tanglish",
            label: "Tanglish (Telugu in Latin script)",
            script: "Romanized (te-Latn)",
          },
        ];
      }
      return [];
    }

    // Translation mode
    if (sourceLanguage === "English") {
      return [
        { name: "Telugu", label: "Telugu", script: "తెలుగు లిపి" },
        { name: "Hindi", label: "Hindi", script: "देवनागरी लिपि" },
      ];
    }
    if (sourceLanguage === "Telugu") {
      return [
        { name: "English", label: "English", script: "Latin Script" },
        { name: "Hindi", label: "Hindi", script: "देवनागरी लिपि" },
      ];
    }
    if (sourceLanguage === "Hindi") {
      return [
        { name: "English", label: "English", script: "Latin Script" },
        { name: "Telugu", label: "Telugu", script: "తెలుగు లిపి" },
      ];
    }
    if (sourceLanguage === "Tanglish") {
      return [
        { name: "English", label: "English", script: "Latin Script" },
      ];
    }
    return [];
  };

  const validTargets = getValidTargetLanguages();

  // Handle mode toggle
  const handleModeChange = (newMode: LanguageProcessingMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === "transliteration") {
      if (sourceLanguage === "Telugu") {
        setTargetLanguage("Tanglish");
      }
    } else {
      // Translation mode
      if (sourceLanguage === "Telugu") {
        setTargetLanguage("English");
      } else if (sourceLanguage === "English") {
        setTargetLanguage("Telugu");
      } else if (sourceLanguage === "Hindi") {
        setTargetLanguage("English");
      }
    }
  };

  const handleProcess = async () => {
    if (mode === "transliteration" && sourceLanguage !== "Telugu") {
      setError(
        `Transliteration is currently supported for native Telugu script into Tanglish (te-Latn). Your current transcript is in ${sourceLanguage}. Please use Translation mode.`
      );
      return;
    }

    if (mode === "translation" && targetLanguage === "Tanglish") {
      setError(
        "Tanglish is Romanized Telugu script (te-Latn) requiring transliteration, not translation. Please use transliteration mode."
      );
      return;
    }

    if (selectedProvider === "production" && !isProductionConfigured) {
      setError(
        "Production language processing is not configured. Configure the provider credentials or switch to Development Mode."
      );
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAppliedSuccess(false);

    try {
      const response = await api.processLanguage({
        source_language: sourceLanguage,
        target_language: targetLanguage,
        processing_mode: mode,
        segments: originalTranscription.segments,
        full_text: originalTranscription.full_text,
        provider: selectedProvider,
      });

      setProcessingResult(response.result);
    } catch (err: any) {
      console.error("Language processing error:", err);
      setError(
        err?.message || "Failed to process transcript language. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!processingResult) return;

    // Convert processed segments to TranscriptionResult format
    const updatedTranscription: TranscriptionResult = {
      ...originalTranscription,
      language: processingResult.target_language,
      language_code: processingResult.target_language_code,
      is_transliteration: processingResult.is_transliteration,
      script_type: processingResult.script_type,
      full_text: processingResult.full_text,
      segments: processingResult.segments.map((s) => ({
        id: s.id,
        text: s.text,
        start_time: s.start_time,
        end_time: s.end_time,
        words: [], // Word timings marked unavailable for translated/transliterated text
        speaker: s.speaker,
        confidence: s.confidence,
      })),
      metadata: {
        ...originalTranscription.metadata,
        applied_language_processing: true,
        processing_mode: processingResult.processing_mode,
        source_language: processingResult.source_language,
        word_timings_available: false,
      },
    };

    onApplyProcessed(updatedTranscription);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const handleRevert = () => {
    onRevertOriginal();
    setAppliedSuccess(false);
  };

  return (
    <div className="rounded-2xl border border-[#232738] bg-[#12131a] p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#21253a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                5. Multi-Lingual Translation & Transliteration
              </h2>
              {isProcessedActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Processed Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Translate dialogue meaning across languages or transliterate native script into phonetic Tanglish (te-Latn).
            </p>
          </div>
        </div>

        {/* Revert Button if Processed is currently active */}
        {isProcessedActive && (
          <button
            type="button"
            onClick={handleRevert}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#181a28] hover:bg-[#1f2336] text-amber-300 border border-amber-500/30 transition self-start sm:self-auto"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Revert to Original ({originalTranscription.language})</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline text-rose-300 hover:text-white shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Applied Success Banner */}
      {appliedSuccess && (
        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Processed transcript applied as active captions! You can edit it above or revert to the original anytime.
          </span>
        </div>
      )}

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Source Language Info Card */}
        <div className="p-4 rounded-xl border border-[#23273a] bg-[#161826] space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Source Spoken Language
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base font-bold text-slate-100">
              {sourceLanguage}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {originalTranscription.language_code || "detected"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Detected from video audio track with {originalTranscription.segments.length} speech segments.
          </p>
        </div>

        {/* Operation Mode Selector */}
        <div className="p-4 rounded-xl border border-[#23273a] bg-[#161826] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Processing Mode
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>Translation ≠ Transliteration</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleModeChange("translation")}
              className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                mode === "translation"
                  ? "border-violet-500/50 bg-violet-950/20 text-violet-200 shadow-sm"
                  : "border-[#282d42] bg-[#12131f] text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xs font-semibold">Translation</span>
              <span className="text-[10px] text-slate-400 mt-1">
                Converts meaning into different language
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("transliteration")}
              className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                mode === "transliteration"
                  ? "border-violet-500/50 bg-violet-950/20 text-violet-200 shadow-sm"
                  : "border-[#282d42] bg-[#12131f] text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xs font-semibold">Transliteration</span>
              <span className="text-[10px] text-slate-400 mt-1">
                Telugu script → Romanized Tanglish
              </span>
            </button>
          </div>
        </div>

        {/* Target Language Selection */}
        <div className="p-4 rounded-xl border border-[#23273a] bg-[#161826] space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Target Output Language
          </span>

          {validTargets.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {validTargets.map((t) => {
                const isSelected = targetLanguage === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTargetLanguage(t.name)}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                      isSelected
                        ? "border-violet-500/50 bg-violet-950/20 text-violet-200 shadow-sm"
                        : "border-[#282d42] bg-[#12131f] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{t.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.script}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-300 text-[11px]">
              Transliteration is supported for native Telugu script into Tanglish (te-Latn). Switch to Translation mode to translate {sourceLanguage}.
            </div>
          )}
        </div>
      </div>

      {/* Provider Selector & Action Row */}
      <div className="pt-3 border-t border-[#21253a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Provider Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">Processor Engine:</span>
          <div className="p-1 rounded-xl bg-[#161826] border border-[#262c3e] flex items-center">
            <button
              type="button"
              onClick={() => setSelectedProvider("mock")}
              disabled={isProcessing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedProvider === "mock"
                  ? "bg-violet-500/20 text-violet-200 border border-violet-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Development Mock
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider("production")}
              disabled={isProcessing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedProvider === "production"
                  ? "bg-violet-500/20 text-violet-200 border border-violet-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              OpenAI Engine
            </button>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
              isProductionConfigured
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
          >
            {isProductionConfigured ? "Engine Configured" : "Engine Key Missing"}
          </span>
        </div>

        {/* Process Action Button */}
        <button
          type="button"
          onClick={handleProcess}
          disabled={isProcessing || validTargets.length === 0 || disabled}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
            isProcessing || validTargets.length === 0 || disabled
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              : "bg-violet-500 hover:bg-violet-400 text-white shadow-violet-500/20 hover:scale-[1.01]"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {mode === "transliteration"
                  ? "Transliterating to Tanglish..."
                  : "Translating Speech Segments..."}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {mode === "transliteration"
                  ? "Transliterate to Tanglish"
                  : `Translate to ${targetLanguage}`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Unconfigured Production Notice */}
      {selectedProvider === "production" && !isProductionConfigured && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-200">
              Production language processing is not configured. Configure the provider credentials or switch to Development Mode.
            </p>
            <p className="text-[11px] text-amber-300/80 mt-0.5">
              Set <code className="bg-[#12141e] px-1 py-0.5 rounded text-amber-200 font-mono">LANGUAGE_PROCESSOR_API_KEY</code> or <code className="bg-[#12141e] px-1 py-0.5 rounded text-amber-200 font-mono">OPENAI_API_KEY</code> in <code className="font-mono">apps/api/.env</code>.
            </p>
          </div>
        </div>
      )}

      {/* Processed Results & Comparison View */}
      {processingResult && (
        <div className="pt-4 border-t border-[#21253a] space-y-4">
          {/* Truthful Provider Status Banner */}
          {processingResult.notice ? (
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs shadow-lg space-y-1.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-200">
                    Development Language Processing Mode
                  </h3>
                  <p className="text-amber-300/90 mt-0.5 leading-relaxed">
                    {processingResult.notice}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] border-t border-amber-500/20 text-amber-400/90">
                <span>
                  Mode: <strong className="font-mono text-amber-200 uppercase">{processingResult.processing_mode}</strong>
                </span>
                <span>•</span>
                <span>
                  Provider: <strong className="font-mono text-amber-200">{processingResult.provider_name}</strong>
                </span>
                <span>•</span>
                <span>
                  Word Timings: <strong className="font-mono text-amber-200">Unavailable for Translated Text</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs shadow-lg space-y-1.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-200">
                    Production Language Processing Active
                  </h3>
                  <p className="text-emerald-300/90 mt-0.5 leading-relaxed">
                    Transcript processed via {processingResult.provider_name} with exact segment timing preservation.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] border-t border-emerald-500/20 text-emerald-400/90">
                <span>
                  Target: <strong className="font-mono text-emerald-200">{processingResult.target_language} ({processingResult.target_language_code})</strong>
                </span>
                <span>•</span>
                <span>
                  Script: <strong className="font-mono text-emerald-200">{processingResult.script_type}</strong>
                </span>
                <span>•</span>
                <span>
                  Word Timings: <strong className="font-mono text-emerald-200">Segment bounds preserved</strong>
                </span>
              </div>
            </div>
          )}

          {/* Comparison View Switcher & Apply Button Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#161826] border border-[#23273a]">
            {/* View Mode */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1">View:</span>
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "side-by-side"
                    ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("processed")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "processed"
                    ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Processed ({processingResult.target_language})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "original"
                    ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Original ({processingResult.source_language})</span>
              </button>
            </div>

            {/* Apply Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01]"
              >
                <Check className="w-4 h-4" />
                <span>Apply as Active Captions</span>
              </button>
            </div>
          </div>

          {/* Segment Comparison List */}
          <div className="space-y-3">
            {processingResult.segments.map((seg, idx) => {
              const origSeg = originalTranscription.segments[idx];
              return (
                <div
                  key={seg.id}
                  className="rounded-xl border border-[#23273a] bg-[#161826] p-4 space-y-3"
                >
                  {/* Segment Timing Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#21253a]">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1f2336] border border-[#2e344d] text-cyan-300">
                      {formatSeconds(seg.start_time)} → {formatSeconds(seg.end_time)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Segment {idx + 1} of {processingResult.segments.length}
                    </span>
                  </div>

                  {/* Segment Text Views */}
                  {viewMode === "side-by-side" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Original */}
                      <div
                        data-testid={`seg-original-${idx}`}
                        className="p-3 rounded-lg bg-[#11121c] border border-[#23273a] space-y-1"
                      >
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                          Original ({processingResult.source_language})
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                          {origSeg ? origSeg.text : seg.original_text}
                        </p>
                      </div>

                      {/* Processed */}
                      <div
                        data-testid={`seg-processed-${idx}`}
                        className="p-3 rounded-lg bg-[#141526] border border-violet-500/30 space-y-1"
                      >
                        <span className="text-[10px] font-mono font-semibold text-violet-300 uppercase tracking-wider block">
                          {processingResult.processing_mode === "transliteration"
                            ? "Transliterated (Tanglish)"
                            : `Translated (${processingResult.target_language})`}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans font-medium">
                          {seg.text}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewMode === "processed" && (
                    <div
                      data-testid={`seg-processed-${idx}`}
                      className="p-3 rounded-lg bg-[#141526] border border-violet-500/30 space-y-1"
                    >
                      <span className="text-[10px] font-mono font-semibold text-violet-300 uppercase tracking-wider block">
                        {processingResult.processing_mode === "transliteration"
                          ? "Transliterated (Tanglish)"
                          : `Translated (${processingResult.target_language})`}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                        {seg.text}
                      </p>
                    </div>
                  )}

                  {viewMode === "original" && (
                    <div
                      data-testid={`seg-original-${idx}`}
                      className="p-3 rounded-lg bg-[#11121c] border border-[#23273a] space-y-1"
                    >
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                        Original ({processingResult.source_language})
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {origSeg ? origSeg.text : seg.original_text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
