"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import type { HealthResponse } from "@/types/api";
import { HealthStatusBadge } from "@/components/ui/HealthStatusBadge";
import {
  Server,
  Database,
  Layers,
  Video,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Code2,
  Cpu,
  Smartphone,
} from "lucide-react";

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const data = await api.checkHealth();
    setHealth(data);
    setLoading(false);
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <main className="min-h-screen bg-cine-bg text-cine-text flex flex-col justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cine-rose/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-cine-border/60">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-tr from-cine-accent to-cine-rose inline-block" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CINEHA AI
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cine-accent/20 text-indigo-300 font-mono border border-cine-accent/30">
              v1.0.0
            </span>
          </div>
          <p className="text-sm text-cine-muted mt-1">
            Your Intelligent Content Creation Assistant · Cinehashoots
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HealthStatusBadge health={health} loading={loading} />
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cine-card hover:bg-cine-border/50 border border-cine-border text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh health check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </header>

      {/* Main Status Section */}
      <section className="max-w-6xl mx-auto w-full py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cine-card border border-cine-border text-xs text-cine-accent font-semibold uppercase tracking-wider mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-cine-emerald" />
            Phase 2: Scaffolding & Setup Verified
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Full-Stack Scaffolding Active
          </h2>
          <p className="text-sm sm:text-base text-cine-muted">
            Next.js 14 frontend and FastAPI backend are scaffolded, connected, and communicating via typed contracts.
          </p>
        </div>

        {/* 4 Architecture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Frontend */}
          <div className="p-5 rounded-xl bg-cine-surface/80 border border-cine-border hover:border-cine-accent/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cine-accent/15 border border-cine-accent/30 flex items-center justify-center text-cine-accent mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Next.js 14 Frontend</h3>
              <p className="text-xs text-cine-muted mt-1 leading-relaxed">
                App Router, React 18, strict TypeScript, Tailwind CSS with cinema dark theme.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-cine-border/50 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Port: 3000</span>
              <span className="text-cine-emerald flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cine-emerald" /> Running
              </span>
            </div>
          </div>

          {/* Card 2: Backend */}
          <div className="p-5 rounded-xl bg-cine-surface/80 border border-cine-border hover:border-cine-accent/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-cine-emerald mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">FastAPI Backend</h3>
              <p className="text-xs text-cine-muted mt-1 leading-relaxed">
                Pydantic v2 schemas, CORS middleware, async route handling, and health telemetry.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-cine-border/50 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Port: 8000</span>
              <span
                className={`flex items-center gap-1 ${
                  health?.status === "healthy" ? "text-cine-emerald" : "text-cine-amber"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    health?.status === "healthy" ? "bg-cine-emerald" : "bg-cine-amber"
                  }`}
                />
                {health?.status === "healthy" ? "Connected" : "Pending"}
              </span>
            </div>
          </div>

          {/* Card 3: Database */}
          <div className="p-5 rounded-xl bg-cine-surface/80 border border-cine-border hover:border-cine-accent/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">SQLAlchemy 2.0 ORM</h3>
              <p className="text-xs text-cine-muted mt-1 leading-relaxed">
                Async engine with declarative models, migrations, and SQLite/PostgreSQL compatibility.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-cine-border/50 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>SQLite Async</span>
              <span className="text-cine-emerald flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cine-emerald" /> {health?.database || "Ready"}
              </span>
            </div>
          </div>

          {/* Card 4: Video Guardrails */}
          <div className="p-5 rounded-xl bg-cine-surface/80 border border-cine-border hover:border-cine-accent/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-cine-rose mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Video Guardrails</h3>
              <p className="text-xs text-cine-muted mt-1 leading-relaxed">
                Enforced 100 MB upload limit via <code>MAX_VIDEO_SIZE_MB=100</code> for MP4, MOV, WEBM.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-cine-border/50 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Max: 100 MB</span>
              <span className="text-cine-emerald flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cine-emerald" /> Configured
              </span>
            </div>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="mt-8 p-6 rounded-xl bg-cine-card/70 border border-cine-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cine-accent" />
              <h4 className="text-sm font-semibold text-white">Live Heartbeat Telemetry</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-cine-muted">
              <span>Endpoint: {API_BASE_URL}/health</span>
              {lastChecked && <span>Updated: {lastChecked}</span>}
            </div>
          </div>

          <pre className="p-4 rounded-lg bg-black/50 border border-cine-border/60 text-xs font-mono text-emerald-400 overflow-x-auto">
            {JSON.stringify(
              health || {
                status: "connecting",
                message: "Awaiting heartbeat from http://localhost:8000/api/v1/health...",
              },
              null,
              2
            )}
          </pre>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-cine-muted pt-3 border-t border-cine-border/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Responsive: Mobile · Tablet · Laptop · Desktop
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                Active Provider: {health?.active_provider || "heuristic_mock"}
              </span>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cine-accent hover:underline"
            >
              Open Interactive Swagger Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 border-t border-cine-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cine-muted font-mono">
        <div>CINEHA AI · Phase 2 Scaffolding & Setup Verified</div>
        <div>Owner: Sai Panga · Cinehashoots Ecosystem</div>
      </footer>
    </main>
  );
}
