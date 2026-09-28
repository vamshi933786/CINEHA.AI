"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { HookItem } from "@/types/hook";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Video,
  Mic,
  Brain,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface HookCardProps {
  hook: HookItem;
  index: number;
  isSaved?: boolean;
  onToggleSave?: (hook: HookItem) => void;
  onUseInScript?: (hook: HookItem) => void;
}

export function HookCard({
  hook,
  index,
  isSaved = false,
  onToggleSave,
  onUseInScript,
}: HookCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.hook_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  // Badge variant mapping for the 9 taxonomies
  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "Curiosity":
        return "accent";
      case "Contrarian":
        return "rose";
      case "Problem-Solution":
        return "emerald";
      case "Storytelling":
        return "amber";
      case "Question":
        return "default";
      case "Bold Statement":
        return "accent";
      case "List / Number":
        return "emerald";
      case "Fear / Mistake":
        return "rose";
      case "Transformation":
        return "amber";
      default:
        return "default";
    }
  };

  return (
    <Card className="flex flex-col justify-between hover:border-cine-accent/50 transition-all duration-200 group bg-cine-surface/95 shadow-md">
      <CardHeader className="pb-3 border-b border-cine-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-cine-accent transition-colors">
              #{String(index + 1).padStart(2, "0")}
            </span>
            <Badge variant={getCategoryBadgeVariant(hook.category)} size="sm">
              {hook.category}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              type="button"
              aria-label="Copy hook text to clipboard"
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors min-h-[32px] ${
                copied
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                  : "bg-cine-card hover:bg-cine-border/60 border-cine-border text-slate-300"
              }`}
              title="Copy hook text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cine-emerald" />
                  <span className="text-[10px] font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">Copy</span>
                </>
              )}
            </button>

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(hook)}
                type="button"
                aria-label={isSaved ? "Remove from saved" : "Save hook"}
                className={`p-1.5 rounded-lg border transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  isSaved
                    ? "bg-amber-950/60 border-amber-500 text-amber-300"
                    : "bg-cine-card hover:bg-cine-border/60 border-cine-border text-slate-400 hover:text-white"
                }`}
                title={isSaved ? "Saved" : "Save hook"}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
        {/* Main Hook Quote */}
        <div className="p-3.5 rounded-lg bg-cine-bg/80 border border-cine-border/60 shadow-inner">
          <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
            "{hook.hook_text}"
          </p>
        </div>

        {/* 3 Detail Blocks: Visual, Delivery, Retention Intent */}
        <div className="space-y-2 text-xs">
          {/* Visual Framing */}
          <div className="flex items-start gap-2 p-2 rounded bg-cine-card/50 border border-cine-border/40 text-slate-300">
            <Video className="w-3.5 h-3.5 text-cine-accent shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Visual Framing
              </strong>
              <span>{hook.visual_framing}</span>
            </div>
          </div>

          {/* Delivery Style */}
          <div className="flex items-start gap-2 p-2 rounded bg-cine-card/50 border border-cine-border/40 text-slate-300">
            <Mic className="w-3.5 h-3.5 text-cine-rose shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Delivery Style
              </strong>
              <span>{hook.delivery_style}</span>
            </div>
          </div>

          {/* Retention Intent */}
          <div className="flex items-start gap-2 p-2 rounded bg-cine-card/50 border border-cine-border/40 text-slate-300">
            <Brain className="w-3.5 h-3.5 text-cine-emerald shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Psychological Mechanism
              </strong>
              <span>{hook.retention_intent}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-3 border-t border-cine-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span>{hook.platform}</span>
            <span>•</span>
            <span className="capitalize">{hook.language}</span>
          </div>

          <Link
            href={`/scripts?hook=${encodeURIComponent(hook.hook_text)}&platform=${encodeURIComponent(
              hook.platform
            )}&language=${encodeURIComponent(hook.language)}`}
            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans font-medium transition-colors"
          >
            <span>Use in Script Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
