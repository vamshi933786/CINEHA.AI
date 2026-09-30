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
} from "lucide-react";
import { VideoDropzone, VideoMetadata } from "./VideoDropzone";
import { TranscriptEditor } from "./TranscriptEditor";
import { api } from "@/lib/api";
import {
  TranscriptionResponse,
  TranscriptionResult,
  SUPPORTED_CAPTION_LANGUAGES,
  SupportedLanguageInfo,
} from "@/types/caption";

export function CaptionStudioWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionResponse, setTranscriptionResponse] =
    useState<TranscriptionResponse | null>(null);
  const [activeTranscription, setActiveTranscription] =
    useState<TranscriptionResult | null>(null);

  const handleVideoSelected = (file: File | null, meta: VideoMetadata | null) => {
    setSelectedFile(file);
    setMetadata(meta);
    setError(null);
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setTranscriptionResponse(null);
      setActiveTranscription(null);
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError("Please select or drop a valid video file before transcribing.");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const durationSeconds = metadata?.duration;
      const response = await api.transcribeVideo(
        selectedFile,
        selectedLanguage,
        durationSeconds
      );
      setTranscriptionResponse(response);
      setActiveTranscription(response.transcription);
    } catch (err: any) {
      console.error("Transcription error:", err);
      setError(
        err?.message ||
          "Failed to transcribe video audio. Please verify the file format and size."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadata(null);
    setTranscriptionResponse(null);
    setActiveTranscription(null);
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
                <span>2. Target Spoken Language</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select the primary language spoken in the video audio track.
              </p>
            </div>

            {selectedLanguage === "Tanglish" && (
              <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-medium self-start sm:self-auto">
                Romanized Script (te-Latn)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SUPPORTED_CAPTION_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.name;
              return (
                <button
                  key={lang.name}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.name)}
                  disabled={isTranscribing}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-200 shadow-sm"
                      : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
                  } ${isTranscribing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{lang.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {lang.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block truncate">
                    {lang.script} {lang.is_transliteration ? "(Translit.)" : "Script"}
                  </span>
                </button>
              );
            })}
          </div>
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
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
              !selectedFile || isTranscribing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 hover:scale-[1.01]"
            }`}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Audio & Transcribing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Transcribe Video Speech</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Development / Mock Provider Warning Notice */}
      {transcriptionResponse && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs shadow-lg space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-200">
                Development Transcription Mode
              </h3>
              <p className="text-amber-300/90 mt-0.5 leading-relaxed">
                Production speech-to-text provider is not configured. Audio transcription is simulated based on cinematic screenplay heuristics for {transcriptionResponse.transcription.language}. Micro word-level timestamps and timing bounds are generated for timeline testing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] border-t border-amber-500/20 text-amber-400/90">
            <span>
              Provider: <strong className="font-mono text-amber-200">{transcriptionResponse.transcription.provider_name}</strong>
            </span>
            <span>•</span>
            <span>
              Container: <strong className="font-mono text-amber-200">{transcriptionResponse.caption_source.mime_type}</strong>
            </span>
            <span>•</span>
            <span>
              Confidence: <strong className="font-mono text-amber-200">{Math.round((transcriptionResponse.transcription.confidence || 0.9) * 100)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Editable Transcript Section */}
      {activeTranscription && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>3. Timed Speech Cues & Transcript</span>
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
        </div>
      )}
    </div>
  );
}
