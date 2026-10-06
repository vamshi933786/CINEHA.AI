"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  Copy,
  Calendar,
  Film,
  Lightbulb,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  FileText,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { TrendOpportunityItem } from "@/types/trendResearch";
import { api } from "@/lib/api";

interface TrendOpportunityCardProps {
  opportunity: TrendOpportunityItem;
  onAddedToCalendar?: (title: string) => void;
}

export function TrendOpportunityCard({
  opportunity,
  onAddedToCalendar,
}: TrendOpportunityCardProps) {
  const router = useRouter();
  const [copiedHookIndex, setCopiedHookIndex] = useState<number | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [showAllHooks, setShowAllHooks] = useState(false);

  const { scores } = opportunity;
  const overall = scores.overall_score;

  // Score tier color
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 80) return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
    return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Exceptional Opportunity";
    if (score >= 82) return "High Creator Fit";
    return "Promising Vector";
  };

  // Copy hook to clipboard
  const handleCopyHook = (hookText: string, index: number) => {
    navigator.clipboard.writeText(hookText);
    setCopiedHookIndex(index);
    setTimeout(() => setCopiedHookIndex(null), 2000);
  };

  // Handoff to Hook Generator
  const handleHandoffToHooks = () => {
    const params = new URLSearchParams({
      topic: opportunity.topic,
      platform: opportunity.platform,
      language: opportunity.language,
      context: `Format: ${opportunity.recommended_format} | Why it matters: ${opportunity.why_it_matters}`,
    });
    router.push(`/hooks?${params.toString()}`);
  };

  // Handoff to Script Studio
  const handleHandoffToScript = () => {
    const chosenHook =
      opportunity.recommended_hooks && opportunity.recommended_hooks.length > 0
        ? opportunity.recommended_hooks[0]
        : "";
    const params = new URLSearchParams({
      topic: opportunity.topic,
      hook: chosenHook,
      platform: opportunity.platform,
      language: opportunity.language,
    });
    router.push(`/scripts?${params.toString()}`);
  };

  // Add to Content Calendar
  const handleAddToCalendar = async () => {
    setIsAddingToCalendar(true);
    try {
      // Pick today or tomorrow as planned date in ISO format YYYY-MM-DD
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      const isoDate = targetDate.toISOString().split("T")[0];

      const chosenHook =
        opportunity.recommended_hooks && opportunity.recommended_hooks.length > 0
          ? opportunity.recommended_hooks[0]
          : undefined;

      await api.createContentItem({
        title: opportunity.topic,
        scheduled_date: isoDate,
        status: "Planned",
        platform: opportunity.platform as any,
        content_type: "Educational",
        language: opportunity.language,
        content_pillar: opportunity.content_pillar || opportunity.primary_niche,
        hook_id: chosenHook,
        cta: opportunity.recommended_cta,
        notes: `Why it matters: ${opportunity.why_it_matters}\nFormat: ${opportunity.recommended_format}\nAngles: ${opportunity.angle_ideas.join(", ")}`,
        tags: [opportunity.primary_niche, opportunity.language, "trend-research"],
      });

      setCalendarAdded(true);
      if (onAddedToCalendar) {
        onAddedToCalendar(opportunity.topic);
      }
    } catch (err) {
      console.error("Failed to add opportunity to calendar", err);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <Card className="hover:border-indigo-500/40 transition-all flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          {/* Top Row: Overall Score & Metadata Badges */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="accent" size="sm">
                {opportunity.platform}
              </Badge>
              {opportunity.content_pillar && (
                <Badge variant="neutral" size="sm">
                  {opportunity.content_pillar}
                </Badge>
              )}
              <Badge variant="default" size="sm" className="text-cine-muted font-mono">
                {opportunity.language}
              </Badge>
            </div>

            {/* Content Opportunity Score Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold font-mono ${getScoreBadgeColor(
                overall
              )}`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{overall}/100</span>
              <span className="text-[10px] opacity-80 font-normal">
                ({getScoreLabel(overall)})
              </span>
            </div>
          </div>

          {/* Topic Title */}
          <h3 className="text-base font-semibold text-cine-text mt-2 leading-snug">
            {opportunity.topic}
          </h3>

          {/* Format & Duration Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-cine-muted mt-1">
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>{opportunity.recommended_format}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{opportunity.recommended_duration}</span>
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Transparent Score Breakdown Matrix */}
          <div className="bg-cine-card rounded-lg p-3 border border-cine-border/70 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cine-muted font-mono">
              <span>SCORE BREAKDOWN (TRANSPARENT FORMULA)</span>
              <span>WEIGHTED COMPOSITE</span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-cine-surface p-1.5 rounded border border-cine-border/60">
                <div className="text-[10px] text-cine-muted">Momentum</div>
                <div className="font-mono font-semibold text-cyan-400">
                  {scores.momentum}
                </div>
                <div className="text-[9px] text-cine-muted/60">20% wt</div>
              </div>

              <div className="bg-cine-surface p-1.5 rounded border border-cine-border/60">
                <div className="text-[10px] text-cine-muted">Audience Fit</div>
                <div className="font-mono font-semibold text-emerald-400">
                  {scores.audience_fit}
                </div>
                <div className="text-[9px] text-cine-muted/60">25% wt</div>
              </div>

              <div className="bg-cine-surface p-1.5 rounded border border-cine-border/60">
                <div className="text-[10px] text-cine-muted">Creator Fit</div>
                <div className="font-mono font-semibold text-indigo-400">
                  {scores.creator_fit}
                </div>
                <div className="text-[9px] text-cine-muted/60">25% wt</div>
              </div>

              <div className="bg-cine-surface p-1.5 rounded border border-cine-border/60">
                <div className="text-[10px] text-cine-muted">Opportunity</div>
                <div className="font-mono font-semibold text-amber-400">
                  {scores.content_opportunity}
                </div>
                <div className="text-[9px] text-cine-muted/60">20% wt</div>
              </div>

              <div className="bg-cine-surface p-1.5 rounded border border-cine-border/60">
                <div className="text-[10px] text-cine-muted">Urgency</div>
                <div className="font-mono font-semibold text-rose-400">
                  {scores.urgency}
                </div>
                <div className="text-[9px] text-cine-muted/60">10% wt</div>
              </div>
            </div>
          </div>

          {/* Strategic Reason: Why It Matters */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-cine-text flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Why This Works Right Now</span>
            </div>
            <p className="text-xs text-cine-muted leading-relaxed bg-cine-card/50 p-2.5 rounded-lg border border-cine-border/50">
              {opportunity.why_it_matters}
            </p>
          </div>

          {/* Angle Variations */}
          {opportunity.angle_ideas && opportunity.angle_ideas.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-cine-text flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Creative Angles / Twists</span>
              </div>
              <ul className="text-xs text-cine-muted space-y-1 pl-4 list-disc marker:text-indigo-500">
                {opportunity.angle_ideas.map((angle, i) => (
                  <li key={i}>{angle}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Hooks in Target Language */}
          {opportunity.recommended_hooks &&
            opportunity.recommended_hooks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-cine-text">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>0–3s Opening Hooks ({opportunity.language})</span>
                  </span>
                  {opportunity.recommended_hooks.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowAllHooks(!showAllHooks)}
                      className="text-[11px] text-indigo-400 hover:underline font-normal"
                    >
                      {showAllHooks ? "Show Less" : "View All Hooks"}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(showAllHooks
                    ? opportunity.recommended_hooks
                    : opportunity.recommended_hooks.slice(0, 2)
                  ).map((hook, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start justify-between gap-2 p-2 rounded-lg bg-cine-card border border-cine-border/70 hover:border-indigo-500/40 text-xs transition-colors"
                    >
                      <p className="text-cine-text italic flex-1 leading-snug">
                        "{hook}"
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyHook(hook, idx)}
                        className="text-cine-muted hover:text-cine-text p-1 shrink-0 transition-colors"
                        title="Copy hook to clipboard"
                      >
                        {copiedHookIndex === idx ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Talking Points & Suggested CTA */}
          {opportunity.talking_points &&
            opportunity.talking_points.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-cine-text flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Script Beats & Talking Points</span>
                </div>
                <div className="text-xs text-cine-muted bg-cine-card/40 p-2 rounded-lg border border-cine-border/40 space-y-0.5">
                  {opportunity.talking_points.map((pt, i) => (
                    <div key={i}>{pt}</div>
                  ))}
                  {opportunity.recommended_cta && (
                    <div className="pt-1 text-[11px] text-indigo-300 font-medium border-t border-cine-border/40 mt-1">
                      CTA: {opportunity.recommended_cta}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Transparent Source Attribution */}
          <div className="flex items-center justify-between text-[10px] text-cine-muted/80 pt-1 border-t border-cine-border/40">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>{opportunity.source.label}</span>
            </span>
            <span className="font-mono text-cine-muted/60">
              No fake metrics • Pattern engine
            </span>
          </div>
        </CardContent>
      </div>

      {/* Action Footer: Handoffs to Hooks, Scripts, Calendar */}
      <div className="p-4 pt-2 border-t border-cine-border/60 bg-cine-surface/60 rounded-b-xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Generate Hooks Handoff */}
          <Button
            onClick={handleHandoffToHooks}
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate Hooks</span>
          </Button>

          {/* Create Script Handoff */}
          <Button
            onClick={handleHandoffToScript}
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Create Script</span>
          </Button>
        </div>

        {/* Add to Calendar Action */}
        <Button
          onClick={handleAddToCalendar}
          disabled={isAddingToCalendar || calendarAdded}
          variant={calendarAdded ? "primary" : "outline"}
          size="sm"
          className="text-xs flex items-center gap-1.5"
        >
          {calendarAdded ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Added to Calendar</span>
            </>
          ) : isAddingToCalendar ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Schedule to Calendar</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
