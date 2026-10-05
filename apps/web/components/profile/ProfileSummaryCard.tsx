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
  ShieldCheck,
  Ban,
  CheckCircle,
  MapPin,
  Clock,
  Compass,
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
    <Card
      className="border-cine-accent/40 bg-gradient-to-br from-cine-surface via-cine-card to-cine-surface shadow-xl"
      data-testid="profile-summary-card"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cine-border/50">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-cine-accent to-cine-rose flex items-center justify-center text-white text-lg font-bold shadow-md shadow-cine-accent/20">
            {profile.creator_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-white">
                {profile.creator_name}
              </CardTitle>
              {profile.display_name && (
                <span className="text-xs font-mono text-slate-400">
                  {profile.display_name}
                </span>
              )}
              <Badge variant="accent" size="sm">
                {profile.creator_type || "Creator"}
              </Badge>
              {profile.location && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {profile.location}
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-cine-muted mt-1">
              Primary Niche:{" "}
              <strong className="text-slate-200 font-medium">
                {profile.niche}
              </strong>{" "}
              · Language:{" "}
              <span className="text-cine-accent font-medium font-mono">
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
          className="self-start sm:self-auto shrink-0"
        >
          Edit Profile
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Bio & Core Motto */}
        {(profile.creator_bio || profile.core_message) && (
          <div className="space-y-2">
            {profile.creator_bio && (
              <div className="p-3.5 rounded-lg bg-cine-bg/60 border border-cine-border/50 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "{profile.creator_bio}"
              </div>
            )}
            {profile.core_message && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cine-accent/10 border border-cine-accent/30 text-xs text-cine-accent font-medium">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Motto: "{profile.core_message}"</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Domain 1: Content Identity & Pillars */}
          <div className="space-y-3 p-3.5 rounded-xl bg-cine-bg/30 border border-cine-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-cine-accent" />
              Content Vertical & Pillars
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">
                  Core Content Pillars:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.content_pillars || []).length > 0 ? (
                    profile.content_pillars?.map((pil) => (
                      <Badge key={pil} variant="accent" size="sm">
                        {pil}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">
                      No pillars specified
                    </span>
                  )}
                </div>
              </div>

              {(profile.secondary_niches || []).length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Secondary Sub-niches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.secondary_niches?.map((sn) => (
                      <span
                        key={sn}
                        className="px-2 py-0.5 rounded text-[11px] bg-cine-surface border border-cine-border text-slate-300"
                      >
                        {sn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.topics_to_avoid || []).length > 0 && (
                <div>
                  <span className="text-[11px] text-rose-400/90 flex items-center gap-1 mb-1">
                    <Ban className="w-3 h-3" />
                    Excluded Topics:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.topics_to_avoid?.map((tta) => (
                      <span
                        key={tta}
                        className="px-2 py-0.5 rounded text-[11px] bg-rose-950/40 border border-rose-500/30 text-rose-300 line-through"
                      >
                        {tta}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Domain 2: Target Audience */}
          <div className="space-y-3 p-3.5 rounded-xl bg-cine-bg/30 border border-cine-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-cine-rose" />
              Target Audience
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-slate-300 leading-relaxed">
                {profile.target_audience || "General short-form video audience"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.target_audience_age && (
                  <Badge variant="neutral" size="sm">
                    Age: {profile.target_audience_age}
                  </Badge>
                )}
                {profile.audience_sophistication && (
                  <Badge variant="neutral" size="sm">
                    Level: {profile.audience_sophistication}
                  </Badge>
                )}
              </div>

              {(profile.audience_pain_points || []).length > 0 && (
                <div>
                  <span className="text-[11px] text-amber-400/90 block mb-1">
                    Audience Struggles & Pain Points:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.audience_pain_points?.map((pp) => (
                      <span
                        key={pp}
                        className="px-2 py-0.5 rounded text-[11px] bg-amber-950/40 border border-amber-500/30 text-amber-300"
                      >
                        {pp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Domain 3: Voice & Style Matrix */}
          <div className="space-y-3 p-3.5 rounded-xl bg-cine-bg/30 border border-cine-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-pink-400" />
              Voice & Delivery Matrix
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {(profile.content_tones || []).map((tone) => (
                  <Badge key={tone} variant="rose" size="sm">
                    {tone}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-300">
                <div className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Energy:{" "}
                  <span className="text-white font-semibold">
                    {profile.energy || "High-energy"}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Humor:{" "}
                  <span className="text-white font-semibold">
                    {profile.humor || "Light"}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Style:{" "}
                  <span className="text-white font-semibold">
                    {profile.storytelling_style || "Story-driven"}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Vocab:{" "}
                  <span className="text-white font-semibold">
                    {profile.vocabulary || "Balanced"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Domain 4: Distribution & Platform Preferences */}
          <div className="space-y-3 p-3.5 rounded-xl bg-cine-bg/30 border border-cine-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-cine-emerald" />
              Distribution & Platform Settings
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {(profile.platforms || []).map((plat) => (
                  <Badge key={plat} variant="emerald" size="sm">
                    {plat}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-300">
                <span className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Aspect: {profile.preferred_aspect_ratio || "9:16"}
                </span>
                <span className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  Duration: {profile.typical_duration || "45 sec"}
                </span>
                <span className="p-1.5 rounded bg-cine-surface/50 border border-cine-border/30">
                  CTA: {profile.cta_style || "Save"}
                </span>
              </div>
              {(profile.content_goals || []).length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Goals:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.content_goals?.map((goal) => (
                      <Badge key={goal} variant="amber" size="sm">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain 5: Brand Guidance & Vocabulary */}
        {((profile.words_to_use || []).length > 0 ||
          (profile.words_to_avoid || []).length > 0 ||
          (profile.style_rules || []).length > 0) && (
          <div className="p-3.5 rounded-xl bg-cine-bg/30 border border-cine-border/40 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-cine-accent" />
              Brand Rules & Vocabulary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(profile.words_to_use || []).length > 0 && (
                <div>
                  <span className="text-[11px] text-emerald-400/90 flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3" />
                    Signature Catchphrases / Words:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.words_to_use?.map((w) => (
                      <span
                        key={w}
                        className="px-2 py-0.5 rounded text-[11px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.words_to_avoid || []).length > 0 && (
                <div>
                  <span className="text-[11px] text-rose-400/90 flex items-center gap-1 mb-1">
                    <Ban className="w-3 h-3" />
                    Banned Words & Cliches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.words_to_avoid?.map((w) => (
                      <span
                        key={w}
                        className="px-2 py-0.5 rounded text-[11px] bg-rose-950/40 border border-rose-500/30 text-rose-300"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(profile.style_rules || []).length > 0 && (
              <div className="pt-2 border-t border-cine-border/30 text-xs">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Brand Style Rules:
                </span>
                <ul className="space-y-1">
                  {profile.style_rules?.map((rule, idx) => (
                    <li
                      key={idx}
                      className="text-slate-300 text-xs flex items-center gap-1.5"
                    >
                      <span className="text-cine-accent">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-cine-border/40 flex flex-wrap items-center justify-between gap-3 text-xs text-cine-muted font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Last Synced: {updatedDate}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Layers className="w-3 h-3 text-cine-accent" />
            Persisted in SQLAlchemy SQLite
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
