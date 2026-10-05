"use client";

import React, { useState } from "react";
import type { PersonaPreviewResponse } from "@/types/creatorProfile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Flame,
  ArrowRightCircle,
  Copy,
  Check,
  Zap,
  RefreshCw,
} from "lucide-react";

interface PersonaPreviewPanelProps {
  preview: PersonaPreviewResponse;
  onGenerateSummary?: () => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export function PersonaPreviewPanel({
  preview,
  onGenerateSummary,
  isGenerating = false,
  className = "",
}: PersonaPreviewPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Ignore clipboard write failures in sandboxed test environments
    }
  };

  return (
    <Card
      className={`border-cine-accent/30 bg-gradient-to-b from-cine-card to-cine-surface shadow-xl ${className}`}
      data-testid="persona-preview-panel"
    >
      <CardHeader className="pb-3 border-b border-cine-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cine-accent" />
            <CardTitle className="text-sm font-semibold text-white">
              AI Persona Preview
            </CardTitle>
            {preview.is_ai_generated ? (
              <Badge variant="accent" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Gemini Synthesized
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                <Zap className="w-3 h-3 mr-1 text-cine-amber" />
                Live Instant Preview
              </Badge>
            )}
          </div>

          {onGenerateSummary && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateSummary}
              disabled={isGenerating}
              className="text-xs h-8 border-cine-accent/40 text-cine-accent hover:bg-cine-accent/10"
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
                />
              }
            >
              {isGenerating ? "Synthesizing..." : "Generate AI Persona Summary"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Persona Summary Card */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cine-accent" />
              Creator Synthesis
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(preview.summary, "summary")}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              title="Copy Summary"
            >
              {copiedKey === "summary" ? (
                <Check className="w-3 h-3 text-cine-emerald" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copiedKey === "summary" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="p-3 rounded-lg bg-cine-bg/60 border border-cine-border/50 text-xs sm:text-sm text-slate-200 leading-relaxed italic">
            "{preview.summary}"
          </div>
        </div>

        {/* Live Generation Previews Grid */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Downstream Agent Simulation
          </div>

          {/* Example Hook */}
          <div className="p-2.5 rounded-lg bg-cine-bg/40 border border-cine-border/40 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                <Flame className="w-3 h-3" />
                <span>Simulated Hook (0–3s)</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(preview.example_hook, "hook")}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                {copiedKey === "hook" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-200 font-medium">
              "{preview.example_hook}"
            </p>
          </div>

          {/* Example Intro */}
          <div className="p-2.5 rounded-lg bg-cine-bg/40 border border-cine-border/40 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cine-accent">
                <MessageSquare className="w-3 h-3" />
                <span>Simulated Script Intro</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(preview.example_intro, "intro")}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                {copiedKey === "intro" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-300">
              "{preview.example_intro}"
            </p>
          </div>

          {/* Example CTA */}
          <div className="p-2.5 rounded-lg bg-cine-bg/40 border border-cine-border/40 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cine-emerald">
                <ArrowRightCircle className="w-3 h-3" />
                <span>Simulated Call-to-Action</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(preview.example_cta, "cta")}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                {copiedKey === "cta" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-300">
              "{preview.example_cta}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
