"use client";

import React from "react";
import {
  Film,
  User,
  Sparkles,
  FileText,
  BarChart2,
  GitCompare,
  Subtitles,
  Video,
  Calendar,
  Layers,
  Code,
  Shield,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AboutSection() {
  const activeModules = [
    {
      name: "Hook Generator",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      desc: "Generates high-retention 3-second openings across 9 proven creator taxonomies.",
      badge: "Active",
    },
    {
      name: "Script Studio",
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      desc: "2-column screenplay generation pairing audio voiceover with cinematic visual directions.",
      badge: "Active",
    },
    {
      name: "Retention Analyzer",
      icon: <BarChart2 className="w-4 h-4 text-emerald-400" />,
      desc: "Predicts second-by-second viewer drop-off with heuristic pacing & hook scoring.",
      badge: "Active",
    },
    {
      name: "Script Optimizer",
      icon: <GitCompare className="w-4 h-4 text-sky-400" />,
      desc: "Side-by-side interactive screenplay diff studio with targeted line-by-line rewrites.",
      badge: "Active",
    },
    {
      name: "Caption Studio",
      icon: <Subtitles className="w-4 h-4 text-pink-400" />,
      desc: "10 motion graphic templates, free X/Y positioning, Native Telugu & Tanglish, and burned-in MP4 export.",
      badge: "Active",
    },
    {
      name: "Video Analysis",
      icon: <Video className="w-4 h-4 text-cyan-400" />,
      desc: "100MB ingestion, scene beat segmentation, pacing cadence audit, and Video → Script reverse engineering.",
      badge: "Active",
    },
    {
      name: "Creator Profile",
      icon: <User className="w-4 h-4 text-purple-400" />,
      desc: "Persistent memory for creator persona, authentic voice tone, and preferred language profile.",
      badge: "Active",
    },
    {
      name: "Content Calendar",
      icon: <Calendar className="w-4 h-4 text-emerald-400" />,
      desc: "Kanban board and publishing timeline for staging concepts through production.",
      badge: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Creator Persona Attribution Card */}
      <Card className="border-cine-border bg-gradient-to-br from-cine-surface via-slate-900 to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cine-accent to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cine-accent/20 shrink-0">
                SP
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold text-white tracking-tight">Sai Panga</h3>
                  <Badge variant="accent" size="sm">Creator & Filmmaker</Badge>
                </div>
                <p className="text-xs text-indigo-300 font-mono mt-0.5">
                  Owner & Primary Creator Persona
                </p>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  CINEHAI AI is custom-crafted to elevate Sai Panga&apos;s storytelling, cinematic camera work, and high-engagement short-form video production across YouTube Reels, Shorts, and cinematic projects.
                </p>
              </div>
            </div>
            <div className="sm:self-center">
              <Badge variant="emerald" size="md">Verified Studio Owner</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purpose & Mission */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Film className="w-5 h-5" />
              </div>
              <CardTitle>CINEHAI AI — Purpose & Capabilities</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">Mission</Badge>
          </div>
          <CardDescription>
            Your intelligent content creation assistant for cinematic storytelling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            CINEHAI AI unifies ideation, screenplay development, audio transcription, multilingual caption styling, and post-production video audit into a single cohesive creative studio. It eliminates tedious manual transcription and formatting while preserving authentic creator cadence and Telugu regional vernacular.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-cine-border text-center">
              <span className="text-lg font-bold text-white">100%</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Private On-Device Processing</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-cine-border text-center">
              <span className="text-lg font-bold text-white">100 MB</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Direct Video Processing Cap</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-cine-border text-center">
              <span className="text-lg font-bold text-white">3 Scripts</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">English, Telugu & Tanglish</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Authentic Product Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle>Authentic Active Product Modules</CardTitle>
            </div>
            <Badge variant="emerald" size="sm">{activeModules.length} Modules Online</Badge>
          </div>
          <CardDescription>
            All production modules currently integrated and active across the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeModules.map((mod) => (
              <div
                key={mod.name}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-cine-border flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{mod.name}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {mod.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Stack & Architecture */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Code className="w-5 h-5" />
              </div>
              <CardTitle>Architecture & Technology Stack</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">v1.0.0</Badge>
          </div>
          <CardDescription>
            Modern production stack engineered for speed, privacy, and media handling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-cine-border">
              <span className="text-slate-400 block text-[11px]">Frontend</span>
              <span className="font-semibold text-white mt-1 block">Next.js 14 App Router</span>
              <span className="text-[10px] text-indigo-300 font-mono">React 18 + TS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-cine-border">
              <span className="text-slate-400 block text-[11px]">Backend API</span>
              <span className="font-semibold text-white mt-1 block">FastAPI + AsyncIO</span>
              <span className="text-[10px] text-emerald-300 font-mono">Python 3.14</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-cine-border">
              <span className="text-slate-400 block text-[11px]">Speech STT</span>
              <span className="font-semibold text-white mt-1 block">Local Whisper</span>
              <span className="text-[10px] text-sky-300 font-mono">faster-whisper base</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-cine-border">
              <span className="text-slate-400 block text-[11px]">LLM Engine</span>
              <span className="font-semibold text-white mt-1 block">Google Gemini</span>
              <span className="text-[10px] text-amber-300 font-mono">3.5-flash-lite</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
