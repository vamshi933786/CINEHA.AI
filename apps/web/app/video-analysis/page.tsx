"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { VideoAnalysisWorkspace } from "@/components/video-analysis";

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
      <VideoAnalysisWorkspace />
    </div>
  );
}
