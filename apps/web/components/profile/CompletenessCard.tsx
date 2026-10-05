"use client";

import React, { useState } from "react";
import type { ProfileCompleteness } from "@/types/creatorProfile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

interface CompletenessCardProps {
  completeness: ProfileCompleteness;
  className?: string;
}

export function CompletenessCard({
  completeness,
  className = "",
}: CompletenessCardProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const score = Math.min(100, Math.max(0, completeness.score));

  // Determine variant styling based on score
  const getScoreColor = () => {
    if (score >= 80) return "text-cine-emerald";
    if (score >= 40) return "text-cine-amber";
    return "text-cine-rose";
  };

  const getProgressBarColor = () => {
    if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (score >= 40) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    return "bg-gradient-to-r from-rose-500 to-orange-400";
  };

  const getScoreBadge = () => {
    if (score >= 80)
      return (
        <Badge variant="emerald" size="sm">
          <Award className="w-3 h-3 mr-1" />
          AI-Optimized
        </Badge>
      );
    if (score >= 40)
      return (
        <Badge variant="amber" size="sm">
          Good Foundation
        </Badge>
      );
    return (
      <Badge variant="rose" size="sm">
        Needs Information
      </Badge>
    );
  };

  return (
    <Card
      className={`border-cine-border/70 bg-gradient-to-b from-cine-card to-cine-surface shadow-lg ${className}`}
      data-testid="profile-completeness-card"
    >
      <CardHeader className="pb-3 border-b border-cine-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cine-accent" />
            <CardTitle className="text-sm font-semibold text-white">
              Profile Completeness
            </CardTitle>
          </div>
          {getScoreBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Score & Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${getScoreColor()}`}>
                {score}%
              </span>
              <span className="text-xs text-slate-400">persona readiness</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {completeness.categories.filter((c) => c.completed).length}/
              {completeness.categories.length} sections
            </span>
          </div>

          <div
            className="w-full h-2 rounded-full bg-cine-bg overflow-hidden border border-cine-border/30"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile Completeness Progress"
          >
            <div
              className={`h-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Categories Checklist */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Scoring Breakdown
            </span>
            <button
              type="button"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-[11px] text-cine-accent hover:underline flex items-center gap-0.5 focus:outline-none"
            >
              {showAllCategories ? "Collapse" : "View All"}
              {showAllCategories ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            {(showAllCategories
              ? completeness.categories
              : completeness.categories.slice(0, 4)
            ).map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-1.5 rounded-md bg-cine-bg/50 border border-cine-border/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {cat.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cine-emerald shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      cat.completed
                        ? "text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {cat.category}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 pl-2">
                  +{cat.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations */}
        {completeness.recommendations.length > 0 ? (
          <div className="pt-2 border-t border-cine-border/40 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-400">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>Recommended Next Steps</span>
            </div>
            <ul className="space-y-1.5">
              {completeness.recommendations.slice(0, 3).map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-slate-300 leading-tight bg-amber-950/20 border border-amber-500/20 rounded p-1.5"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pt-2 border-t border-cine-border/40 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded p-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cine-emerald" />
            <span>Persona complete! All AI generation engines will use your full creator guidance.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
