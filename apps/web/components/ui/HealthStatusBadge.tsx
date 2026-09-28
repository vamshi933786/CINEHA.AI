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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Checking system heartbeat...
      </div>
    );
  }

  const isHealthy = health?.status === "healthy";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
        isHealthy
          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          : "bg-rose-950/40 border-rose-500/40 text-rose-300"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isHealthy ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
        }`}
      />
      <span>
        API: {health?.status?.toUpperCase()} | DB: {health?.database} | LIMIT:{" "}
        {health?.max_video_size_mb}MB
      </span>
    </div>
  );
}
