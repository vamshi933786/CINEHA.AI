import React from "react";
import {
  FileText,
  Sparkles,
  Video,
  GitCompare,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function RecentActivity() {
  const activities = [
    {
      id: "act_1",
      type: "script_generated",
      title: "3 Golden Rules for Smooth Gimbal Movements",
      subtitle: "Instagram Reels · 45s · Telugu + English",
      time: "2 hours ago",
      icon: FileText,
      iconColor: "text-cine-accent",
      badge: "Scripted",
      badgeVariant: "accent" as const,
    },
    {
      id: "act_2",
      type: "hook_created",
      title: "Bedside Lamp Lighting Hack for Creators",
      subtitle: "9 Taxonomies generated (Curiosity, Contrarian, Problem-Solution)",
      time: "5 hours ago",
      icon: Sparkles,
      iconColor: "text-indigo-400",
      badge: "Hooks Ready",
      badgeVariant: "default" as const,
    },
    {
      id: "act_3",
      type: "video_analyzed",
      title: "cinematic_street_walk_rough.mp4",
      subtitle: "1080x1920 (9:16) · 32.4s · Score: 92/100 · 100MB Guardrail Verified",
      time: "Yesterday",
      icon: Video,
      iconColor: "text-cine-rose",
      badge: "Video Audited",
      badgeVariant: "rose" as const,
    },
    {
      id: "act_4",
      type: "script_optimized",
      title: "Mobile Filmmaking for Absolute Beginners",
      subtitle: "Diff applied: Hook tightened (-4 words), CTA revised",
      time: "2 days ago",
      icon: GitCompare,
      iconColor: "text-cine-emerald",
      badge: "Optimized",
      badgeVariant: "emerald" as const,
    },
  ];

  return (
    <section className="p-5 sm:p-6 rounded-xl bg-cine-surface/90 border border-cine-border/70">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-cine-border/40">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
            Recent Creator Activity
          </h3>
          <p className="text-xs text-cine-muted mt-0.5">
            Audit trail of generated scripts, hooks, and analyzed media
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            Prototype Feed
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono">Demo Data</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className="p-3.5 sm:p-4 rounded-lg bg-cine-card/70 border border-cine-border/50 hover:border-cine-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cine-surface border border-cine-border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Icon className={`w-4 h-4 ${act.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white line-clamp-1">
                    {act.title}
                  </h4>
                  <p className="text-xs text-cine-muted mt-0.5 line-clamp-1">
                    {act.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-cine-border/30">
                <Badge variant={act.badgeVariant} size="sm">
                  {act.badge}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{act.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
