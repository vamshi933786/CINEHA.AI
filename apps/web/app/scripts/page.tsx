"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ScriptWorkspace } from "@/components/scripts";
import { Film, Sparkles } from "lucide-react";

function ScriptStudioContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const initialHook = searchParams.get("hook") || "";
  const initialPlatform = searchParams.get("platform") || "Instagram Reels";
  const initialLanguage = searchParams.get("language") || "English";
  const scriptId = searchParams.get("id") || searchParams.get("script_id") || undefined;

  return (
    <ScriptWorkspace
      initialTopic={initialTopic}
      initialHook={initialHook}
      initialPlatform={initialPlatform}
      initialLanguage={initialLanguage}
      initialScriptId={scriptId}
    />
  );
}

export default function ScriptsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="AI Script Studio"
        description="Convert your concept into a complete short-form screenplay with time-coded voiceovers, visual direction, B-roll framing, and sound design."
        breadcrumbs={[{ label: "Script Studio" }]}
        badge={
          <Badge variant="accent" size="md">
            <Film className="w-3.5 h-3.5 mr-1" />
            Screenplay Studio
          </Badge>
        }
      />

      {/* Main Studio Workspace wrapped in Suspense for search params */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading Script Studio Workspace...</span>
          </div>
        }
      >
        <ScriptStudioContent />
      </Suspense>
    </div>
  );
}
