import React from "react";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";

export default function SettingsPage() {
  return (
    <FeaturePlaceholder
      title="Settings & Workspace"
      description="API configuration, model selection, rate limit guards, and workspace preferences."
      phase="System"
      moduleNumber={1}
      breadcrumbs={[{ label: "Settings" }]}
      plannedFeatures={[
        "AI Provider selector (Google Gemini, OpenAI, Heuristic Offline Mock)",
        "API key management with secure masked storage",
        "Video processing guardrail indicators (100 MB upload limit)",
        "Theme & accessibility controls (reduced-motion override)",
        "Data export and workspace reset tools",
      ]}
      architecturalNotes="All sensitive keys remain strictly server-side in apps/api/.env. Frontend only accesses public settings and telemetry via typed contracts."
    />
  );
}
