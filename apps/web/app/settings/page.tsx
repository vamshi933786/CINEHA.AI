import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Workspace"
        description="Configure appearance themes, AI provider engines, Telugu language profiles, video aspect ratios, and Caption Studio motion defaults."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
        badge={
          <Badge variant="accent" size="sm">
            Control Center
          </Badge>
        }
      />
      <SettingsWorkspace />
    </div>
  );
}
