"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { RetentionScoreGauge } from "./RetentionScoreGauge";
import { CategoryScoresGrid } from "./CategoryScoresGrid";
import { WeakPointsAndRecommendations } from "./WeakPointsAndRecommendations";
import { SegmentTimelineAnalysis } from "./SegmentTimelineAnalysis";
import { ScriptSelector } from "./ScriptSelector";
import { api } from "../../lib/api";
import type { ScriptAnalysisResponse, ScriptAnalysisRequest } from "@/types/analyzer";

export const SAMPLE_PRESETS: Record<"viral" | "filler" | "cinematic", ScriptAnalysisRequest> = {
  viral: {
    title: "Why 24fps Feels Like Cinema",
    topic: "Cinematic Frame Rate",
    platform: "Instagram Reels",
    language: "English",
    duration_seconds: 15,
    hook: "Stop shooting at 60fps! Here's the 1-second setting that makes phone footage look like cinema.",
    cta: "Save this before your next shoot!",
    segments: [
      {
        id: "seg_1",
        start_time: "0:00",
        end_time: "0:03",
        section: "HOOK",
        voiceover: "Stop shooting at 60fps! Here's the 1-second setting that makes phone footage look like cinema.",
        visual_direction: "Macro close-up rack focus into iPhone camera sensor.",
        b_roll: "High-contrast split screen comparison",
        on_screen_text: "THE 24FPS CINEMA SECRET 🎬",
        audio_direction: "Sub bass drop with clean vinyl hit",
      },
      {
        id: "seg_2",
        start_time: "0:03",
        end_time: "0:07",
        section: "PROBLEM",
        voiceover: "60fps creates that fake soap-opera look with zero natural motion blur.",
        visual_direction: "Side-by-side slow pan showing harsh digital stutter.",
        b_roll: "Extreme motion jitter highlight",
        on_screen_text: "SOAP OPERA EFFECT ❌",
        audio_direction: "Subtle reverse swoosh",
      },
      {
        id: "seg_3",
        start_time: "0:07",
        end_time: "0:12",
        section: "SOLUTION",
        voiceover: "Switch to 24fps and lock your shutter angle to 180 degrees for organic blur.",
        visual_direction: "Over-the-shoulder tapping camera settings menu.",
        b_roll: "Screen recording with 180° highlighted",
        on_screen_text: "24FPS + 180° SHUTTER RULE",
        audio_direction: "Rhythmic electronic beat drop",
      },
      {
        id: "seg_4",
        start_time: "0:12",
        end_time: "0:15",
        section: "CTA",
        voiceover: "Save this before your next shoot!",
        visual_direction: "Creator smiling pointing directly to bookmark icon.",
        b_roll: "Bookmark bounce animation",
        on_screen_text: "SAVE FOR YOUR NEXT SHOOT",
        audio_direction: "Clean chime finish",
      },
    ],
  },
  filler: {
    title: "Smartphone Lighting Advice (Unoptimized)",
    topic: "Basic Lighting",
    platform: "TikTok",
    language: "English",
    duration_seconds: 30,
    hook: "Hey guys, in this video I basically want to actually talk about lighting.",
    cta: "So yeah, you know, kind of like and subscribe if you enjoyed this.",
    segments: [
      {
        id: "seg_1",
        start_time: "0:00",
        end_time: "0:08",
        section: "HOOK",
        voiceover: "Hey guys, in this video I basically want to actually talk about lighting.",
        visual_direction: "Person sitting looking around room with static camera.",
        b_roll: "",
        on_screen_text: "",
        audio_direction: "",
      },
      {
        id: "seg_2",
        start_time: "0:08",
        end_time: "0:30",
        section: "CTA",
        voiceover: "So yeah, you know, kind of like and subscribe if you enjoyed this.",
        visual_direction: "Person still talking waving hand loosely.",
        b_roll: "",
        on_screen_text: "",
        audio_direction: "",
      },
    ],
  },
  cinematic: {
    title: "Natural Window Light Cinematography",
    topic: "Window Lighting",
    platform: "YouTube Shorts",
    language: "English",
    duration_seconds: 30,
    hook: "This one window can replace a ₹50,000 studio light if you know this angle.",
    cta: "Follow for more mobile filmmaking secrets!",
    segments: [
      {
        id: "seg_1",
        start_time: "0:00",
        end_time: "0:04",
        section: "HOOK",
        voiceover: "This one window can replace a ₹50,000 studio light if you know this angle.",
        visual_direction: "Dolly-in through window sheer curtain onto subject portrait.",
        b_roll: "Gleaming daylight contrast",
        on_screen_text: "FREE STUDIO LIGHT TRICK 🪟",
        audio_direction: "Ambient piano with tape delay",
      },
      {
        id: "seg_2",
        start_time: "0:04",
        end_time: "0:12",
        section: "MISTAKE",
        voiceover: "Never face the window directly. That produces flat, washed out lighting with zero depth.",
        visual_direction: "Side-by-side demonstrating flat direct lighting versus directional shadow.",
        b_roll: "Shadowless face diagram",
        on_screen_text: "AVOID FLAT LIGHTING 🚫",
        audio_direction: "Low impact thud",
      },
      {
        id: "seg_3",
        start_time: "0:12",
        end_time: "0:24",
        section: "THE REVEAL",
        voiceover: "Position yourself at a 45-degree angle to the glass and let negative fill create rich cinematic contrast on your shadow side.",
        visual_direction: "Camera orbits 45 degrees revealing dimensional Rembrandt triangle on cheek.",
        b_roll: "Black foam board negative fill setup",
        on_screen_text: "45° KEY + NEGATIVE FILL",
        audio_direction: "Driving atmospheric synth",
      },
      {
        id: "seg_4",
        start_time: "0:24",
        end_time: "0:30",
        section: "CTA",
        voiceover: "Follow for more mobile filmmaking secrets!",
        visual_direction: "Creator glances into camera with confident smile.",
        b_roll: "End slate with handle",
        on_screen_text: "FOLLOW FOR PART 2",
        audio_direction: "Clean acoustic chord swell",
      },
    ],
  },
};

