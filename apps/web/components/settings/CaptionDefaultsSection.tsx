"use client";

import React from "react";
import {
  Subtitles,
  Sparkles,
  Move,
  Type,
  Layers,
  Check,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CaptionDefaultsSettings,
  CaptionFontSize,
  CaptionIntensity,
  CaptionLanguageChoice,
} from "@/types/settings";
import { CAPTION_TEMPLATES } from "@/components/captions/captionTemplates";

export interface CaptionDefaultsSectionProps {
  settings: CaptionDefaultsSettings;
  onChange: (updates: Partial<CaptionDefaultsSettings>) => void;
}

export function CaptionDefaultsSection({
  settings,
  onChange,
}: CaptionDefaultsSectionProps) {
  const fontSizes: { id: CaptionFontSize; label: string; px: string }[] = [
    { id: "small", label: "Small", px: "18px" },
    { id: "medium", label: "Medium", px: "24px" },
    { id: "large", label: "Large", px: "32px" },
    { id: "xlarge", label: "Extra Large", px: "40px" },
  ];

  const intensities: { id: CaptionIntensity; label: string; desc: string }[] = [
    { id: "subtle", label: "Subtle", desc: "Gentle fades and smooth scale shifts" },
    { id: "normal", label: "Normal", desc: "Balanced pop and punch rhythm" },
    { id: "punchy", label: "Punchy", desc: "Aggressive kinetic snaps for maximum retention" },
  ];

  const languages: { id: CaptionLanguageChoice; label: string; script: string }[] = [
    { id: "te", label: "తెలుగు (Telugu)", script: "Native Telugu Script" },
    { id: "tanglish", label: "Tanglish", script: "Romanized Telugu" },
    { id: "en", label: "English", script: "Latin Script" },
  ];

  const currentTemplate =
    CAPTION_TEMPLATES.find((t) => t.id === settings.templateId) ||
    CAPTION_TEMPLATES[0];

  return (
    <div className="space-y-6">
      {/* Session Scope Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-cine-card/60 border border-cine-border text-cine-muted">
        <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-cine-muted">
          These settings establish the initial canvas configuration for new Caption Studio sessions. Your currently active video drafts and previously saved caption cues are never overwritten.
        </p>
      </div>

      {/* 10 One-Click Caption Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <CardTitle>Default Caption Template</CardTitle>
            </div>
            <Badge variant="accent" size="sm">
              {CAPTION_TEMPLATES.length} Cinematic Styles
            </Badge>
          </div>
          <CardDescription>
            Choose the default one-click styling preset loaded when generating burned-in motion captions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CAPTION_TEMPLATES.map((tmpl) => {
              const isSelected = settings.templateId === tmpl.id;
              const sampleText =
                settings.language === "te"
                  ? tmpl.teluguPreview || "సినిమాటిక్ కెమెరా సెట్టింగ్స్!"
                  : settings.language === "tanglish"
                  ? "Cinematic camera settings ilaa unnaayi!"
                  : tmpl.englishPreview || "Stop shooting at 60fps!";

              return (
                <button
                  key={tmpl.id}
                  data-testid={`caption-template-${tmpl.id}`}
                  type="button"
                  onClick={() => onChange({ templateId: tmpl.id })}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10 shadow-sm shadow-cine-accent/10 ring-1 ring-cine-accent/50"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-cine-text text-sm truncate">
                      {tmpl.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-cine-accent flex items-center justify-center text-white shrink-0 ml-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-cine-muted font-mono">
                      {tmpl.category}
                    </span>
                    {tmpl.badge && (
                      <Badge variant="accent" size="sm" className="text-[9px] px-1.5 py-0">
                        {tmpl.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Template Visual Preview Box */}
                  <div
                    className="mt-auto p-2.5 rounded-lg border border-slate-800 text-center font-bold text-xs truncate overflow-hidden"
                    style={{
                      backgroundColor:
                        tmpl.background?.type !== "none"
                          ? tmpl.background?.color || "#0f172a"
                          : "#090d16",
                      color: tmpl.colors?.text || "#ffffff",
                    }}
                  >
                    <span>{sampleText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Default Language Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Subtitles className="w-5 h-5" />
              </div>
              <CardTitle>Caption Target Language</CardTitle>
            </div>
            <Badge variant="accent" size="sm">Strict Creator Set</Badge>
          </div>
          <CardDescription>
            The default subtitle typography script applied during cue compilation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((item) => {
              const isSelected = settings.language === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ language: item.id })}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-medium text-cine-text text-sm">{item.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-cine-accent" />}
                  </div>
                  <span className="text-xs text-cine-muted">{item.script}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Free Positioning & Visual Mini-Screen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Move className="w-5 h-5" />
              </div>
              <CardTitle>Default X/Y Caption Coordinates</CardTitle>
            </div>
            <Badge variant="emerald" size="sm">
              X: {settings.positionX}% | Y: {settings.positionY}%
            </Badge>
          </div>
          <CardDescription>
            Fine-tune default horizontal and vertical caption anchor positions on the 9:16 vertical canvas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Slider Controls */}
            <div className="md:col-span-2 space-y-5">
              {/* X Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cine-muted font-medium">Horizontal Position (X)</span>
                  <span className="font-mono text-cine-accent dark:text-indigo-300">{settings.positionX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.positionX}
                  onChange={(e) => onChange({ positionX: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cine-accent"
                  aria-label="Caption Horizontal Position X"
                />
                <div className="flex justify-between text-[10px] text-cine-muted font-mono">
                  <span>0% (Left)</span>
                  <span>50% (Center)</span>
                  <span>100% (Right)</span>
                </div>
              </div>

              {/* Y Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cine-muted font-medium">Vertical Position (Y)</span>
                  <span className="font-mono text-cine-accent dark:text-indigo-300">{settings.positionY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.positionY}
                  onChange={(e) => onChange({ positionY: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cine-accent"
                  aria-label="Caption Vertical Position Y"
                />
                <div className="flex justify-between text-[10px] text-cine-muted font-mono">
                  <span>0% (Top)</span>
                  <span>50% (Middle)</span>
                  <span>100% (Bottom)</span>
                </div>
              </div>

              {/* Reset to standard preset */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ positionX: 50, positionY: 82 })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono"
                >
                  Reset to Standard Lower-Third (50%, 82%)
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => onChange({ positionX: 50, positionY: 50 })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono"
                >
                  Center Hook (50%, 50%)
                </button>
              </div>
            </div>

            {/* Interactive Phone Screen Preview */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-cine-card border border-cine-border">
              <span className="text-[11px] text-cine-muted font-mono mb-2">9:16 Canvas Simulation</span>
              <div className="relative w-28 h-48 rounded-xl bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
                {/* Safe Area Box */}
                {settings.safeAreaGuide && (
                  <div className="absolute inset-x-2 inset-y-4 border border-dashed border-emerald-500/30 rounded pointer-events-none" />
                )}

                {/* Simulated Caption Pill */}
                <div
                  className="absolute px-2 py-0.5 rounded bg-cine-accent/90 text-white font-bold text-[9px] whitespace-nowrap shadow-md pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${settings.positionX}%`,
                    top: `${settings.positionY}%`,
                  }}
                >
                  {currentTemplate.name}
                </div>
              </div>
              <span className="text-[10px] text-cine-muted font-mono mt-2">
                Safe Area: {settings.safeAreaGuide ? "Guided" : "Unbounded"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography & Animation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Font Size */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-400" />
              <CardTitle className="text-sm">Default Font Size</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {fontSizes.map((f) => {
                const isSelected = settings.fontSize === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChange({ fontSize: f.id })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? "border-cine-accent bg-cine-accent/10 text-cine-text font-semibold"
                        : "border-cine-border bg-cine-surface/60 text-cine-muted hover:text-cine-text"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{f.label}</span>
                      <span className="font-mono text-[10px] text-cine-muted">{f.px}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Animation Intensity & Safe Area Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-sm">Motion & Safe Area</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Safe Area Guide Switch */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-cine-card/60 border border-cine-border">
              <span className="text-xs text-cine-text">Safe-Area Guide Overlay</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.safeAreaGuide}
                  onChange={(e) => onChange({ safeAreaGuide: e.target.checked })}
                  className="sr-only peer"
                  aria-label="Toggle safe area guide"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cine-accent"></div>
              </label>
            </div>

            {/* Animation Intensity */}
            <div className="flex gap-2">
              {intensities.map((item) => {
                const isSelected = settings.animationIntensity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ animationIntensity: item.id })}
                    className={`flex-1 p-2 rounded-lg border text-center text-xs transition-all ${
                      isSelected
                        ? "border-cine-accent bg-cine-accent/10 text-cine-text font-medium"
                        : "border-cine-border bg-cine-surface/60 text-cine-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
