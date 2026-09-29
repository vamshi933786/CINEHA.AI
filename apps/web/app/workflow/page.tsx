"use client";

import React, { Suspense } from "react";
import { Network, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { WorkflowWorkspace } from "@/components/three";

export default function WorkflowPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="3D Workflow Visualization"
        description="Interactive multi-agent orchestration architecture. Visualizes data flow, agent handoffs, input/output contracts, and diagnostic states across the short-form content generation pipeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Script Studio", href: "/scripts" },
          { label: "3D Workflow" },
        ]}
        badge={
          <Badge variant="accent" size="sm">
            Phase 8: Multi-Agent Pipeline
          </Badge>
        }
      />

      {/* Main Workflow Workspace */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Loading 3D Workflow Pipeline...</span>
          </div>
        }
      >
        <WorkflowWorkspace />
      </Suspense>
    </div>
  );
}
