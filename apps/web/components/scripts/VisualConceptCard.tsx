"use client";

import React, { useState } from "react";
import type {
  ScriptVisual,
  VisualImportance,
  VisualAspectRatio,
  VisualStyle,
} from "@/types/script";
import {
  Sparkles,
  RefreshCw,
  Edit3,
  Paperclip,
  Check,
  Trash2,
  Copy,
  Maximize2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VisualConceptCardProps {
  visual: ScriptVisual;
  onGenerate: (visualId: string, prompt?: string, style?: string, aspectRatio?: string) => Promise<void>;
  onRegenerate: (visualId: string, prompt?: string, style?: string, aspectRatio?: string) => Promise<void>;
  onToggleAttach: (visualId: string, currentAttached: boolean) => Promise<void>;
  onDelete: (visualId: string) => Promise<void>;
  isProviderConfigured: boolean;
}

const STYLE_OPTIONS: VisualStyle[] = [
  "Clean Educational",
  "Cinematic",
  "Modern 3D",
  "Minimal Illustration",
  "Editorial",
  "Realistic",
  "Infographic-style",
];

const ASPECT_RATIO_OPTIONS: VisualAspectRatio[] = ["9:16", "1:1", "16:9"];

export function VisualConceptCard({
  visual,
  onGenerate,
  onRegenerate,
  onToggleAttach,
  onDelete,
  isProviderConfigured,
}: VisualConceptCardProps) {
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(visual.prompt || visual.suggested_prompt);
  const [editedStyle, setEditedStyle] = useState<VisualStyle>(visual.style || "Clean Educational");
  const [editedAspectRatio, setEditedAspectRatio] = useState<VisualAspectRatio>(
    visual.aspect_ratio || "9:16"
  );
  const [hasCopied, setHasCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const getImportanceBadge = (imp: VisualImportance) => {
    switch (imp) {
      case "Essential":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Recommended":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "Optional":
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (_) {}
  };

  const handleGenerateClick = async () => {
    setIsLocalLoading(true);
    try {
      if (visual.status === "ready") {
        await onRegenerate(visual.id, editedPrompt, editedStyle, editedAspectRatio);
      } else {
        await onGenerate(visual.id, editedPrompt, editedStyle, editedAspectRatio);
      }
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleToggleAttachClick = async () => {
    await onToggleAttach(visual.id, visual.is_attached);
  };

  const isGenerating = visual.status === "generating" || isLocalLoading;

  return (
    <div
      data-testid={`visual-card-${visual.id}`}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        visual.is_attached
          ? "border-cyan-500/40 bg-slate-900/90 shadow-cyan-950/20"
          : "border-white/10 bg-slate-900/70 hover:border-white/20"
      }`}
    >
      {/* Top Header Pills Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-white/5 bg-slate-950/40 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full font-semibold border ${getImportanceBadge(
              visual.importance
            )}`}
          >
            {visual.importance}
          </span>
          <span className="px-2 py-0.5 rounded-full font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {visual.visual_type}
          </span>
          <span className="px-2 py-0.5 rounded-full font-mono text-[11px] bg-slate-800/80 text-cyan-300 border border-cyan-500/20">
            {visual.aspect_ratio}
          </span>
        </div>

        {visual.placement && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-cyan-400" />
            {visual.placement}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Concept Title (in target script language) */}
          <div>
            <h4 className="text-base font-bold text-white tracking-wide">
              {visual.concept_title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              {visual.explanation}
            </p>
          </div>

          {/* Related Script Text Quote */}
          {visual.related_script_text && (
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-3 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Script Dialogue Context:
              </span>
              <p className="text-slate-300 italic">
                &ldquo;{visual.related_script_text}&rdquo;
              </p>
            </div>
          )}

          {/* Visual Preview / Image Display Area */}
          <div className="relative rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden flex items-center justify-center min-h-[220px]">
            {visual.status === "ready" && visual.image_url ? (
              <div className="relative w-full flex items-center justify-center p-2 group/img">
                <img
                  src={visual.image_url}
                  alt={visual.concept_title}
                  className={`rounded-lg object-contain transition-all max-h-[300px] w-auto shadow-md ${
                    visual.aspect_ratio === "9:16"
                      ? "aspect-[9/16]"
                      : visual.aspect_ratio === "1:1"
                      ? "aspect-square"
                      : "aspect-video"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  className="absolute bottom-4 right-4 p-2 rounded-lg bg-slate-950/80 text-white border border-white/20 opacity-0 group-hover/img:opacity-100 transition shadow-lg hover:bg-slate-900"
                  title="View Full Size"
                >
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            ) : isGenerating ? (
              <div className="p-8 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">
                    Generating Visual Concept...
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Applying {visual.style} style ({visual.aspect_ratio})
                  </p>
                </div>
              </div>
            ) : visual.status === "failed" ? (
              <div className="p-6 text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-rose-300">
                  Image Generation Failed
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  {visual.error_message || "Your script is unchanged. Please try again."}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-400">
                  <Layers className="w-6 h-6 text-cyan-400/80" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Visual Concept Discovered
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ready to generate {visual.style} visual
                  </p>
                </div>
                {!isProviderConfigured && (
                  <p className="text-[10px] text-amber-400/90 font-mono">
                    Provider unconfigured • Prompt available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Advanced Prompt Editor Accordion */}
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-3">
            <button
              type="button"
              onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                Advanced Prompt Editing
              </span>
              {isEditingPrompt ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isEditingPrompt ? (
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Image Generation Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-y leading-relaxed font-mono"
                    placeholder="Enter visual generation prompt..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Visual Style
                    </label>
                    <select
                      value={editedStyle}
                      onChange={(e) => setEditedStyle(e.target.value as VisualStyle)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {STYLE_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Aspect Ratio
                    </label>
                    <select
                      value={editedAspectRatio}
                      onChange={(e) => setEditedAspectRatio(e.target.value as VisualAspectRatio)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {ASPECT_RATIO_OPTIONS.map((ar) => (
                        <option key={ar} value={ar}>
                          {ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPrompt}
                    className="text-[11px] gap-1 text-slate-300"
                  >
                    <Copy className="w-3 h-3" />
                    {hasCopied ? "Copied Prompt" : "Copy Prompt"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-mono line-clamp-2">
                {editedPrompt}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={visual.status === "ready" ? "outline" : "primary"}
              size="sm"
              onClick={handleGenerateClick}
              disabled={isGenerating || !isProviderConfigured}
              title={
                !isProviderConfigured
                  ? "Image generation is not configured yet."
                  : undefined
              }
              className={`text-xs font-semibold gap-1.5 ${
                !isProviderConfigured ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : visual.status === "ready" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Image
                </>
              )}
            </Button>

            <Button
              variant={visual.is_attached ? "secondary" : "ghost"}
              size="sm"
              onClick={handleToggleAttachClick}
              className={`text-xs gap-1.5 ${
                visual.is_attached
                  ? "border border-cyan-500/40 text-cyan-300 bg-cyan-500/10"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {visual.is_attached ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  Attached to Script
                </>
              ) : (
                <>
                  <Paperclip className="w-3.5 h-3.5" />
                  Use in Script
                </>
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(visual.id)}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2"
            title="Remove Visual Concept"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Full-Size Modal Preview */}
      {isFullscreen && visual.image_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
            <img
              src={visual.image_url}
              alt={visual.concept_title}
              className="max-h-[80vh] w-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFullscreen(false)}
              >
                Close Fullscreen
              </Button>
              <a
                href={visual.image_url}
                download={`${visual.concept_title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Download PNG
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
