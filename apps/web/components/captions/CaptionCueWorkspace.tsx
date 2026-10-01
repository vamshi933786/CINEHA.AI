"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Clock,
  Settings2,
  Sparkles,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  MoveVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Maximize2,
  Layers,
  ChevronDown,
  ChevronUp,
  Volume2,
  Download,
  Film,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  TranscriptionResult,
  CaptionCue,
  CaptionCueSettings,
  CaptionCueGenerationRequest,
  CaptionAppearanceSettings,
  CaptionMode,
  MotionCaptionSettings,
  CaptionRenderOptions,
  CaptionRenderResult,
} from "@/types/caption";
import { DEFAULT_MOTION_SETTINGS } from "./motionPresets";
import { MotionCaptionOverlay } from "./MotionCaptionOverlay";
import { MotionCaptionControls } from "./MotionCaptionControls";

interface CaptionCueWorkspaceProps {
  activeTranscription?: TranscriptionResult;
  originalTranscription?: TranscriptionResult;
  isProcessedActive?: boolean;
  videoPreviewUrl: string | null;
  selectedFile?: File | null;
  selectedLanguage?: string;
  initialCues?: CaptionCue[];
  disabled?: boolean;
}

export const DEFAULT_CUE_SETTINGS: CaptionCueSettings = {
  max_characters_per_line: 36,
  max_lines: 2,
  minimum_cue_duration: 0.8,
  maximum_cue_duration: 4.0,
  preferred_words_per_cue: 6,
  gap_threshold: 0.5,
};

export const DEFAULT_APPEARANCE_SETTINGS: CaptionAppearanceSettings = {
  alignment: "center",
  vertical_position: "bottom",
  font_size: "medium",
  background: "box",
  show_safe_area: false,
};

