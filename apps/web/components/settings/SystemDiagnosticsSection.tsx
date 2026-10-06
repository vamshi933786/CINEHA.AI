"use client";

import React, { useState } from "react";
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  Cloud,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SystemDiagnosticsReport } from "@/types/settings";

export interface SystemDiagnosticsSectionProps {
  report: SystemDiagnosticsReport | null;
  onRunDiagnostics: () => Promise<void>;
  isLoading?: boolean;
}

export function SystemDiagnosticsSection({
  report,
  onRunDiagnostics,
  isLoading = false,
}: SystemDiagnosticsSectionProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  const apiStatus = report?.apiStatus || "healthy";
  const isHealthy = apiStatus === "healthy";

  return (
    <div className="space-y-6">
      {/* Diagnostics Control Header */}
      <Card className="border-cine-border bg-cine-surface/90">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isHealthy
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-cine-text">System Diagnostics</h3>
                <Badge
                  variant={isHealthy ? "emerald" : "amber"}
                  size="sm"
                >
                  {isHealthy ? "Operational" : apiStatus}
                </Badge>
              </div>
              <p className="text-xs text-cine-muted mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cine-muted" />
                Last inspected: {report?.lastChecked || "Just now"}
                {report?.latencyMs !== undefined && (
                  <span className="font-mono text-cine-accent dark:text-indigo-300">
                    ({report.latencyMs}ms latency)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onRunDiagnostics}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
            >
              {isLoading ? "Inspecting..." : "Run Diagnostics"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* API Server Card */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <Server className="w-4 h-4 text-indigo-400" />
                FastAPI Backend
              </div>
              <Badge variant={isHealthy ? "emerald" : "rose"} size="sm">
                {isHealthy ? "Online" : "Unreachable"}
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight">
              {report?.version ? `v${report.version}` : "v1.0.0"}
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Environment:</span>
              <span className="font-mono text-cine-accent dark:text-indigo-300 capitalize">
                {report?.environment || "development"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Database Connectivity */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <Database className="w-4 h-4 text-emerald-400" />
                SQLite Database
              </div>
              <Badge
                variant={report?.databaseStatus === "connected" ? "emerald" : "rose"}
                size="sm"
              >
                {report?.databaseStatus === "connected" ? "Connected" : "Error"}
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight">
              aiosqlite Async
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Pool State:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-300">Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Gemini Engine */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Google Gemini
              </div>
              <Badge
                variant={report?.geminiConfigured ? "emerald" : "amber"}
                size="sm"
              >
                {report?.geminiConfigured ? "Configured" : "Missing Key"}
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight truncate">
              {report?.geminiModel || "gemini-3.5-flash-lite"}
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Provider:</span>
              <span className="font-mono text-cine-accent dark:text-indigo-300">GeminiLLMProvider</span>
            </div>
          </CardContent>
        </Card>

        {/* Local Whisper */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                Local Whisper
              </div>
              <Badge
                variant={report?.localWhisperAvailable ? "emerald" : "neutral"}
                size="sm"
              >
                {report?.localWhisperAvailable ? "Available" : "Standby"}
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight">
              model: {report?.localWhisperModel || "base"}
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Acceleration:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-300">Apple Silicon / CPU</span>
            </div>
          </CardContent>
        </Card>

        {/* OpenAI Whisper Cloud */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <Cloud className="w-4 h-4 text-sky-400" />
                OpenAI Whisper
              </div>
              <Badge
                variant={report?.openaiWhisperConfigured ? "emerald" : "neutral"}
                size="sm"
              >
                {report?.openaiWhisperConfigured ? "Configured" : "Standby"}
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight">
              whisper-1 Cloud
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Role:</span>
              <span className="font-mono text-cine-muted">Cloud Fallback</span>
            </div>
          </CardContent>
        </Card>

        {/* Video Guardrail */}
        <Card className="border-cine-border bg-cine-surface/70">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cine-muted text-xs font-medium">
                <Activity className="w-4 h-4 text-indigo-400" />
                Video Ingestion Cap
              </div>
              <Badge variant="accent" size="sm">
                Strict Limit
              </Badge>
            </div>
            <div className="text-lg font-bold text-cine-text tracking-tight">
              {report?.maxVideoSizeMb || 100} MB
            </div>
            <div className="text-xs text-cine-muted flex items-center justify-between">
              <span>Streaming Pipe:</span>
              <span className="font-mono text-cine-accent dark:text-indigo-300">FFmpeg Multi-codec</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer Raw JSON Inspector */}
      <Card className="border-cine-border bg-cine-surface/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cine-muted" />
              <CardTitle className="text-sm">Sanitized Diagnostic Telemetry</CardTitle>
            </div>
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs text-cine-accent dark:text-indigo-300 hover:underline font-mono"
            >
              {showRawJson ? "Hide Telemetry" : "View JSON Payload"}
            </button>
          </div>
        </CardHeader>
        {showRawJson && (
          <CardContent className="pt-0">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(report, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
