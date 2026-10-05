"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Move } from "lucide-react";
import {
  CaptionCue,
  MotionCaptionSettings,
  CaptionAppearanceSettings,
} from "@/types/caption";

interface MotionCaptionOverlayProps {
  cue: CaptionCue;
  currentTime: number;
  motionSettings: MotionCaptionSettings;
  appearance: CaptionAppearanceSettings;
  forceReducedMotion?: boolean;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
}

export function MotionCaptionOverlay({
  cue,
  currentTime,
  motionSettings,
  appearance,
  forceReducedMotion = false,
  isDragging = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: MotionCaptionOverlayProps) {
  // Detect system reduced motion preference
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    try {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (!mediaQuery) return;
      setSystemReducedMotion(Boolean(mediaQuery.matches));

      const handler = (e: MediaQueryListEvent) => setSystemReducedMotion(Boolean(e.matches));
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      } else if (typeof (mediaQuery as any).addListener === "function") {
        (mediaQuery as any).addListener(handler);
        return () => (mediaQuery as any).removeListener(handler);
      }
    } catch (_) {}
  }, []);

  const isReducedMotion = useMemo(() => {
    if (forceReducedMotion) return true;
    return motionSettings.respect_reduced_motion && systemReducedMotion;
  }, [forceReducedMotion, motionSettings.respect_reduced_motion, systemReducedMotion]);

  // Timing progress within cue
  const cueProgress = Math.max(0, currentTime - cue.start_time);
  const cueRemaining = Math.max(0, cue.end_time - currentTime);

  // Entrance and exit window detection (0.2s duration)
  const isEntering = cueProgress < 0.2;
  const isExiting = cueRemaining < 0.2;

  // Genuine word timing check
  const hasWordTimings = useMemo(() => {
    return Boolean(
      cue.words &&
        cue.words.length > 0 &&
        cue.words.some((w) => w.end_time > w.start_time)
    );
  }, [cue.words]);

  // Identify currently active word index
  const activeWordIndex = useMemo(() => {
    if (!hasWordTimings || !cue.words) return -1;
    return cue.words.findIndex(
      (w) => currentTime >= w.start_time && currentTime < w.end_time
    );
  }, [hasWordTimings, cue.words, currentTime]);

  // Entrance animation classes
  const getEntranceClass = () => {
    if (!isEntering) return "";
    if (isReducedMotion) return "opacity-90";

    switch (motionSettings.entrance_animation) {
      case "pop":
        return "scale-105 opacity-90 transition-transform duration-150";
      case "fade":
        return "opacity-80 transition-opacity duration-150";
      case "slide_up":
        return "translate-y-1.5 opacity-90 transition-transform duration-150";
      default:
        return "";
    }
  };

  // Exit animation classes
  const getExitClass = () => {
    if (!isExiting) return "";
    if (isReducedMotion) return "opacity-80";

    switch (motionSettings.exit_animation) {
      case "fade":
        return "opacity-75 transition-opacity duration-150";
      case "slide_down":
        return "translate-y-1.5 opacity-75 transition-all duration-150";
      default:
        return "";
    }
  };

  // Spatial alignment class
  const getAlignmentClass = () => {
    switch (appearance.alignment) {
      case "left":
        return "text-left items-start justify-start";
      case "right":
        return "text-right items-end justify-end";
      default:
        return "text-center items-center justify-center";
    }
  };

  // Font size class
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

  // Font weight class
  const getFontWeightClass = () => {
    switch (motionSettings.font_weight) {
      case "normal":
        return "font-normal";
      case "black":
        return "font-black tracking-normal";
      default:
        return "font-bold";
    }
  };

  // Active word scale class based on intensity
  const getActiveWordScaleClass = () => {
    if (isReducedMotion) return "scale-100";
    if (
      motionSettings.active_word_style !== "scale" &&
      motionSettings.word_animation !== "pop" &&
      motionSettings.word_animation !== "emphasis"
    ) {
      return "scale-100";
    }

    switch (motionSettings.intensity) {
      case "low":
        return "scale-105";
      case "high":
        return "scale-115";
      default:
        return "scale-110";
    }
  };

  // Normalized free coordinates (0..1)
  const posX = appearance.position_x !== undefined ? appearance.position_x : 0.5;
  const posY =
    appearance.position_y !== undefined
      ? appearance.position_y
      : appearance.vertical_position === "top"
      ? 0.15
      : appearance.vertical_position === "center"
      ? 0.50
      : 0.85;

  return (
    <div
      className={`absolute pointer-events-auto touch-none select-none z-20 flex flex-col ${getAlignmentClass()} ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `${posX * 100}%`,
        top: `${posY * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      data-testid="motion-caption-overlay"
      data-preset={motionSettings.preset}
      data-reduced-motion={isReducedMotion ? "true" : "false"}
      data-position-x={posX}
      data-position-y={posY}
    >
      {/* Visual Position Badge when dragged or hovered */}
      {isDragging && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500 text-black font-bold shadow-xl border border-cyan-300 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
          <Move className="w-2.5 h-2.5" />
          <span>
            X: {Math.round(posX * 100)}% | Y: {Math.round(posY * 100)}%
          </span>
        </div>
      )}

      <div
        className={`inline-block font-sans ${getFontWeightClass()} transition-all transform duration-150 ${getEntranceClass()} ${getExitClass()} ${
          appearance.background === "box"
            ? motionSettings.preset === "neon_pulse"
              ? "bg-black/90 px-4 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)] border border-cyan-400/50 backdrop-blur-md"
              : motionSettings.preset === "hormozi"
              ? "bg-black/95 px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/35 backdrop-blur-md"
              : motionSettings.preset === "editorial"
              ? "bg-black/80 px-4 py-2 rounded-xl shadow-lg border border-slate-600/40 backdrop-blur-sm"
              : "bg-black/85 px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm"
            : appearance.background === "outline"
            ? "drop-shadow-[0_0_8px_rgba(0,0,0,1)] text-stroke"
            : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
        } ${getFontSizeClass()} ${
          isDragging ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/60" : ""
        }`}
        style={{ color: motionSettings.primary_color }}
      >
        {/* If word timings exist, render word-by-word with active styling */}
        {hasWordTimings && cue.words ? (
          <div
            className={`flex flex-wrap gap-x-1.5 gap-y-1 ${
              appearance.alignment === "left"
                ? "justify-start"
                : appearance.alignment === "right"
                ? "justify-end"
                : "justify-center"
            }`}
            data-testid="motion-words-container"
          >
            {cue.words.map((word, wIdx) => {
              const isActive = wIdx === activeWordIndex;
              const isSpoken = currentTime >= word.end_time;
              const isUpcoming = currentTime < word.start_time;

              // Karaoke-specific opacity & coloring
              const isKaraoke = motionSettings.preset === "karaoke";

              let wordColor = motionSettings.primary_color;
              let wordOpacity = "opacity-100";
              let wordBg = "transparent";
              let wordScale = "scale-100";

              if (isActive) {
                wordColor = motionSettings.active_color;
                wordScale = getActiveWordScaleClass();
                wordOpacity = "opacity-100";
                if (
                  motionSettings.active_word_style === "highlight" ||
                  motionSettings.preset === "clean_pop" ||
                  motionSettings.preset === "punchy" ||
                  motionSettings.preset === "hormozi" ||
                  motionSettings.preset === "neon_pulse"
                ) {
                  wordBg = motionSettings.active_bg_color;
                }
              } else if (isKaraoke) {
                if (isSpoken) {
                  wordColor = "#FFFFFF";
                  wordOpacity = "opacity-100";
                } else if (isUpcoming) {
                  wordOpacity = "opacity-40";
                }
              }

              return (
                <span
                  key={`${cue.id}_w_${wIdx}`}
                  data-testid="motion-word"
                  data-word-text={word.text}
                  data-word-active={isActive ? "true" : "false"}
                  data-word-spoken={isSpoken ? "true" : "false"}
                  className={`inline-block transition-all duration-150 transform rounded px-1 py-0.5 ${wordScale} ${wordOpacity}`}
                  style={{
                    color: wordColor,
                    backgroundColor: wordBg,
                    boxShadow:
                      isActive && wordBg !== "transparent"
                        ? "0 0 12px " + motionSettings.active_bg_color
                        : "none",
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        ) : (
          /* Segment-level Fallback: Word timings unavailable (e.g. translated/transliterated text) */
          <div data-testid="segment-fallback-display" className="space-y-0.5">
            {cue.lines && cue.lines.length > 0 ? (
              cue.lines.map((line, lIdx) => (
                <div
                  key={`${cue.id}_line_${lIdx}`}
                  className="leading-snug transition-colors duration-150"
                  style={{
                    color:
                      motionSettings.preset === "karaoke"
                        ? motionSettings.active_color
                        : motionSettings.preset === "hormozi"
                        ? "#FFFFFF"
                        : motionSettings.primary_color,
                  }}
                >
                  {line}
                </div>
              ))
            ) : (
              <div className="leading-snug">{cue.text}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
