"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  Mic,
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Film,
} from "lucide-react";
import {
  MotionCaptionPreset,
  MotionCaptionSettings,
  MotionEntranceAnimation,
  MotionExitAnimation,
  MotionWordAnimation,
  MotionAnimationIntensity,
  MotionActiveWordStyle,
} from "@/types/caption";
import { MOTION_PRESETS } from "./motionPresets";

interface MotionCaptionControlsProps {
  settings: MotionCaptionSettings;
  onChangeSettings: (newSettings: MotionCaptionSettings) => void;
  hasWordTimings: boolean;
  disabled?: boolean;
}

export function MotionCaptionControls({
  settings,
  onChangeSettings,
  hasWordTimings,
  disabled = false,
}: MotionCaptionControlsProps) {
  const handlePresetSelect = (presetKey: MotionCaptionPreset) => {
    const presetDef = MOTION_PRESETS[presetKey];
    if (presetDef) {
      onChangeSettings({
        ...settings,
        ...presetDef.settings,
        preset: presetKey,
      });
    }
  };

  return (
    <div className="p-4 rounded-xl border border-[#232738] bg-[#141622] space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#212538]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Motion Caption Engine
          </h4>
        </div>

        {/* Word Timing Availability Status Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {hasWordTimings ? (
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1"
              data-testid="word-synced-badge"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Word-synced motion available</span>
            </span>
          ) : (
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1"
              data-testid="segment-timing-badge"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Segment timing only</span>
            </span>
          )}
        </div>
      </div>

      {/* Warning Notice if Karaoke selected without word timings */}
      {!hasWordTimings && settings.preset === "karaoke" && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-300 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-200">
              Karaoke word synchronization is unavailable
            </span>
            <p className="mt-0.5 text-amber-300/80 leading-relaxed">
              Active transcript does not have word-level timestamps. Caption phrase will animate with segment-level fallback rather than simulated word timings.
            </p>
          </div>
        </div>
      )}

      {/* Preset Library Grid */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-slate-300">
          Motion Preset Library
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(MOTION_PRESETS) as MotionCaptionPreset[]).map((key) => {
            const preset = MOTION_PRESETS[key];
            const isSelected = settings.preset === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetSelect(key)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-950/20 text-cyan-200 shadow-md shadow-cyan-950/30"
                    : "border-[#25293d] bg-[#161826] text-slate-300 hover:border-slate-600 hover:bg-[#1b1e30]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                  {preset.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Motion Parameters */}
      <div className="pt-3 border-t border-[#212538] grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Entrance Animation */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            Entrance Animation
          </label>
          <select
            value={settings.entrance_animation}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                entrance_animation: e.target.value as MotionEntranceAnimation,
              })
            }
            aria-label="Entrance Animation"
            className="w-full bg-[#1b1e2f] border border-[#2b3149] rounded-lg px-2 py-1 text-slate-200 text-xs"
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="pop">Pop</option>
            <option value="slide_up">Slide Up</option>
          </select>
        </div>

        {/* Exit Animation */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            Exit Animation
          </label>
          <select
            value={settings.exit_animation}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                exit_animation: e.target.value as MotionExitAnimation,
              })
            }
            aria-label="Exit Animation"
            className="w-full bg-[#1b1e2f] border border-[#2b3149] rounded-lg px-2 py-1 text-slate-200 text-xs"
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide_down">Slide Down</option>
          </select>
        </div>

        {/* Word Animation */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            Word Animation
          </label>
          <select
            value={settings.word_animation}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                word_animation: e.target.value as MotionWordAnimation,
              })
            }
            aria-label="Word Animation"
            className="w-full bg-[#1b1e2f] border border-[#2b3149] rounded-lg px-2 py-1 text-slate-200 text-xs"
          >
            <option value="none">None</option>
            <option value="pop">Pop</option>
            <option value="emphasis">Emphasis</option>
            <option value="highlight">Highlight</option>
          </select>
        </div>

        {/* Animation Intensity */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            Animation Intensity
          </label>
          <select
            value={settings.intensity}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                intensity: e.target.value as MotionAnimationIntensity,
              })
            }
            aria-label="Animation Intensity"
            className="w-full bg-[#1b1e2f] border border-[#2b3149] rounded-lg px-2 py-1 text-slate-200 text-xs"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Active Word & Accessibility Row */}
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Active Word Emphasis */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
            Active Word Emphasis
          </label>
          <div className="flex items-center rounded-lg bg-[#1b1e2e] p-0.5 border border-[#292f46]">
            {(["off", "highlight", "scale", "bold"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() =>
                  onChangeSettings({ ...settings, active_word_style: style })
                }
                className={`flex-1 py-1 rounded text-center text-xs capitalize transition ${
                  settings.active_word_style === style
                    ? "bg-cyan-500 text-black font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion Setting */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#181a28] border border-[#282d44]">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Respect Reduced Motion</span>
            </span>
            <p className="text-[10px] text-slate-400">
              Disables jumpy movement for users with motion sensitivity.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.respect_reduced_motion}
            onClick={() =>
              onChangeSettings({
                ...settings,
                respect_reduced_motion: !settings.respect_reduced_motion,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative ${
              settings.respect_reduced_motion ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                settings.respect_reduced_motion ? "left-4.5" : "left-0.75"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
