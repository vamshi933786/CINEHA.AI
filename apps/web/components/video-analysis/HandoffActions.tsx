"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Activity, Wand2, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { VideoAnalysisResponse } from "@/types/videoAnalysis";
import {
  saveOptimizerHandoff,
  type OptimizerHandoffPayload,
  type OptimizationGoalKey,
} from "@/types/optimizer";

interface HandoffActionsProps {
  analysis: VideoAnalysisResponse;
  onReset: () => void;
  onScrollToTranscript?: () => void;
}

export function HandoffActions({
  analysis,
  onReset,
  onScrollToTranscript,
}: HandoffActionsProps) {
  const router = useRouter();
  const hasTranscript = analysis.transcript.available && analysis.transcript.text.trim().length > 0;

  const handleOpenScriptAnalyzer = () => {
    if (!hasTranscript) return;
    try {
      window.sessionStorage.setItem(
        "cineha_script_text_handoff",
        JSON.stringify({
          script_text: analysis.transcript.text,
          title: analysis.video.filename.replace(/\.[^/.]+$/, ""),
          language: analysis.transcript.language,
          duration_seconds: Math.round(analysis.video.duration_seconds),
        })
      );
    } catch (_) {}
    router.push("/analyzer");
  };

  const handleOpenScriptOptimizer = () => {
    if (!hasTranscript) return;

    // Derive recommended optimization goals from metrics
    const goals: OptimizationGoalKey[] = [];
    const metricMap = new Map(analysis.metrics.map((m) => [m.id, m.score]));

    if ((metricMap.get("hook_strength") ?? 100) < 75) goals.push("improve_hook");
    if ((metricMap.get("filler_repetition") ?? 100) < 75) goals.push("remove_filler");
    if ((metricMap.get("pacing") ?? 100) < 75) goals.push("improve_pacing");
    if ((metricMap.get("curiosity_open_loops") ?? 100) < 75) goals.push("strengthen_curiosity");
    if ((metricMap.get("cta_strength") ?? 100) < 75) goals.push("improve_cta");
    if (goals.length === 0 || analysis.overall_score < 75) goals.push("general_retention");

    const hookSeg = analysis.segments.find((s) => s.label === "HOOK");
    const ctaSeg = analysis.segments.find((s) => s.label === "CTA");

    // Construct mock ScriptAnalysisResponse structure needed by Optimizer
    const mockAnalysisResponse: any = {
      title: analysis.video.filename,
      overall_score: analysis.overall_score,
      overall_rating: analysis.overall_rating,
      hook_clarity: {
        score: metricMap.get("opening_clarity") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      hook_strength: {
        score: metricMap.get("hook_strength") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      pacing_progression: {
        score: metricMap.get("pacing") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      information_density: {
        score: metricMap.get("information_density") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      filler_repetition: {
        score: metricMap.get("filler_repetition") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      segment_timing: {
        score: metricMap.get("retention_structure") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      curiosity_open_loops: {
        score: metricMap.get("curiosity_open_loops") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      cta_strength: {
        score: metricMap.get("cta_strength") ?? 70,
        rating: "Evaluated",
        explanation: "Derived from video analysis.",
      },
      overall_retention_potential: {
        score: analysis.overall_score,
        rating: analysis.overall_rating,
        explanation: analysis.summary,
      },
      weak_points: analysis.findings,
      recommendations: analysis.recommendations,
      segment_observations: analysis.segments.map((s) => ({
        segment_id: s.segment_id,
        time_range: `${s.start_seconds.toFixed(1)}s–${s.end_seconds.toFixed(1)}s`,
        section: s.label,
        observation: s.observation || s.transcript,
        retention_risk: s.label === "HOOK" ? "medium" : "low",
      })),
      metrics: {
        total_word_count: analysis.transcript.word_count,
        words_per_second: analysis.transcript.words_per_second,
        pacing_assessment: analysis.transcript.words_per_second > 3.5 ? "Rushed" : "Optimal",
        detected_filler_words: [],
        hook_duration_seconds: hookSeg?.duration_seconds || 3.0,
        cta_duration_seconds: ctaSeg?.duration_seconds || 2.0,
      },
      analyzed_at: analysis.analyzed_at,
      provider_used: analysis.provider_used,
    };

    const payload: OptimizerHandoffPayload = {
      scriptId: null,
      title: analysis.video.filename.replace(/\.[^/.]+$/, ""),
      scriptText: analysis.transcript.text,
      sourceType: "video_analysis",
      language: analysis.transcript.language,
      durationSeconds: Math.round(analysis.video.duration_seconds),
      hook: hookSeg ? hookSeg.transcript : "",
      cta: ctaSeg ? ctaSeg.transcript : "",
      analysis: mockAnalysisResponse,
      weakPoints: analysis.findings,
      recommendations: analysis.recommendations,
      recommendedGoals: goals,
      timestamp: Date.now(),
    };


    saveOptimizerHandoff(payload);
    router.push("/optimizer");
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <h3 className="text-base font-bold text-white">Next Creator Actions</h3>
      <p className="text-xs text-slate-400">
        Iterate on this video asset or seamlessly hand off the spoken transcript into CINEHA AI&apos;s screenplay diagnostic modules.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Analyze Again */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Analyze Another Video</span>
        </Button>

        {/* View Transcript */}
        {hasTranscript && onScrollToTranscript && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onScrollToTranscript}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Transcript</span>
          </Button>
        )}

        {/* Open Script Analyzer */}
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={!hasTranscript}
          onClick={handleOpenScriptAnalyzer}
          title={
            hasTranscript
              ? "Analyze spoken transcript in Script Retention Analyzer"
              : "Spoken transcript is not available for this video"
          }
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Open Script Analyzer</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </Button>

        {/* Open Script Optimizer */}
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!hasTranscript}
          onClick={handleOpenScriptOptimizer}
          title={
            hasTranscript
              ? "Rewrite and optimize transcript with AI retention goals"
              : "Spoken transcript is not available for this video"
          }
          className="flex items-center gap-2 shadow-lg shadow-cyan-950/40"
        >
          <Wand2 className="w-4 h-4 text-cyan-300" />
          <span>Open Script Optimizer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {!hasTranscript && (
        <p className="text-[11px] text-slate-500 italic pt-1">
          * Script Analyzer and Optimizer handoff are disabled because no spoken dialogue transcript was detected.
        </p>
      )}
    </div>
  );
}
