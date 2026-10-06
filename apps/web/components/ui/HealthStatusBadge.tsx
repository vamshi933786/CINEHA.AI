"use client";

import React from "react";
import type { HealthResponse } from "@/types/api";

interface HealthStatusBadgeProps {
  health: HealthResponse | null;
  loading: boolean;
}

export function HealthStatusBadge({ health, loading }: HealthStatusBadgeProps) {
  if (loading) {
    return (
      <div
        data-testid="health-status-loading"
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Checking system heartbeat...
      </div>
    );
  }

  // Backend unavailable or unreachable
  if (!health || health.status === "unreachable") {
    return (
      <div
        data-testid="health-status-offline"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span>API: OFFLINE</span>
      </div>
    );
  }

  // Successfully responded and healthy
  if (health.status === "healthy") {
    return (
      <div
        data-testid="health-status-healthy"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-medium dark:font-normal shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        <span>
          API: HEALTHY | DB: {health.database || "connected"} | LIMIT:{" "}
          {health.max_video_size_mb ?? 100}MB
        </span>
      </div>
    );
  }

  // Unexpected response or degraded status
  return (
    <div
      data-testid="health-status-degraded"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
    >
      <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
      <span>API: DEGRADED</span>
    </div>
  );
}
