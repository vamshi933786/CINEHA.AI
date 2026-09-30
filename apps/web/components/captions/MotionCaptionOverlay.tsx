"use client";

import React, { useMemo, useState, useEffect } from "react";
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
}

export function MotionCaptionOverlay({
  cue,
  currentTime,
  motionSettings,
  appearance,
  forceReducedMotion = false,
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

  // Vertical position class
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

  return (
    <div
      className={`absolute inset-x-4 pointer-events-none flex flex-col ${getVerticalClass()} ${getAlignmentClass()}`}
      data-testid="motion-caption-overlay"
      data-preset={motionSettings.preset}
      data-reduced-motion={isReducedMotion ? "true" : "false"}
    >
      <div
        className={`inline-block font-sans ${getFontWeightClass()} transition-all transform duration-150 ${getEntranceClass()} ${getExitClass()} ${
          appearance.background === "box"
            ? "bg-black/85 px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-sm"
            : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
        } ${getFontSizeClass()}`}
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
                  motionSettings.preset === "punchy"
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
