"use client";

import React from "react";
import { Languages, Subtitles, Mic, Check, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  LanguageSettings,
  CaptionLanguageChoice,
  SpokenLanguageChoice,
} from "@/types/settings";

export interface LanguageSectionProps {
  settings: LanguageSettings;
  onChange: (updates: Partial<LanguageSettings>) => void;
}

export function LanguageSection({ settings, onChange }: LanguageSectionProps) {
  const captionLanguages: {
    id: CaptionLanguageChoice;
    label: string;
    sublabel: string;
    script: string;
    desc: string;
    sample: string;
  }[] = [
    {
      id: "te",
      label: "తెలుగు (Native Telugu)",
      sublabel: "Traditional Script",
      script: "Telugu Script",
      desc: "Full native Telugu typography with authentic ligature shaping via Noto Sans Telugu.",
      sample: "సినిమాటిక్ కెమెరా సెట్టింగ్స్!",
    },
    {
      id: "tanglish",
      label: "Tanglish (Romanized Telugu)",
      sublabel: "Latin Alphabet",
      script: "Latin Script",
      desc: "Telugu phonetic transcription written using Latin characters for high-energy social feeds.",
      sample: "Cinematic camera settings ilaa unnaayi!",
    },
    {
      id: "en",
      label: "English",
      sublabel: "International",
      script: "Latin Script",
      desc: "Standard English transcription with acoustic word-level karaoke highlighting.",
      sample: "Stop shooting your reels at 60fps!",
    },
  ];

  const spokenLanguages: {
    id: SpokenLanguageChoice;
    label: string;
    desc: string;
  }[] = [
    {
      id: "te",
      label: "Telugu (తెలుగు)",
      desc: "Optimized for Telugu creators. Directly engages the Whisper Telugu acoustic dictionary.",
    },
    {
      id: "en",
      label: "English",
      desc: "Standard English acoustic model with word-level confidence timings.",
    },
    {
      id: "auto",
      label: "Auto-Detect Spoken Audio",
      desc: "Analyzes the initial 30 seconds of video audio to automatically infer the primary language.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-cine-card/60 border border-cine-border text-cine-muted">
        <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-cine-muted">
          CINEHAI AI is purposefully engineered for <strong className="text-cine-text">English</strong>, <strong className="text-cine-text">తెలుగు (Telugu)</strong>, and <strong className="text-cine-text">Tanglish</strong> short-form cinematic creators. All font engines, motion graphic presets, and speech restoration pipelines are calibrated specifically for these language profiles.
        </p>
      </div>

      {/* Caption Studio Default Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Subtitles className="w-5 h-5" />
              </div>
              <CardTitle>Caption Studio Default Language</CardTitle>
            </div>
            <Badge variant="accent" size="sm">Creator Core</Badge>
          </div>
          <CardDescription>
            Choose the default subtitle target script applied when loading new video projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {captionLanguages.map((lang) => {
              const isSelected = settings.captionLanguageDefault === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onChange({ captionLanguageDefault: lang.id })}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10 shadow-sm shadow-cine-accent/10"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="font-semibold text-cine-text text-sm">{lang.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cine-accent flex items-center justify-center text-white shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <Badge variant="neutral" size="sm" className="w-fit mb-2 text-[10px]">
                    {lang.script}
                  </Badge>
                  <p className="text-xs text-cine-muted leading-relaxed mb-3 flex-1">
                    {lang.desc}
                  </p>
                  <div className="mt-auto p-2 rounded-lg bg-cine-card border border-cine-border text-[11px] font-mono text-cine-accent dark:text-indigo-300 truncate">
                    Preview: &quot;{lang.sample}&quot;
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Spoken Audio Language Default */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Mic className="w-5 h-5" />
              </div>
              <CardTitle>Default Transcription Speech Language</CardTitle>
            </div>
            <Badge variant="emerald" size="sm">Acoustic Model</Badge>
          </div>
          <CardDescription>
            The initial spoken language assumption passed to Whisper during audio ingestion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {spokenLanguages.map((item) => {
              const isSelected = settings.spokenLanguageDefault === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ spokenLanguageDefault: item.id })}
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
                  <span className="text-xs text-cine-muted leading-relaxed">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* App Interface Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cine-card border border-cine-border text-cine-muted">
                <Languages className="w-5 h-5" />
              </div>
              <CardTitle>Application Interface Language</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">System</Badge>
          </div>
          <CardDescription>
            The language used for studio buttons, tooltips, and dashboard navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-cine-card/60 border border-cine-border max-w-md">
            <div>
              <span className="text-sm font-medium text-cine-text block">English (US)</span>
              <span className="text-xs text-cine-muted">Primary studio interface</span>
            </div>
            <Badge variant="emerald" size="sm">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
