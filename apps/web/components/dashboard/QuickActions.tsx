import React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  BarChart2,
  Video,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function QuickActions() {
  const actions = [
    {
      title: "Create Script",
      description: "Generate original 2-column short-form scripts with voiceover and visual choreography.",
      href: "/scripts",
      icon: FileText,
      color: "text-cine-accent",
      borderGlow: "hover:border-cine-accent/50",
      badge: "Phase 6",
    },
    {
      title: "Generate Hooks",
      description: "Craft high-retention 0–3 second opening hooks across 9 proven psychological categories.",
      href: "/hooks",
      icon: Sparkles,
      color: "text-indigo-400",
      borderGlow: "hover:border-indigo-500/50",
      badge: "Phase 5",
    },
    {
      title: "Analyze Script",
      description: "Audit pacing, repetition, drop-off beats, and hook velocity with transparent scores.",
      href: "/analyzer",
      icon: BarChart2,
      color: "text-cine-emerald",
      borderGlow: "hover:border-emerald-500/50",
      badge: "Phase 7",
    },
    {
      title: "Analyze Video",
      description: "Upload MP4/MOV/WEBM up to 100MB or public URLs for dual audit and Video → Script reconstruction.",
      href: "/video-analysis",
      icon: Video,
      color: "text-cine-rose",
      borderGlow: "hover:border-pink-500/50",
      badge: "100 MB Limit",
    },
    {
      title: "Research Trends",
      description: "Synthesize niche patterns, viral formats, and verified citations without hallucinated metrics.",
      href: "/research",
      icon: TrendingUp,
      color: "text-amber-400",
      borderGlow: "hover:border-amber-500/50",
      badge: "Phase 10",
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
            Quick Studio Actions
          </h3>
          <p className="text-xs text-cine-muted mt-0.5">
            Launch directly into specialized creator workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`p-5 rounded-xl bg-cine-surface/90 border border-cine-border/70 ${action.borderGlow} transition-all duration-200 flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cine-card border border-cine-border flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <Badge variant="outline" size="sm">
                    {action.badge}
                  </Badge>
                </div>

                <h4 className="font-semibold text-white text-base group-hover:text-cine-accent transition-colors flex items-center gap-1.5">
                  {action.title}
                </h4>

                <p className="text-xs text-cine-muted mt-1.5 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-cine-border/40 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                <span>Launch Workflow</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
