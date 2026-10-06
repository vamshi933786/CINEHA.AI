"use client";

import React from "react";
import Link from "next/link";
import { Plus, Video, Sparkles, Instagram, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function WelcomeHeader() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cine-surface via-cine-card to-cine-surface border border-cine-border/80 p-6 sm:p-8 lg:p-10 shadow-xl">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-cine-rose/10 rounded-full blur-2xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Short-Form Creator Studio
            </Badge>
            <div className="flex items-center gap-1.5 text-[11px] text-cine-muted font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cine-border" />
              <span>Instagram Reels</span>
              <span className="text-cine-muted">·</span>
              <span>TikTok</span>
              <span className="text-cine-muted">·</span>
              <span>YouTube Shorts</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-cine-text">
            Good morning, Creator
          </h2>

          <p className="text-sm sm:text-base text-cine-muted leading-relaxed">
            Turn ideas, trends and videos into high-retention short-form content with multi-agent intelligence and two-column screenplays.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link href="/scripts">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Create New Script
            </Button>
          </Link>

          <Link href="/video-analysis">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Video className="w-4 h-4 text-cine-rose" />}
              className="w-full sm:w-auto"
            >
              Analyze Video
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
