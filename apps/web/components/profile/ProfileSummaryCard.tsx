"use client";

import React from "react";
import type { CreatorProfile } from "@/types/creatorProfile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  User,
  Film,
  Target,
  Globe,
  Radio,
  Sparkles,
  Edit3,
  Calendar,
  Layers,
} from "lucide-react";

interface ProfileSummaryCardProps {
  profile: CreatorProfile;
  onEdit: () => void;
}

export function ProfileSummaryCard({ profile, onEdit }: ProfileSummaryCardProps) {
  const updatedDate = profile.updated_at
    ? new Date(profile.updated_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <Card className="border-cine-accent/40 bg-gradient-to-br from-cine-surface via-cine-card to-cine-surface shadow-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cine-border/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cine-accent to-cine-rose flex items-center justify-center text-white text-lg font-bold shadow-md shadow-cine-accent/20">
            {profile.creator_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-white">
                {profile.creator_name}
              </CardTitle>
              <Badge variant="accent" size="sm">
                Active Persona
              </Badge>
            </div>
            <CardDescription className="text-xs text-cine-muted mt-0.5">
              {profile.niche} · Primary Language:{" "}
              <span className="text-slate-200 font-medium font-mono">
                {profile.primary_language}
              </span>
            </CardDescription>
          </div>
        </div>

        <Button
          onClick={onEdit}
          variant="secondary"
          size="sm"
          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto"
        >
          Edit Profile
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Bio */}
        {profile.creator_bio && (
          <div className="p-3.5 rounded-lg bg-cine-bg/60 border border-cine-border/50 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            "{profile.creator_bio}"
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Audience */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-cine-accent" />
              Target Audience
            </div>
            <p className="text-xs sm:text-sm text-slate-300 p-3 rounded-lg bg-cine-bg/40 border border-cine-border/40">
              {profile.target_audience || "No specific target audience entered."}
            </p>
          </div>

          {/* Distribution Platforms */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-cine-emerald" />
              Distribution Channels
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-cine-bg/40 border border-cine-border/40 min-h-[46px] items-center">
              {profile.platforms.map((plat) => (
                <Badge key={plat} variant="emerald" size="sm">
                  {plat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Tone */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-cine-rose" />
              Communication Tones
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-cine-bg/40 border border-cine-border/40 min-h-[46px] items-center">
              {profile.content_tones.map((tone) => (
                <Badge key={tone} variant="rose" size="sm">
                  {tone}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Goals */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Content Creation Goals
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-cine-bg/40 border border-cine-border/40 min-h-[46px] items-center">
              {profile.content_goals.map((goal) => (
                <Badge key={goal} variant="amber" size="sm">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-cine-border/40 flex flex-wrap items-center justify-between gap-3 text-xs text-cine-muted font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last Synced: {updatedDate}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Layers className="w-3 h-3 text-cine-accent" />
            Persisted in SQLAlchemy Database
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