interface RetentionWorkspaceProps {
  initialScriptId?: string | null;
}

export function RetentionWorkspace({ initialScriptId = null }: RetentionWorkspaceProps) {
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(initialScriptId);
  const [activePreset, setActivePreset] = useState<"viral" | "filler" | "cinematic" | null>(
    initialScriptId ? null : "viral"
  );
  const [analysis, setAnalysis] = useState<ScriptAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (scriptId: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentScriptId(scriptId);
    setActivePreset(null);
    try {
      const data = await api.analyzeScriptById(scriptId);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Failed to analyze script by id:", err);
      setError(err?.message || "Failed to analyze script. Please verify the script ID exists.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSampleAnalysis = useCallback(
    async (sampleKey: "viral" | "filler" | "cinematic") => {
      setIsLoading(true);
      setError(null);
      setCurrentScriptId(null);
      setActivePreset(sampleKey);
      try {
        const samplePayload = SAMPLE_PRESETS[sampleKey];
        const data = await api.analyzeScript(samplePayload);
        setAnalysis(data);
      } catch (err: any) {
        console.error("Failed to analyze sample script:", err);
        setError(err?.message || "Failed to run sample analysis.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialScriptId) {
      runAnalysis(initialScriptId);
    } else {
      runSampleAnalysis("viral");
    }
  }, [initialScriptId, runAnalysis, runSampleAnalysis]);

  const handleSelectScript = (id: string) => {
    runAnalysis(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {currentScriptId && (
            <>
              <Link
                href="/scripts"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Studio</span>
              </Link>
              <Link
                href={`/optimizer?script_id=${currentScriptId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimize Screenplay</span>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (currentScriptId) {
              runAnalysis(currentScriptId);
            } else {
              runSampleAnalysis(activePreset || "viral");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Auditing..." : "Re-Analyze"}</span>
        </button>
      </div>

      {/* Script Selector & Preset Bar */}
      <ScriptSelector
        currentScriptId={currentScriptId}
        onSelectScriptId={handleSelectScript}
        onAnalyzeSample={runSampleAnalysis}
        isLoading={isLoading}
        activeScriptTitle={analysis?.title}
        activePreset={activePreset}
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-200">Analysis Error: </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Initial Loading Skeleton when no analysis exists yet */}
      {isLoading && !analysis && (
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
            <Activity className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Running 9-Dimension Retention Audit...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Calculating speech velocity, parsing 0–3s hook friction, detecting conversational fluff,
              and mapping drop-off probability across screenplay beats.
            </p>
          </div>
        </div>
      )}

      {/* Smooth updating banner when re-analyzing with existing data */}
      {isLoading && analysis && (
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              Updating 9-dimension retention audit for <strong>{analysis.title}</strong>...
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400/80">Diagnostic in progress</span>
        </div>
      )}

      {/* Live Retention Diagnostic Dashboard */}
      {analysis && (
        <div className={`space-y-6 transition-opacity duration-200 ${isLoading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          {/* Top Score Gauge & Primary Speech Metrics */}
          <RetentionScoreGauge analysis={analysis} />

          {/* 9-Dimension Category Cards */}
          <CategoryScoresGrid analysis={analysis} />

          {/* Weak Points & Actionable Directives */}
          <WeakPointsAndRecommendations analysis={analysis} />

          {/* Beat-by-Beat Timeline Analysis */}
          <SegmentTimelineAnalysis analysis={analysis} />
        </div>
      )}
    </div>
  );
}
