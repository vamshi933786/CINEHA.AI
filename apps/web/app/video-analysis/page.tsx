"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { VideoAnalysisWorkspace } from "@/components/video-analysis";
import { Sparkles } from "lucide-react";

function VideoAnalysisContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || searchParams.get("analysis_id") || undefined;

  return <VideoAnalysisWorkspace initialAnalysisId={initialId} />;
}

export default function VideoAnalysisPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <PageHeader
        title="Video Retention Analyzer"
        description="Multimodal short-form audit analyzing 10 retention criteria: hook immediacy, speech velocity, silence gaps, narrative progression, and CTA strength."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Video Analysis" },
        ]}
        badge={
          <Badge variant="accent" size="sm">
            Phase 11: Multimodal Retention Diagnostics
          </Badge>
        }
      />

      {/* Main Workspace */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading Video Retention Analyzer...</span>
          </div>
        }
      >
        <VideoAnalysisContent />
      </Suspense>
    </div>
  );
}
