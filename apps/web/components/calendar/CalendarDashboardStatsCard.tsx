"use client";

import React from "react";
import type { CalendarDashboardStats } from "@/types/calendar";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CalendarCheck,
  Clock,
  Sparkles,
  Layers,
  BarChart,
  Instagram,
  Youtube,
  Video,
} from "lucide-react";

interface CalendarDashboardStatsCardProps {
  stats: CalendarDashboardStats;
}

export function CalendarDashboardStatsCard({
  stats,
}: CalendarDashboardStatsCardProps) {
  const platformKeys = Object.keys(stats.platform_breakdown || {});
  const pillarKeys = Object.keys(stats.pillar_coverage || {});

  return (
    <Card className="border-cine-border/60 bg-gradient-to-r from-cine-card via-cine-surface to-cine-card shadow-lg" data-testid="calendar-stats-card">
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-cine-border/40">
          {/* Stat 1: Total Items */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cine-accent" />
              Total Items
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats.total_items}
            </div>
          </div>

          {/* Stat 2: Planned */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Planned
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300">
              {stats.planned_count}
            </div>
          </div>

          {/* Stat 3: Ready to Publish */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Ready
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-teal-300">
              {stats.ready_to_publish_count}
            </div>
          </div>

          {/* Stat 4: Published */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
              Published
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300">
              {stats.published_count}
            </div>
          </div>
        </div>

        {/* Breakdown Row: Platform Mix & Pillar Coverage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
          {/* Platforms */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Video className="w-3 h-3" /> Platforms:
            </span>
            {platformKeys.length === 0 ? (
              <span className="text-slate-500 italic text-[11px]">No content scheduled</span>
            ) : (
              platformKeys.map((plat) => (
                <span
                  key={plat}
                  className="px-2 py-0.5 rounded-full bg-cine-surface border border-cine-border/50 text-[11px] text-slate-300 flex items-center gap-1 font-mono"
                >
                  {plat === "Instagram Reels" && <Instagram className="w-2.5 h-2.5 text-pink-400" />}
                  {plat === "YouTube Shorts" && <Youtube className="w-2.5 h-2.5 text-red-400" />}
                  <span>{plat}</span>
                  <span className="text-white font-semibold">({stats.platform_breakdown[plat]})</span>
                </span>
              ))
            )}
          </div>

          {/* Pillars */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
              <BarChart className="w-3 h-3" /> Pillars:
            </span>
            {pillarKeys.length === 0 ? (
              <span className="text-slate-500 italic text-[11px]">No pillars assigned</span>
            ) : (
              pillarKeys.slice(0, 4).map((pillar) => (
                <span
                  key={pillar}
                  className="px-2 py-0.5 rounded-full bg-cine-accent/10 border border-cine-accent/30 text-[11px] text-cine-accent flex items-center gap-1 font-mono"
                >
                  <span>{pillar}</span>
                  <span className="text-white font-semibold">({stats.pillar_coverage[pillar]})</span>
                </span>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