export function formatSeconds(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${tenths}`;
}

export function CaptionCueWorkspace({
  activeTranscription,
  originalTranscription,
  isProcessedActive,
  videoPreviewUrl,
  selectedFile,
  selectedLanguage,
  initialCues,
  disabled = false,
}: CaptionCueWorkspaceProps) {
  const [cues, setCues] = useState<CaptionCue[]>(initialCues || []);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [timingGranularity, setTimingGranularity] = useState<"word" | "segment">("segment");
  const [cueSettings, setCueSettings] = useState<CaptionCueSettings>(DEFAULT_CUE_SETTINGS);
  const [appearance, setAppearance] = useState<CaptionAppearanceSettings>(
    DEFAULT_APPEARANCE_SETTINGS
  );
  const [captionMode, setCaptionMode] = useState<CaptionMode>("plain");
  const [motionSettings, setMotionSettings] =
    useState<MotionCaptionSettings>(DEFAULT_MOTION_SETTINGS);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState<boolean>(false);

  // Video Render & Export state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderResult, setRenderResult] = useState<CaptionRenderResult | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Sync initialCues if provided from parent
  useEffect(() => {
    if (initialCues && initialCues.length > 0) {
      setCues(initialCues);
    }
  }, [initialCues]);

  // Video playback & synchronization state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);

  // Timing edit validation state per cue
  const [timingErrors, setTimingErrors] = useState<Record<string, string>>({});

  // Active transcript nature label
  const captionSourceType = useMemo<"original" | "translated" | "transliterated">(() => {
    if (!isProcessedActive) return "original";
    if (activeTranscription?.is_transliteration) return "transliterated";
    return "translated";
  }, [isProcessedActive, activeTranscription?.is_transliteration]);

  const sourceBadgeLabel = useMemo(() => {
    if (captionSourceType === "transliterated") {
      return `Transliterated (${activeTranscription?.language || "Language"} - ${activeTranscription?.script_type || "Script"})`;
    }
    if (captionSourceType === "translated") {
      return `Translated (${activeTranscription?.language || "Language"})`;
    }
    return `Original (${originalTranscription?.language || "Original"})`;
  }, [captionSourceType, activeTranscription, originalTranscription]);

  // Check if any cue has been manually edited
  const hasManualEdits = useMemo(() => {
    return cues.some((c) => c.manually_edited);
  }, [cues]);

  // Find currently active cue based on video currentTime
  const activeCue = useMemo(() => {
    if (!cues.length) return null;
    return cues.find(
      (cue) => currentTime >= cue.start_time && currentTime < cue.end_time
    ) || null;
  }, [cues, currentTime]);

  // Auto-scroll or track active cue in cue list if playing
  useEffect(() => {
    if (activeCue) {
      setSelectedCueId(activeCue.id);
    }
  }, [activeCue]);

  // Generate cues from active transcript
  const handleGenerateCues = useCallback(
    async (force = false) => {
      if (hasManualEdits && !force) {
        setShowConfirmRegenerate(true);
        return;
      }
      setShowConfirmRegenerate(false);
      if (!activeTranscription) return;
      setIsGenerating(true);
      setGenerationError(null);
      setNotice(null);

      try {
        const payload: CaptionCueGenerationRequest = {
          segments: activeTranscription.segments,
          language: activeTranscription.language,
          language_code: activeTranscription.language_code || "en",
          is_transliteration: activeTranscription.is_transliteration,
          script_type: activeTranscription.script_type,
          caption_source_type: captionSourceType,
          settings: cueSettings,
        };

        const response = await api.generateCaptionCues(payload);
        setCues(response.result.cues);
        setTimingGranularity(response.result.timing_granularity);
        if (response.notice) {
          setNotice(response.notice);
        }
      } catch (err: any) {
        console.error("Cue generation failed:", err);
        setGenerationError(err?.message || "Failed to generate caption cues.");
      } finally {
        setIsGenerating(false);
      }
    },
    [activeTranscription, captionSourceType, cueSettings, hasManualEdits]
  );

  // Video time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlayPauseToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek video to specific cue start_time
  const handleSeekToCue = (cue: CaptionCue) => {
    setSelectedCueId(cue.id);
    if (videoRef.current) {
      videoRef.current.currentTime = cue.start_time;
      setCurrentTime(cue.start_time);
    }
  };

  // Cue text edit handler (does NOT change timing)
  const handleCueTextChange = (cueId: string, newText: string) => {
    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== cueId) return cue;
        // Re-split lines simply
        const words = newText.trim().split(/\s+/);
        let lines = [newText.trim()];
        if (words.length > 4 && cueSettings.max_lines === 2) {
          const mid = Math.ceil(words.length / 2);
          lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
        }
        return {
          ...cue,
          text: newText,
          lines: lines.filter(Boolean),
          manually_edited: true,
        };
      })
    );
  };

  // Cue numeric timing edit handler
  const handleCueTimingChange = (
    cueId: string,
    field: "start_time" | "end_time",
    valueStr: string
  ) => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) return;

    setCues((prev) =>
      prev.map((cue) => {
        if (cue.id !== cueId) return cue;
        const newStart = field === "start_time" ? val : cue.start_time;
        const newEnd = field === "end_time" ? val : cue.end_time;

        // Validation
        if (newStart < 0) {
          setTimingErrors((e) => ({ ...e, [cueId]: "Start time cannot be negative." }));
          return cue;
        }
        if (newEnd <= newStart) {
          setTimingErrors((e) => ({
            ...e,
            [cueId]: "End time must be strictly greater than start time.",
          }));
          return cue;
        }

        // Clear error
        setTimingErrors((e) => {
          const copy = { ...e };
          delete copy[cueId];
          return copy;
        });

        const newDuration = Math.round((newEnd - newStart) * 1000) / 1000;
        return {
          ...cue,
          start_time: newStart,
          end_time: newEnd,
          duration: newDuration,
          manually_edited: true,
        };
      })
    );
  };

  // Appearance styling classes for plain captions
  const getAlignmentClass = () => {
    switch (appearance.alignment) {
      case "left":
        return "text-left items-start";
      case "right":
        return "text-right items-end";
      default:
        return "text-center items-center";
    }
  };

  const getVerticalClass = () => {
    switch (appearance.vertical_position) {
      case "top":
        return "top-10";
      case "center":
        return "top-1/2 -translate-y-1/2";
      default:
        return "bottom-12";
    }
  };

  const getFontSizeClass = () => {
    switch (appearance.font_size) {
      case "small":
        return "text-xs sm:text-sm";
      case "large":
        return "text-lg sm:text-2xl";
      default:
        return "text-sm sm:text-lg";
    }
  };

  const handleRenderCaptionedVideo = async () => {
    if (!selectedFile) {
      setRenderError("Please select or drop a valid video file before rendering captions.");
      return;
    }
    if (!cues || cues.length === 0) {
      setRenderError("No caption cues available. Generate captions before rendering.");
      return;
    }
    if (isRendering) return;

    setIsRendering(true);
    setRenderError(null);
    setRenderResult(null);

    try {
      const renderOptions: Partial<CaptionRenderOptions> = {
        preset: motionSettings.preset,
        font_size: appearance.font_size,
        alignment: appearance.alignment,
        vertical_position: appearance.vertical_position,
        background: appearance.background,
        primary_color: motionSettings.primary_color,
        active_color: motionSettings.active_color,
        active_bg_color: motionSettings.active_bg_color,
        font_weight: motionSettings.font_weight,
      };

      const targetLang = selectedLanguage || activeTranscription?.language || "English";
      const res = await api.renderCaptionedVideo(
        selectedFile,
        cues,
        targetLang,
        motionSettings.preset,
        renderOptions
      );
      setRenderResult(res.result);
    } catch (err: any) {
      console.error("Video rendering failed:", err);
      setRenderError(err?.message || "Failed to render video with burned-in captions.");
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadCaptionedVideo = () => {
    if (!renderResult) return;
    const downloadUrl = api.getRenderDownloadUrl(renderResult.render_id);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = renderResult.output_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-2xl border border-[#232738] bg-[#12131a] p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header & Source Identifier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21253a]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>5. Caption Cue Generation & Plain Video Preview</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {captionMode === "motion" ? "Motion Captions" : "Plain Captions"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Convert active speech transcripts into synchronized timed cues and preview them directly over the video frame.
          </p>
        </div>

        {/* Caption Mode & Source Badge & Generate Action */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Mode Selector */}
          <div
            className="flex items-center rounded-xl bg-[#161826] p-1 border border-[#252a3e]"
            role="group"
            aria-label="Caption presentation mode"
          >
            <span className="text-[11px] text-slate-400 px-2 font-medium">Caption Mode:</span>
            <button
              type="button"
              onClick={() => setCaptionMode("plain")}
              aria-pressed={captionMode === "plain"}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                captionMode === "plain"
                  ? "bg-cyan-500 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Plain
            </button>
            <button
              type="button"
              onClick={() => setCaptionMode("motion")}
              aria-pressed={captionMode === "motion"}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                captionMode === "motion"
                  ? "bg-cyan-500 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Motion
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161826] border border-[#252a3e] text-xs">
            <span className="text-slate-400 text-[11px]">Caption Source:</span>
            <span className="font-semibold text-cyan-300">{sourceBadgeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateCues(false)}
            disabled={isGenerating || disabled}
            aria-label="Generate synchronized captions"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{cues.length > 0 ? "Regenerate Captions" : "Generate Captions"}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal / Banner if regenerating with manual edits */}
      {showConfirmRegenerate && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-100">
                Regenerating will replace manual caption edits
              </p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                You have manually edited one or more caption cues. Regenerating from the transcript will overwrite your changes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowConfirmRegenerate(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleGenerateCues(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow"
            >
              Overwrite & Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Generation Error */}
      {generationError && (
        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{generationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="text-xs underline text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Advisory Notice */}
      {notice && (
        <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Cue Settings Drawer Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowSettingsDrawer((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Caption Cue Timing & Layout Constraints</span>
          {showSettingsDrawer ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {cues.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Granularity:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-medium ${
                timingGranularity === "word"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              {timingGranularity === "word" ? "Word Timings" : "Segment Timings"}
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Settings Form */}
      {showSettingsDrawer && (
        <div className="p-4 rounded-xl border border-[#252a3f] bg-[#151724] space-y-4 text-xs">
          <p className="text-[11px] text-slate-400">
            Adjust deterministic layout rules. These defaults are optimized for vertical short-form readability.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="max-chars"
                className="block text-[11px] font-semibold text-slate-300 mb-1"
              >
                Max Characters / Line: {cueSettings.max_characters_per_line}
              </label>
              <input
                id="max-chars"
                type="range"
                min={20}
                max={50}
                step={2}
                value={cueSettings.max_characters_per_line}
                onChange={(e) =>
                  setCueSettings((s) => ({
                    ...s,
                    max_characters_per_line: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label
                htmlFor="max-lines"
                className="block text-[11px] font-semibold text-slate-300 mb-1"
              >
                Max Lines: {cueSettings.max_lines}
              </label>
              <select
                id="max-lines"
                value={cueSettings.max_lines}
                onChange={(e) =>
                  setCueSettings((s) => ({
                    ...s,
                    max_lines: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full bg-[#1c1f30] border border-[#2a3048] rounded-lg px-2.5 py-1 text-slate-200"
              >
                <option value={1}>1 Line</option>
                <option value={2}>2 Lines (Recommended)</option>
                <option value={3}>3 Lines</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="words-cue"
                className="block text-[11px] font-semibold text-slate-300 mb-1"
              >
                Target Words / Cue: {cueSettings.preferred_words_per_cue}
              </label>
              <input
                id="words-cue"
                type="range"
                min={3}
                max={12}
                step={1}
                value={cueSettings.preferred_words_per_cue}
                onChange={(e) =>
                  setCueSettings((s) => ({
                    ...s,
                    preferred_words_per_cue: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout (Desktop Side-by-Side / Mobile Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Video Preview with Plain Captions (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Synchronized Video Preview</span>
            </h3>

            {/* Safe Area Guide Toggle */}
            <button
              type="button"
              onClick={() =>
                setAppearance((a) => ({ ...a, show_safe_area: !a.show_safe_area }))
              }
              aria-label="Toggle 9:16 safe area guide"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
                appearance.show_safe_area
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-[#181a28] border-[#292e44] text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{appearance.show_safe_area ? "Safe Area On" : "Safe Area Off"}</span>
            </button>
          </div>

          {/* Video Player Container */}
          <div
            className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-[#262b3e] shadow-2xl flex items-center justify-center group"
            data-testid="caption-video-container"
          >
            {videoPreviewUrl ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onSeeked={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover"
                data-testid="caption-video-element"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 space-y-2">
                <Play className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs">No video asset loaded</p>
              </div>
            )}

            {/* 9:16 Vertical Safe Area Visual Guide Overlay */}
            {appearance.show_safe_area && (
              <div
                className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/40 m-6 rounded-xl flex flex-col justify-between p-3"
                data-testid="safe-area-guide"
              >
                <div className="text-[9px] font-mono uppercase bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded self-start border border-cyan-500/30">
                  Top Margin (Header Safe)
                </div>
                <div className="text-center text-[9px] font-mono text-cyan-400/70">
                  9:16 Vertical Safe Area
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
                  <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Bottom Margin (Controls Safe)
                  </span>
                  <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Right Rail
                  </span>
                </div>
              </div>
            )}

            {/* Synchronized Caption Overlay: Plain vs Motion */}
            {activeCue &&
              (captionMode === "motion" ? (
                <MotionCaptionOverlay
                  cue={activeCue}
                  currentTime={currentTime}
                  motionSettings={motionSettings}
                  appearance={appearance}
                />
              ) : (
                <div
                  className={`absolute inset-x-4 pointer-events-none flex flex-col ${getVerticalClass()} ${getAlignmentClass()}`}
                  data-testid="active-caption-overlay"
                >
                  <div
                    className={`inline-block font-sans font-semibold tracking-wide transition-all ${
                      appearance.background === "box"
                        ? "bg-black/85 text-white px-3.5 py-2 rounded-xl shadow-lg border border-white/10"
                        : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                    } ${getFontSizeClass()}`}
                  >
                    {activeCue.lines && activeCue.lines.length > 0 ? (
                      activeCue.lines.map((line, idx) => (
                        <div key={idx} className="leading-snug">
                          {line}
                        </div>
                      ))
                    ) : (
                      <div>{activeCue.text}</div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Video Playback Time Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#141622] border border-[#212538] text-xs font-mono">
            <span className="text-slate-400">Current Position:</span>
            <span className="text-cyan-300 font-bold">{formatSeconds(currentTime)}</span>
          </div>

          {/* Plain Caption Basic Appearance Controls */}
          <div className="p-3.5 rounded-xl border border-[#232738] bg-[#141622] space-y-3">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Plain Caption Appearance
            </h4>

            {/* Alignment & Position */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Text Alignment
                </label>
                <div className="flex items-center rounded-lg bg-[#1b1e2e] p-0.5 border border-[#292f46]">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() =>
                        setAppearance((a) => ({ ...a, alignment: align }))
                      }
                      className={`flex-1 py-1 rounded text-center text-xs capitalize transition ${
                        appearance.alignment === align
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Vertical Position
                </label>
                <div className="flex items-center rounded-lg bg-[#1b1e2e] p-0.5 border border-[#292f46]">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() =>
                        setAppearance((a) => ({ ...a, vertical_position: pos }))
                      }
                      className={`flex-1 py-1 rounded text-center text-xs capitalize transition ${
                        appearance.vertical_position === pos
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Font Size & Background */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Font Size
                </label>
                <div className="flex items-center rounded-lg bg-[#1b1e2e] p-0.5 border border-[#292f46]">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setAppearance((a) => ({ ...a, font_size: size }))
                      }
                      className={`flex-1 py-1 rounded text-center text-xs capitalize transition ${
                        appearance.font_size === size
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Background
                </label>
                <div className="flex items-center rounded-lg bg-[#1b1e2e] p-0.5 border border-[#292f46]">
                  {(["none", "box"] as const).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() =>
                        setAppearance((a) => ({ ...a, background: bg }))
                      }
                      className={`flex-1 py-1 rounded text-center text-xs capitalize transition ${
                        appearance.background === bg
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {bg === "none" ? "None" : "Box"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Motion Caption Engine Controls (rendered in motion mode) */}
          {captionMode === "motion" && (
            <MotionCaptionControls
              settings={motionSettings}
              onChangeSettings={setMotionSettings}
              hasWordTimings={timingGranularity === "word"}
              disabled={disabled}
            />
          )}
        </div>

        {/* Right Column: Caption Cue Editor List (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Caption Cues Editor</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {cues.length} {cues.length === 1 ? "Cue" : "Cues"}
              </span>
            </div>

            {hasManualEdits && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Manual Edits Active
              </span>
            )}
          </div>

          {/* Cue List */}
          {cues.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[#2b3047] text-center space-y-3 bg-[#131520]/50">
              <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto" />
              <p className="text-xs text-slate-400">
                No caption cues generated yet. Click{" "}
                <strong className="text-cyan-300">Generate Captions</strong> above to convert the active transcript into timed cues.
              </p>
            </div>
          ) : (
            <div
              className="space-y-3 max-h-[560px] overflow-y-auto pr-1"
              data-testid="caption-cue-list"
            >
              {cues.map((cue, idx) => {
                const isActive = activeCue?.id === cue.id;
                const isSelected = selectedCueId === cue.id;
                const timingError = timingErrors[cue.id];

                return (
                  <div
                    key={cue.id}
                    onClick={() => handleSeekToCue(cue)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? "border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-950/40"
                        : isSelected
                        ? "border-slate-500 bg-[#161828]"
                        : "border-[#232738] bg-[#141622] hover:border-slate-600 hover:bg-[#181a2b]"
                    }`}
                  >
                    {/* Cue Header Bar */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-[#21253a]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e2234] text-cyan-300">
                          #{idx + 1}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500 text-black">
                            PLAYING
                          </span>
                        )}
                        {cue.manually_edited && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Numeric Timing Inputs */}
                      <div
                        className="flex items-center gap-1.5 font-mono text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={cue.start_time}
                          onChange={(e) =>
                            handleCueTimingChange(cue.id, "start_time", e.target.value)
                          }
                          aria-label={`Start time for cue ${idx + 1}`}
                          className="w-14 bg-[#1b1e2f] border border-[#2b3149] rounded px-1.5 py-0.5 text-center text-slate-200"
                        />
                        <span className="text-slate-500">→</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={cue.end_time}
                          onChange={(e) =>
                            handleCueTimingChange(cue.id, "end_time", e.target.value)
                          }
                          aria-label={`End time for cue ${idx + 1}`}
                          className="w-14 bg-[#1b1e2f] border border-[#2b3149] rounded px-1.5 py-0.5 text-center text-slate-200"
                        />
                        <span className="text-slate-400 text-[10px] pl-1">
                          ({((cue.duration ?? (cue.end_time - cue.start_time))).toFixed(1)}s)
                        </span>
                      </div>
                    </div>

                    {/* Timing Error Banner */}
                    {timingError && (
                      <p className="text-[10px] text-rose-400 pt-1.5 font-medium">
                        {timingError}
                      </p>
                    )}

                    {/* Editable Caption Textarea */}
                    <div className="pt-2.5" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={cue.text}
                        onChange={(e) => handleCueTextChange(cue.id, e.target.value)}
                        rows={2}
                        aria-label={`Caption text for cue ${idx + 1}`}
                        className="w-full bg-[#1b1e30] border border-[#282d44] focus:border-cyan-400 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 resize-none font-sans leading-relaxed"
                      />
                    </div>

                    {/* Visual Line Breaks Preview */}
                    {cue.lines && cue.lines.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">Lines:</span>
                        {cue.lines.map((line, lIdx) => (
                          <span
                            key={lIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-[#1a1d2e] border border-[#2a2f47] text-slate-300 truncate max-w-[200px]"
                          >
                            L{lIdx + 1}: {line}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Render Captioned Video Section */}
      <div className="p-5 rounded-2xl border border-[#232738] bg-[#141622] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#212538]">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Export Captioned MP4 Video</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently burn synchronized captions into the video using FFmpeg with Unicode font rendering.
            </p>
          </div>

          {renderResult && (
            <span
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              data-testid="captioned-video-ready-badge"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Captioned video ready</span>
            </span>
          )}
        </div>

        {/* Render Error Banner */}
        {renderError && (
          <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between shadow">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{renderError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRenderError(null)}
              className="text-xs underline text-rose-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Render Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="text-xs text-slate-400">
            <span>Language: </span>
            <strong className="text-slate-200">{selectedLanguage || activeTranscription?.language || "English"}</strong>
            <span className="mx-2">•</span>
            <span>Preset: </span>
            <strong className="text-cyan-300 capitalize">{motionSettings.preset.replace('_', ' ')}</strong>
            <span className="mx-2">•</span>
            <span>Cues: </span>
            <strong className="text-slate-200">{cues.length}</strong>
          </div>

          <button
            type="button"
            onClick={handleRenderCaptionedVideo}
            disabled={isRendering || !selectedFile || cues.length === 0 || disabled}
            data-testid="render-captioned-video-btn"
            className={`px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-lg ${
              isRendering || !selectedFile || cues.length === 0 || disabled
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 hover:scale-[1.01]"
            }`}
          >
            {isRendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Rendering Captioned Video via FFmpeg...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Render Captioned Video</span>
              </>
            )}
          </button>
        </div>

        {/* Completed Render State & Download Button */}
        {renderResult && (
          <div
            className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/25 text-emerald-200 text-xs shadow-lg space-y-3"
            data-testid="render-ready-banner"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-100 text-sm">
                    Captioned video ready
                  </h4>
                  <p className="text-emerald-300/80 text-[11px] mt-0.5">
                    Captions have been permanently burned into your MP4 video with real Unicode font rendering.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadCaptionedVideo}
                data-testid="download-captioned-video-btn"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download Captioned Video</span>
              </button>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-3 text-[11px] text-emerald-400/90 font-mono">
              <span>File: <strong className="text-emerald-200">{renderResult.output_filename}</strong></span>
              <span>•</span>
              <span>Size: <strong className="text-emerald-200">{Math.round(renderResult.file_size / 1024)} KB</strong></span>
              <span>•</span>
              <span>Duration: <strong className="text-emerald-200">{renderResult.duration.toFixed(1)}s</strong></span>
              <span>•</span>
              <span>Preset: <strong className="text-emerald-200">{renderResult.preset_used}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
