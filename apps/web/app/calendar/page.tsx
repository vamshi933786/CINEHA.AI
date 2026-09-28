import React from "react";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";

export default function CalendarPage() {
  return (
    <FeaturePlaceholder
      title="Content Calendar & Planner"
      description="Visual schedule and Kanban lifecycle management tracking content from ideation to published video."
      phase="Phase 12"
      moduleNumber={9}
      breadcrumbs={[{ label: "Content Calendar" }]}
      plannedFeatures={[
        "Monthly calendar grid & weekly execution view",
        "Kanban stages: Idea → Researching → Scripted → Recording → Editing → Scheduled → Published",
        "Direct bidirectional link between calendar cards and generated script IDs",
        "Drag-and-drop scheduling with publishing date reminders",
        "Platform filtering (Instagram Reels, YouTube Shorts, TikTok)",
        "Persistent storage in database via REST API",
      ]}
      architecturalNotes="Relational content item tracking linking creator profiles, scripts, and target release windows without automatic unverified posting."
    />
  );
}
