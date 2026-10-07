"use client";

import React, { useState, useEffect } from "react";
import type { Script, ScriptVisual, VisualProviderStatus } from "@/types/script";
import { api } from "@/lib/api";
import {
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VisualConceptCard } from "./VisualConceptCard";

interface VisualConceptsSectionProps {
  script: Script;
  className?: string;
  onVisualsUpdated?: (visuals: ScriptVisual[]) => void;
}

export function VisualConceptsSection({
  script,
  className = "",
  onVisualsUpdated,
}: VisualConceptsSectionProps) {
  const [visuals, setVisuals] = useState<ScriptVisual[]>([]);
  const [providerStatus, setProviderStatus] = useState<VisualProviderStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Load existing visuals & provider status on mount or when script id changes
  useEffect(() => {
    if (!script?.id) return;
    let isMounted = true;

    // Fetch provider status
    api.getVisualProviderStatus(script.id)
      .then((status) => {
        if (isMounted) setProviderStatus(status);
      })
      .catch((_) => {
        if (isMounted) {
          setProviderStatus({
            configured: false,
            provider: "unconfigured",
            model: "none",
            message: "Image generation provider is not configured.",
          });
        }
      });

    // Fetch existing visuals
    api.getScriptVisuals(script.id)
      .then((items) => {
        if (isMounted) {
          setVisuals(items);
          if (onVisualsUpdated) onVisualsUpdated(items);
        }
      })
      .catch((_) => {});

    return () => {
      isMounted = false;
    };
  }, [script?.id]);

  const handleAnalyzeVisuals = async () => {
    if (!script?.id) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisStage("Analyzing script for visual explanation opportunities...");

    try {
      setTimeout(() => setAnalysisStage("Identifying high-retention conceptual moments..."), 600);
      setTimeout(() => setAnalysisStage("Drafting structured visual prompts in target language..."), 1200);

      const analyzed = await api.analyzeVisualConcepts(script.id, {
        language: script.language,
        preferred_aspect_ratio: "9:16",
        preferred_style: "Clean Educational",
        profile_id: script.profile_id || undefined,
      });

      setVisuals(analyzed);
      if (onVisualsUpdated) onVisualsUpdated(analyzed);
    } catch (err: any) {
      setError(err?.message || "Failed to analyze script for visual concepts.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage("");
    }
  };

  const handleGenerate = async (
    visualId: string,
    prompt?: string,
    style?: string,
    aspectRatio?: string
  ) => {
    if (!script?.id) return;
    setError(null);

    // Optimistic UI state
    setVisuals((prev) =>
      prev.map((v) => (v.id === visualId ? { ...v, status: "generating" } : v))
    );

    try {
      const updated = await api.generateVisualImage(script.id, visualId, {
        prompt,
        style,
        aspect_ratio: aspectRatio,
      });

      setVisuals((prev) => {
        const next = prev.map((v) => (v.id === visualId ? updated : v));
        if (onVisualsUpdated) onVisualsUpdated(next);
        return next;
      });
    } catch (err: any) {
      setVisuals((prev) =>
        prev.map((v) =>
          v.id === visualId
            ? { ...v, status: "failed", error_message: err?.message || "Generation failed" }
            : v
        )
      );
      setError(err?.message || "Image generation failed. Your script is unchanged.");
    }
  };

  const handleRegenerate = async (
    visualId: string,
    prompt?: string,
    style?: string,
    aspectRatio?: string
  ) => {
    if (!script?.id) return;
    setError(null);

    setVisuals((prev) =>
      prev.map((v) => (v.id === visualId ? { ...v, status: "generating" } : v))
    );

    try {
      const updated = await api.regenerateVisualImage(script.id, visualId, {
        prompt,
        style,
        aspect_ratio: aspectRatio,
      });

      setVisuals((prev) => {
        const next = prev.map((v) => (v.id === visualId ? updated : v));
        if (onVisualsUpdated) onVisualsUpdated(next);
        return next;
      });
    } catch (err: any) {
      setVisuals((prev) =>
        prev.map((v) =>
          v.id === visualId
            ? { ...v, status: "failed", error_message: err?.message || "Regeneration failed" }
            : v
        )
      );
      setError(err?.message || "Image regeneration failed. Your script is unchanged.");
    }
  };

  const handleToggleAttach = async (visualId: string, currentAttached: boolean) => {
    if (!script?.id) return;
    try {
      const updated = await api.updateScriptVisual(script.id, visualId, {
        is_attached: !currentAttached,
      });

      setVisuals((prev) => {
        const next = prev.map((v) => (v.id === visualId ? updated : v));
        if (onVisualsUpdated) onVisualsUpdated(next);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update visual attachment.");
    }
  };

  const handleDelete = async (visualId: string) => {
    if (!script?.id) return;
    try {
      await api.deleteScriptVisual(script.id, visualId);
      setVisuals((prev) => {
        const next = prev.filter((v) => v.id !== visualId);
        if (onVisualsUpdated) onVisualsUpdated(next);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete visual concept.");
    }
  };

  const attachedVisuals = visuals.filter((v) => v.is_attached && v.status === "ready");

  return (
    <div
      data-testid="visual-concepts-section"
      className={`rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-6 ${className}`}
    >
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              AI Visual Concepts
            </h3>
            {visuals.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {visuals.length} Opportunities
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Turn important ideas in your script into visuals that help your audience understand the concept faster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyzeVisuals}
            disabled={isAnalyzing}
            className="text-xs font-semibold gap-2 shadow-lg shadow-cyan-950/40"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Script...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Script for Visuals
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Provider Status Diagnostic Banner */}
      {providerStatus && (
        <div
          className={`flex items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border text-xs ${
            providerStatus.configured
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              : "bg-amber-950/20 border-amber-500/30 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {providerStatus.configured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{providerStatus.message}</span>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/30 border border-white/5 uppercase shrink-0">
            {providerStatus.provider}
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Stepper during script analysis */}
      {isAnalyzing && (
        <div className="p-6 rounded-xl border border-cyan-500/20 bg-cyan-950/10 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-white">{analysisStage}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            Evaluating narrative beats for explanatory diagrams, comparisons & illustrations...
          </p>
        </div>
      )}

      {/* Visual Concepts Grid */}
      {visuals.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visuals.map((visual) => (
              <VisualConceptCard
                key={visual.id}
                visual={visual}
                onGenerate={handleGenerate}
                onRegenerate={handleRegenerate}
                onToggleAttach={handleToggleAttach}
                onDelete={handleDelete}
                isProviderConfigured={providerStatus?.configured ?? false}
              />
            ))}
          </div>

          {/* Attached Visuals Gallery Area */}
          {attachedVisuals.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Script Visuals ({attachedVisuals.length} Attached to Screenplay)
                </h4>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {attachedVisuals.map((v) => (
                  <div
                    key={`attached-${v.id}`}
                    className="relative shrink-0 w-28 rounded-xl border border-cyan-500/30 bg-slate-950 p-2 space-y-1.5 shadow-md"
                  >
                    {v.image_url && (
                      <img
                        src={v.image_url}
                        alt={v.concept_title}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <p className="text-[10px] font-semibold text-white truncate" title={v.concept_title}>
                      {v.concept_title}
                    </p>
                    <span className="block text-[9px] font-mono text-cyan-400 truncate">
                      {v.placement || "Attached"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !isAnalyzing ? (
        /* Empty State before running analysis */
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-white">
              No Visual Concepts Generated Yet
            </h4>
            <p className="text-xs text-slate-400">
              Click &ldquo;Analyze Script for Visuals&rdquo; to scan your screenplay beats for educational diagrams, comparisons, processes, and metaphorical visual opportunities.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyzeVisuals}
            className="text-xs font-semibold gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Script for Visuals
          </Button>
        </div>
      ) : null}
    </div>
  );
}
