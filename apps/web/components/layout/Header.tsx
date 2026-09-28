"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Sparkles, User, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { HealthResponse } from "@/types/api";
import { HealthStatusBadge } from "@/components/ui/HealthStatusBadge";

export interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.checkHealth().then((data) => {
      if (mounted) {
        setHealth(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-cine-bg/95 backdrop-blur-md border-b border-cine-border/70 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          type="button"
          aria-label="Open mobile navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cine-card border border-cine-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cine-accent via-indigo-600 to-cine-rose flex items-center justify-center text-white shadow-md shadow-cine-accent/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                CINEHA<span className="text-cine-accent">.AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-cine-accent/20 text-indigo-300 font-mono border border-cine-accent/30">
                v1.0
              </span>
            </div>
            <span className="hidden md:inline-block text-[10px] text-cine-muted font-normal -mt-0.5">
              Your Intelligent Content Creation Assistant
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Heartbeat telemetry and Profile badge */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Heartbeat Badge */}
        <div className="hidden sm:block">
          <HealthStatusBadge health={health} loading={loading} />
        </div>

        {/* Small live dot for mobile only */}
        <div className="sm:hidden flex items-center">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              health?.status === "healthy"
                ? "bg-cine-emerald animate-pulse"
                : "bg-cine-amber"
            }`}
            title={`Backend: ${health?.status || "connecting"}`}
          />
        </div>

        {/* Creator profile avatar button */}
        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-cine-card hover:bg-cine-surface border border-cine-border hover:border-cine-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent min-h-[38px]"
          title="Creator Profile (Sai Panga)"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            SP
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-200">
            Sai Panga
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-cine-accent hidden md:inline-block" />
        </Link>
      </div>
    </header>
  );
}
