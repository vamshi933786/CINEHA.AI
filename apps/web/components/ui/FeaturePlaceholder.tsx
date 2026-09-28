import React from "react";
import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./Card";
import { ArrowLeft, Clock, Layers, ShieldCheck } from "lucide-react";

export interface FeaturePlaceholderProps {
  title: string;
  description: string;
  phase: string;
  moduleNumber: number;
  plannedFeatures: string[];
  architecturalNotes: string;
  breadcrumbs: { label: string; href?: string }[];
}

export function FeaturePlaceholder({
  title,
  description,
  phase,
  moduleNumber,
  plannedFeatures,
  architecturalNotes,
  breadcrumbs,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        badge={
          <Badge variant="accent" size="md">
            <Clock className="w-3 h-3 mr-1" />
            {phase} Planned
          </Badge>
        }
        actions={
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      <Card className="border-cine-accent/30 bg-gradient-to-br from-cine-surface via-cine-card to-cine-surface">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" size="sm">
              Module {moduleNumber}
            </Badge>
            <span className="text-xs font-mono text-cine-muted">
              Engineering Specification Active
            </span>
          </div>
          <CardTitle>Architectural Blueprint & Scope</CardTitle>
          <CardDescription>
            This module is formally scheduled for implementation in {phase}. No mock or fake functionality is active here.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cine-accent" />
              Planned Core Capabilities
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plannedFeatures.map((feat, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-cine-bg/60 border border-cine-border/50 text-xs text-slate-300 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cine-accent shrink-0 mt-1.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-cine-card/80 border border-cine-border/60 text-xs leading-relaxed text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-cine-emerald" />
              Mentor & Engineering Compliance
            </div>
            {architecturalNotes}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
