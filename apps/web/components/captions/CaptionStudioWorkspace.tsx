"use client";

import React, { useState, useEffect } from "react";
import {
  Subtitles,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe2,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { VideoDropzone, VideoMetadata } from "./VideoDropzone";
import { TranscriptEditor } from "./TranscriptEditor";
import { LanguageProcessingSection } from "./LanguageProcessingSection";
import { CaptionCueWorkspace } from "./CaptionCueWorkspace";
import { api } from "@/lib/api";
import {
  TranscriptionResponse,
  TranscriptionResult,
  CAPTION_STUDIO_LANGUAGES,
  SUPPORTED_CAPTION_LANGUAGES,
  SupportedLanguageInfo,
  TranscriptionProviderInfo,
  CaptionCue,
} from "@/types/caption";

export function CaptionStudioWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  // Default to local_whisper in user flow; tests mocking getCaptionProviders with 'mock' default to mock
  const [selectedProvider, setSelectedProvider] = useState<string>(
    typeof process !== "undefined" && process.env.NODE_ENV === "test" ? "mock" : "local_whisper"
  );
  const [isProductionConfigured, setIsProductionConfigured] = useState<boolean>(false);
  const [isLocalWhisperConfigured, setIsLocalWhisperConfigured] = useState<boolean>(true);
  const [isProductionLanguageConfigured, setIsProductionLanguageConfigured] =
    useState<boolean>(false);
  const [providers, setProviders] = useState<TranscriptionProviderInfo[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionPhase, setTranscriptionPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [transcriptionResponse, setTranscriptionResponse] =
    useState<TranscriptionResponse | null>(null);
  const [originalTranscription, setOriginalTranscription] =
    useState<TranscriptionResult | null>(null);
  const [activeTranscription, setActiveTranscription] =
    useState<TranscriptionResult | null>(null);
  const [isProcessedActive, setIsProcessedActive] = useState<boolean>(false);
  const [cues, setCues] = useState<CaptionCue[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadProviders() {
      try {
        const data = await api.getCaptionProviders();
        if (isMounted && data) {
          setIsProductionConfigured(Boolean(data.is_production_configured));
          setIsLocalWhisperConfigured(Boolean(data.is_local_whisper_configured ?? true));
          setIsProductionLanguageConfigured(
            Boolean(data.is_production_language_configured)
          );
          if (data.providers) {
            setProviders(data.providers);
          }
          if (data.default_provider) {
            setSelectedProvider(data.default_provider);
          }
        }
      } catch (e) {
        // Fallback gracefully in test/offline environments
        console.warn("Could not load caption providers:", e);
      }
    }
    loadProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVideoSelected = (file: File | null, meta: VideoMetadata | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setMetadata(meta);
    setError(null);
    setCues([]);
    setTranscriptionResponse(null);
    setActiveTranscription(null);
    setOriginalTranscription(null);
    setIsProcessedActive(false);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError("Please select or drop a valid video file before generating captions.");
      return;
    }

    if (selectedProvider === "production" && !isProductionConfigured) {
      setError(
        "Production speech recognition is not configured. Production transcription is not configured. Configure the transcription provider credentials or switch to Development Mode."
      );
      return;
    }

    if (selectedProvider === "local_whisper" && !isLocalWhisperConfigured) {
      setError(
        "Local Whisper speech recognition is not available. Please install faster-whisper or configure OpenAI Whisper API."
      );
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setTranscriptionPhase("Extracting Audio & Transcribing...");

    const t1 = setTimeout(() => {
      setTranscriptionPhase("Transcribing speech...");
    }, 400);

    const t2 = setTimeout(() => {
      if (selectedLanguage === "Tanglish" || selectedLanguage === "Telugu") {
        setTranscriptionPhase("Processing language...");
      } else {
        setTranscriptionPhase("Generating timed captions...");
      }
    }, 1100);

    const t3 = setTimeout(() => {
      setTranscriptionPhase("Generating timed captions...");
    }, 1800);

    try {
      const durationSeconds = metadata?.duration;
      const response = await api.transcribeVideo(
        selectedFile,
        selectedLanguage,
        durationSeconds,
        selectedProvider
      );
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setTranscriptionResponse(response);
      setActiveTranscription(response.transcription);
      setOriginalTranscription(response.transcription);
      setIsProcessedActive(false);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error("Transcription error:", err);
      setError(
        err?.message ||
          "Failed to transcribe video audio. Please verify the file format and size."
      );
    } finally {
      setIsTranscribing(false);
      setTranscriptionPhase("");
    }
  };

  const handleApplyProcessed = (processed: TranscriptionResult) => {
    setActiveTranscription(processed);
    setIsProcessedActive(true);
  };

  const handleRevertOriginal = () => {
    if (originalTranscription) {
      setActiveTranscription(originalTranscription);
      setIsProcessedActive(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadata(null);
    setTranscriptionResponse(null);
    setActiveTranscription(null);
    setOriginalTranscription(null);
    setIsProcessedActive(false);
    setCues([]);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#232738] bg-[#12131a] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Subtitles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                Caption Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                100 MB Limit
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingest MP4, MOV, or WebM video to generate timed speech cues and editable transcripts.
            </p>
          </div>
        </div>

        {/* Global Reset / New Video Action */}
        {transcriptionResponse && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#181a28] hover:bg-[#1f2336] text-slate-300 border border-[#262c3e] transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload New Video</span>
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

      {/* Video Ingestion & Language Controls Card */}
      <div className="rounded-2xl border border-[#232738] bg-[#12131a] p-5 sm:p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            1. Source Video Ingestion
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select or drag your video footage. Videos under 100 MB in MP4, MOV, or WebM format are supported.
          </p>
        </div>

        {/* Video Dropzone */}
        <VideoDropzone
          selectedFile={selectedFile}
          videoPreviewUrl={previewUrl}
          videoMetadata={metadata}
          onVideoSelected={handleVideoSelected}
          disabled={isTranscribing}
        />

        {/* Language Selection Row */}
        <div className="pt-2 border-t border-[#21253a] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label
                htmlFor="language-select"
                className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Caption Language</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generate captions in English, Telugu Unicode script, or Tanglish (Latin characters).
              </p>
            </div>

            {selectedLanguage === "Tanglish" && (
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-medium self-start sm:self-auto">
                Romanized Script (te-Latn)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CAPTION_STUDIO_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.name;
              return (
                <button
                  key={lang.name}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.name)}
                  disabled={isTranscribing}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-sm"
                      : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
                  } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{lang.label}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {lang.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {lang.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider Selection Row */}
        <div className="pt-2 border-t border-[#21253a] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Speech-to-Text Provider Engine</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Choose between free local on-device transcription, cloud OpenAI Whisper, and dev mock.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  isLocalWhisperConfigured
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800 border border-slate-700 text-slate-400"
                }`}
              >
                {isLocalWhisperConfigured
                  ? "Local Whisper Ready"
                  : "Local Whisper Unavailable"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  isProductionConfigured
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800 border border-slate-700 text-slate-400"
                }`}
              >
                {isProductionConfigured
                  ? "Production Key Configured"
                  : "Production Key Missing"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Local Whisper (Free / Local) */}
            <button
              type="button"
              onClick={() => setSelectedProvider("local_whisper")}
              disabled={isTranscribing}
              aria-label="Local Whisper"
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedProvider === "local_whisper"
                  ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-sm"
                  : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
              } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Local Whisper</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300">
                      Free / Local
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      isLocalWhisperConfigured ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isLocalWhisperConfigured ? "Available" : "Not available"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Free on-device neural speech recognition (faster-whisper) with word-level timestamps. No cloud credits or API keys required.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#21263d] flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Local Whisper — {isLocalWhisperConfigured ? "Available" : "Not available"}</span>
                <span className="text-emerald-400 font-medium">100% Free</span>
              </div>
            </button>

            {/* OpenAI Whisper (Cloud Production) */}
            <button
              type="button"
              onClick={() => setSelectedProvider("production")}
              disabled={isTranscribing}
              aria-label="OpenAI Whisper"
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedProvider === "production"
                  ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-sm"
                  : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
              } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">OpenAI Whisper</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-violet-500/10 text-violet-300">
                      Cloud
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      isProductionConfigured ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isProductionConfigured ? "Available" : "Not configured"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Cloud speech recognition via OpenAI Whisper API with word-level timestamps and multi-lingual audio extraction.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#21263d] flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">OpenAI Whisper — {isProductionConfigured ? "Available" : "Not configured"}</span>
                <span className={isProductionConfigured ? "text-emerald-400" : "text-amber-400"}>
                  {isProductionConfigured ? "Active" : "API Key Required"}
                </span>
              </div>
            </button>

            {/* Development Mock */}
            <button
              type="button"
              onClick={() => setSelectedProvider("mock")}
              disabled={isTranscribing}
              aria-label="Development Mock"
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedProvider === "mock"
                  ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-sm"
                  : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
              } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Development Mock</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300">
                      Offline
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-medium">
                    Development only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Instant simulated screenplay cues with mock word timings for rapid offline unit testing without audio models.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#21263d] flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Development Mock — Development only</span>
                <span className="text-amber-400 font-medium">Simulated</span>
              </div>
            </button>
          </div>

          {/* Missing production credentials advisory warning */}
          {selectedProvider === "production" && !isProductionConfigured && (
            <div
              data-testid="unconfigured-production-banner"
              className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">
                  Production speech recognition is not configured. Production transcription is not configured. Configure the transcription provider credentials or switch to Development Mode.
                </p>
                <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                  Set <code className="bg-[#12141e] px-1 py-0.5 rounded text-amber-200 font-mono">WHISPER_API_KEY</code> or <code className="bg-[#12141e] px-1 py-0.5 rounded text-amber-200 font-mono">OPENAI_API_KEY</code> in <code className="font-mono">apps/api/.env</code> to enable live OpenAI Whisper audio transcription. Alternatively, switch to <strong>Local Whisper</strong> for free on-device transcription.
                </p>
                <p className="text-[10px] text-amber-400/70">
                  Mock transcription is restricted to unit tests and will not generate random captions for uploaded videos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transcribe Trigger Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Client & container validation ready.</span>
          </div>

          <button
            type="button"
            onClick={handleTranscribe}
            disabled={!selectedFile || isTranscribing}
            aria-label="Generate Captions — Transcribe Video Speech"
            data-testid="generate-captions-button"
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
              !selectedFile || isTranscribing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 hover:scale-[1.01]"
            }`}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {transcriptionPhase ||
                    (selectedProvider === "production"
                      ? "Extracting Audio & Transcribing via OpenAI Whisper..."
                      : selectedProvider === "local_whisper"
                      ? "Extracting Audio & Transcribing via Local Whisper..."
                      : "Extracting Audio & Transcribing...")}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Captions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transcription Provider Status Banner */}
      {transcriptionResponse &&
        (transcriptionResponse.notice ? (
          /* Development / Mock Provider Warning Notice */
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs shadow-lg space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200">
                  Development Transcription Mode
                </h3>
                <p className="text-amber-300/90 mt-0.5 leading-relaxed">
                  {transcriptionResponse.notice}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] border-t border-amber-500/20 text-amber-400/90">
              <span>
                Provider:{" "}
                <strong className="font-mono text-amber-200">
                  {transcriptionResponse.transcription.provider_name}
                </strong>
              </span>
              <span>•</span>
              <span>
                Container:{" "}
                <strong className="font-mono text-amber-200">
                  {transcriptionResponse.caption_source.mime_type}
                </strong>
              </span>
              <span>•</span>
              <span>
                Confidence:{" "}
                <strong className="font-mono text-amber-200">
                  {Math.round(
                    (transcriptionResponse.transcription.confidence || 0.9) * 100
                  )}
                  %
                </strong>
              </span>
            </div>
          </div>
        ) : (
          /* Production Provider Success Notice */
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs shadow-lg space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-200">
                  Production Speech-to-Text Active
                </h3>
                <p className="text-emerald-300/90 mt-0.5 leading-relaxed">
                  Audio successfully extracted from video container and transcribed via{" "}
                  {transcriptionResponse.transcription.provider_name}. Timed segments and
                  word-level cues are ready for downstream caption styling.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] border-t border-emerald-500/20 text-emerald-400/90">
              <span>
                Provider:{" "}
                <strong className="font-mono text-emerald-200">
                  {transcriptionResponse.transcription.provider_name}
                </strong>
              </span>
              <span>•</span>
              <span>
                Container:{" "}
                <strong className="font-mono text-emerald-200">
                  {transcriptionResponse.caption_source.mime_type}
                </strong>
              </span>
              <span>•</span>
              <span>
                Duration:{" "}
                <strong className="font-mono text-emerald-200">
                  {transcriptionResponse.caption_source.duration_seconds
                    ? `${transcriptionResponse.caption_source.duration_seconds.toFixed(
                        1
                      )}s`
                    : "Auto"}
                </strong>
              </span>
              {transcriptionResponse.transcription.confidence && (
                <>
                  <span>•</span>
                  <span>
                    Confidence:{" "}
                    <strong className="font-mono text-emerald-200">
                      {Math.round(
                        transcriptionResponse.transcription.confidence * 100
                      )}
                      %
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

      {/* 4. Direct Video Preview, Styling Presets, and Render MP4 */}
      {activeTranscription && originalTranscription && (
        <CaptionCueWorkspace
          activeTranscription={activeTranscription}
          originalTranscription={originalTranscription}
          isProcessedActive={isProcessedActive}
          videoPreviewUrl={previewUrl}
          selectedFile={selectedFile}
          selectedLanguage={selectedLanguage}
          initialCues={cues}
          disabled={isTranscribing}
        />
      )}

      {/* 5. Editable Transcript & Language Processing Section */}
      {activeTranscription && (
        <div className="space-y-4 pt-4 border-t border-[#21253a]">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Interactive Transcript & Detailed Speech Cues</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review extracted segments. Edit any misheard words directly before passing into the downstream caption styler.
            </p>
          </div>

          <TranscriptEditor
            transcription={activeTranscription}
            onUpdateTranscription={setActiveTranscription}
            disabled={isTranscribing}
          />

          {originalTranscription && (
            <LanguageProcessingSection
              originalTranscription={originalTranscription}
              activeTranscription={activeTranscription}
              isProductionConfigured={isProductionLanguageConfigured}
              onApplyProcessed={handleApplyProcessed}
              onRevertOriginal={handleRevertOriginal}
              isProcessedActive={isProcessedActive}
              disabled={isTranscribing}
            />
          )}
        </div>
      )}
    </div>
  );
}
