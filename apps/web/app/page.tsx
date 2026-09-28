"use client";

import React, { useEffect, useState, useCallback } from "react";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import type { HealthResponse } from "@/types/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Code2, ExternalLink, RefreshCw, Smartphone, Cpu, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    const data = await api.checkHealth();
    setHealth(data);
    setLoading(false);
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Welcome Header & Primary CTAs */}
      <WelcomeHeader />

      {/* 2. Four Stat Cards (Performance Pulse) */}
      <StatsGrid />

      {/* 3. Quick Actions */}
      <QuickActions />

      {/* 4. Two-Column Split: Recent Activity & Architecture Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Columns on large): Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Right (1 Column on large): System & Backend Telemetry */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cine-accent" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                    System Telemetry
                  </CardTitle>
                </div>
                <button
                  onClick={refreshHealth}
                  disabled={loading}
                  aria-label="Refresh system telemetry"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-cine-card transition-colors disabled:opacity-50"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <CardDescription className="text-xs">
                Live backend heartbeat from {API_BASE_URL}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-cine-bg/60 border border-cine-border/40">
                  <span className="text-slate-400">FastAPI Status:</span>
                  <Badge
                    variant={health?.status === "healthy" ? "emerald" : "amber"}
                    size="sm"
                  >
                    {health?.status?.toUpperCase() || "CONNECTING"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-cine-bg/60 border border-cine-border/40">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-emerald-400 font-semibold">
                    {health?.database || "sqlite"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-cine-bg/60 border border-cine-border/40">
                  <span className="text-slate-400">Upload Limit:</span>
                  <span className="text-indigo-300 font-semibold">
                    {health?.max_video_size_mb || 100} MB
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-cine-bg/60 border border-cine-border/40">
                  <span className="text-slate-400">AI Provider:</span>
                  <span className="text-slate-200">
                    {health?.active_provider || "heuristic_mock"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-cine-border/40 flex flex-col gap-2">
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between text-xs text-cine-accent hover:text-indigo-400 font-medium p-2 rounded bg-cine-accent/10 border border-cine-accent/20 transition-colors"
                >
                  <span>Interactive Swagger Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Last check: {lastChecked || "just now"}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3 h-3 text-cine-emerald" /> Phase 3 Shell
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
