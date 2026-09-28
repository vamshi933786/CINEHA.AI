"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-cine-bg text-cine-text flex flex-col antialiased selection:bg-cine-accent selection:text-white">
      {/* Accessible Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-cine-accent focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <Header onMenuToggle={() => setMobileNavOpen(true)} />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* App Body (Sidebar + Main Content) */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col justify-between"
        >
          <div className="w-full space-y-8">{children}</div>

          {/* App Shell Footer */}
          <footer className="mt-12 pt-6 border-t border-cine-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cine-muted font-mono">
            <div>
              CINEHA AI · Your Intelligent Content Creation Assistant
            </div>
            <div>
              Connected to Cinehashoots · Created for Sai Panga
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
