"use client";

import React from "react";
import {
  Video,
  Film,
  HardDriveUpload,
  BarChart,
  Eye,
  Scissors,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VideoDefaultsSettings, AspectRatioChoice } from "@/types/settings";

export interface VideoDefaultsSectionProps {
  settings: VideoDefaultsSettings;
  onChange: (updates: Partial<VideoDefaultsSettings>) => void;
  serverMaxUploadMb?: number;
}

export function VideoDefaultsSection({
  settings,
  onChange,
  serverMaxUploadMb = 100,
}: VideoDefaultsSectionProps) {
  const aspectRatios: {
    id: AspectRatioChoice;
    label: string;
    sublabel: string;
    ratio: string;
    badge?: string;
    desc: string;
  }[] = [
    {
      id: "9:16",
      label: "9:16 Vertical",
      sublabel: "Reels / Shorts / TikTok",
      ratio: "w-7 h-12",
      badge: "Creator Recommended",
      desc: "Optimized for mobile-first feeds, portrait safe-zones, and vertical motion graphics.",
    },
    {
      id: "1:1",
      label: "1:1 Square",
      sublabel: "Feed Posts & Carousels",
      ratio: "w-9 h-9",
      desc: "Standard square aspect ratio suitable for multi-platform feeds.",
    },
    {
      id: "16:9",
      label: "16:9 Landscape",
      sublabel: "YouTube & Cinematic",
      ratio: "w-12 h-7",
      desc: "Widescreen video layout with generous horizontal text margins.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upload Guardrail Notice */}
      <Card className="border-cine-border bg-gradient-to-r from-cine-surface to-slate-900/60">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <HardDriveUpload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Centralized Server Upload Limit</h4>
                <Badge variant="accent" size="sm">{serverMaxUploadMb} MB Max</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Applies globally across Caption Studio, Video Ingest, and Video Analysis modules. Enforced by backend streaming validators to ensure memory stability on local dev machines.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="emerald" size="sm">Active Guardrail</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Default Aspect Ratio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Film className="w-5 h-5" />
              </div>
              <CardTitle>Default Video Aspect Ratio</CardTitle>
            </div>
            <Badge variant="accent" size="sm">Canvas</Badge>
          </div>
          <CardDescription>
            Choose the default frame orientation loaded into Caption Studio and the Video Preview player.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {aspectRatios.map((item) => {
              const isSelected = settings.defaultAspectRatio === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ defaultAspectRatio: item.id })}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10 shadow-sm shadow-cine-accent/10"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={`${item.ratio} rounded bg-slate-800 border-2 ${
                        isSelected ? "border-indigo-400" : "border-slate-700"
                      } flex items-center justify-center`}
                    >
                      <span className="text-[9px] font-mono text-slate-400">{item.id}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cine-accent flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-white text-sm">{item.label}</span>
                  <span className="text-xs text-indigo-300 font-mono mt-0.5">{item.sublabel}</span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                  {item.badge && (
                    <Badge variant="accent" size="sm" className="mt-3 w-fit text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automated Video Analysis Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Video className="w-5 h-5" />
              </div>
              <CardTitle>Video Analysis Automation</CardTitle>
            </div>
            <Badge variant="emerald" size="sm">Audit</Badge>
          </div>
          <CardDescription>
            Configure default analytical checks performed when uploading videos to the Video Analysis module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pacing Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/40 border border-cine-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
                <BarChart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Auto-Run Pacing & Retention Audit</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculates speech cadence, syllable density, and predicted drop-off curves upon video ingestion.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.autoAnalyzePacing}
                onChange={(e) => onChange({ autoAnalyzePacing: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Auto-Run Pacing Audit"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>

          {/* Visual Hook Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/40 border border-cine-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Auto-Detect 3-Second Visual Hooks</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audits the opening frames for kinetic motion, camera movement, or bold typography elements.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.autoDetectVisualHooks}
                onChange={(e) => onChange({ autoDetectVisualHooks: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Auto-Detect Visual Hooks"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>

          {/* Scene Segmentation Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/40 border border-cine-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Auto-Segment Scene Beats</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identifies scene cut points and aligns screenplay narrative blocks with video timecodes.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.autoSceneSegmentation}
                onChange={(e) => onChange({ autoSceneSegmentation: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Auto-Segment Scene Beats"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
