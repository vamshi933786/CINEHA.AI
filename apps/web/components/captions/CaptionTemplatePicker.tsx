"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Check,
  Languages,
  Zap,
  Film,
  Layers,
  Flame,
  Award,
} from "lucide-react";
import { CaptionTemplate } from "@/types/caption";
import { CAPTION_TEMPLATES } from "./captionTemplates";

interface CaptionTemplatePickerProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: CaptionTemplate) => void;
  language?: string;
  languageCode?: string;
  isTransliteration?: boolean;
  hasWordTimings?: boolean;
  disabled?: boolean;
}

const CATEGORIES = [
  "All",
  "Viral Creator",
  "Clean & Minimal",
  "High Impact",
  "Cinematic",
  "Modern Sync",
] as const;

export function CaptionTemplatePicker({
  selectedTemplateId,
  onSelectTemplate,
  language = "English",
  languageCode = "en",
  isTransliteration = false,
  hasWordTimings = false,
  disabled = false,
}: CaptionTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const isNativeTelugu = useMemo(() => {
    return (
      (language.toLowerCase().includes("telugu") || languageCode === "te") &&
      !isTransliteration &&
      !language.toLowerCase().includes("tanglish") &&
      !languageCode?.includes("te-Latn")
    );
  }, [language, languageCode, isTransliteration]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "All") return CAPTION_TEMPLATES;
    return CAPTION_TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border border-[#232738] bg-[#12131e] space-y-4 text-xs"
      data-testid="caption-template-picker"
    >
      {/* Header with Title & Language Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#212538]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 tracking-wide">
              Caption Styles & Professional Templates
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              One-Click Apply
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Choose a complete visual system. One click instantly sets typography, colors, background, and animations.
          </p>
        </div>

        {/* Native Telugu & Language Indicator Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isNativeTelugu ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-medium text-[11px]"
              data-testid="native-telugu-badge"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>Native Telugu (తెలుగు) Mode Active</span>
            </div>
          ) : isTransliteration ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-medium text-[11px]">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tanglish (te-Latn) Mode Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 font-medium text-[11px]">
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <span>English Caption Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {CATEGORIES.map((cat) => {
          const isCatSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isCatSelected}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                isCatSelected
                  ? "bg-cyan-500 border-cyan-400 text-black font-bold shadow-md shadow-cyan-950/30"
                  : "bg-[#181a28] border-[#292e44] text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Template Visual Cards Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        role="radiogroup"
        aria-label="Caption style templates"
      >
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const previewText = isNativeTelugu
            ? template.teluguPreview || "సినిమాటిక్ రీల్స్!"
            : template.englishPreview || "Viral Reel Caption!";

          // Determine preview background styling
          const getPreviewBgStyle = () => {
            switch (template.background.type) {
              case "solid":
                return "bg-black/95 border border-emerald-500/50 shadow-lg px-2.5 py-1 rounded-lg";
              case "translucent":
                return "bg-black/50 backdrop-blur-sm border border-slate-600/40 px-2.5 py-1 rounded-lg";
              case "pill":
                return "bg-purple-950/60 border border-purple-500/40 px-3 py-0.5 rounded-full";
              case "highlight":
                return "bg-black/90 border border-amber-400/50 px-2.5 py-1 rounded-lg";
              case "outline":
                return "border border-cyan-400/70 shadow-[0_0_12px_rgba(0,240,255,0.4)] px-2 py-0.5 rounded-md";
              case "gradient":
                return "bg-gradient-to-b from-black/20 to-black/80 border border-amber-500/30 px-2.5 py-1 rounded-lg";
              case "none":
              default:
                return "drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]";
            }
          };

          return (
            <div
              key={template.id}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              onClick={() => !disabled && onSelectTemplate(template)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectTemplate(template);
                }
              }}
              data-testid={`template-card-${template.id}`}
              className={`group relative p-3 rounded-xl border text-left transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                isSelected
                  ? "bg-[#181d2f] border-cyan-400 ring-2 ring-cyan-400/70 shadow-lg shadow-cyan-950/40"
                  : "bg-[#161826] border-[#25293d] hover:border-slate-500 hover:bg-[#1b1e30]"
              }`}
            >
              {/* Top Row: Title, Badge & Selected Check */}
              <div className="flex items-start justify-between gap-1 w-full mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition line-clamp-1">
                    {template.name}
                  </h4>
                  {template.badge && (
                    <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {template.badge}
                    </span>
                  )}
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0 shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0 group-hover:border-cyan-400 transition" />
                )}
              </div>

              {/* Miniature Animated 9:16 Preview Box */}
              <div className="w-full h-20 rounded-lg bg-black/75 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-2 mb-2 group-hover:border-cyan-500/30 transition">
                {/* Safe Area subtle outline in mini preview */}
                <div className="absolute inset-1 border border-dashed border-white/10 rounded pointer-events-none" />

                {/* Simulated Caption inside mini preview */}
                <div
                  className={`text-center transition-transform transform group-hover:scale-105 duration-150 ${getPreviewBgStyle()} ${
                    isNativeTelugu ? "font-serif leading-relaxed" : "font-sans leading-snug"
                  }`}
                  style={{
                    color: template.colors.text,
                    fontWeight:
                      template.typography.fontWeight === "black"
                        ? 900
                        : template.typography.fontWeight === "bold"
                        ? 700
                        : 500,
                  }}
                >
                  <span
                    className="text-[11px] font-bold line-clamp-1"
                    style={{
                      color: template.colors.activeWord || template.colors.text,
                    }}
                  >
                    {previewText}
                  </span>
                </div>

                {/* Placement indicator tag */}
                <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-500 bg-black/60 px-1 rounded">
                  {template.background.type === "none"
                    ? "No Box"
                    : template.background.type}
                </span>
              </div>

              {/* Description & Tags */}
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
