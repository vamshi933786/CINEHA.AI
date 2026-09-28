"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { RetentionWorkspace } from "@/components/analyzer";

function AnalyzerPageContent() {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("script_id");

  return <RetentionWorkspace initialScriptId={scriptId} />;
}

export default function RetentionAnalyzerPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Script Retention Analyzer"
        description="Comprehensive diagnostic engine evaluating 9 psychological short-form retention criteria, speech velocity, filler words, and beat-by-beat drop-off hazards."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Script Studio", href: "/scripts" },
          { label: "Retention Analyzer" },
        ]}
        badge={
          <Badge variant="accent" size="sm">
            Phase 7: Retention Diagnostics
          </Badge>
        }
      />

      {/* Main Retention Workspace wrapped in Suspense for search params */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Loading Retention Analyzer...</span>
          </div>
        }
      >
        <AnalyzerPageContent />
      </Suspense>
    </div>
  );
}
