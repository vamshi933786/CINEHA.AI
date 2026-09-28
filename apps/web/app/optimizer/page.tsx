"use client";

import React, { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { OptimizerWorkspace } from "@/components/optimizer";

export default function ScriptOptimizerPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Script Optimizer"
        description="Goal-driven screenplay optimization engine. Re-engineers hooks, purges filler phrases, balances short-form pacing cadence, and sharpens CTA conversion with full before/after diffs."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Script Studio", href: "/studio" },
          { label: "Retention Analyzer", href: "/analyzer" },
          { label: "Script Optimizer" },
        ]}
        badge={
          <Badge variant="accent" size="sm">
            Phase 7 Part B: Script Optimizer
          </Badge>
        }
      />

      {/* Main Optimizer Workspace wrapped in Suspense for search params */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Loading Script Optimizer...</span>
          </div>
        }
      >
        <OptimizerWorkspace />
      </Suspense>
    </div>
  );
}
