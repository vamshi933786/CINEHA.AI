"use client";

import React, { Suspense } from "react";
import { Subtitles, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CaptionStudioWorkspace } from "@/components/captions";

export default function CaptionStudioPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Caption Studio"
        description="Video ingestion and high-precision speech-to-text engine. Ingests video footage up to 100 MB, validates MP4/MOV/WebM containers, extracts speech tracks, and outputs interactive timed segments and word-level cues."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Video Analysis", href: "/video-analysis" },
          { label: "Caption Studio" },
        ]}
        badge={
          <Badge variant="accent" size="sm">
            Phase 9: Caption Studio
          </Badge>
        }
      />

      {/* Main Caption Studio Workspace */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Loading Caption Studio...</span>
          </div>
        }
      >
        <CaptionStudioWorkspace />
      </Suspense>
    </div>
  );
}
