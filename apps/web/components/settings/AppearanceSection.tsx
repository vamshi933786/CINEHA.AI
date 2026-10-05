"use client";

import React from "react";
import { Monitor, Moon, Sun, Zap, Sliders, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AppearanceSettings, ThemeMode, InterfaceDensity } from "@/types/settings";

export interface AppearanceSectionProps {
  settings: AppearanceSettings;
  onChange: (updates: Partial<AppearanceSettings>) => void;
}

export function AppearanceSection({ settings, onChange }: AppearanceSectionProps) {
  const themes: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "dark",
      label: "Cinema Dark",
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      desc: "Default obsidian slate palette optimized for creator studios & video editing",
    },
    {
      id: "system",
      label: "System Sync",
      icon: <Monitor className="w-5 h-5 text-slate-400" />,
      desc: "Automatically adapts to your operating system appearance preference",
    },
    {
      id: "light",
      label: "Clean Light",
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      desc: "High-contrast day mode with neutral light surface backgrounds",
    },
  ];

  const densities: { id: InterfaceDensity; label: string; desc: string }[] = [
    {
      id: "comfortable",
      label: "Comfortable",
      desc: "Standard generous spacing with roomy touch targets and clear layout breathing room.",
    },
    {
      id: "compact",
      label: "Compact",
      desc: "Higher data density with trimmed padding for high-speed desktop workflows.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Studio Theme</CardTitle>
            <Badge variant="accent" size="sm">Workspace</Badge>
          </div>
          <CardDescription>
            Choose your preferred color mode for the CINEHAI AI creator interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((theme) => {
              const isSelected = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onChange({ theme: theme.id })}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 relative ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10 shadow-sm shadow-cine-accent/10"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-cine-border/40">
                      {theme.icon}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cine-accent flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-white text-sm">{theme.label}</span>
                  <span className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {theme.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reduced Motion Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Accessibility & Motion</CardTitle>
            <Badge variant={settings.reducedMotion ? "amber" : "neutral"} size="sm">
              {settings.reducedMotion ? "Motion Dampened" : "Full Graphics"}
            </Badge>
          </div>
          <CardDescription>
            Configure animations, motion caption cues, and 3D visual transitions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-cine-border">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Reduced Motion Mode</h4>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
                  Suppresses rapid kinetic caption pops, heavy spring animations, and smooths 3D workflow canvas rendering for motion sensitivity.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-auto">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onChange({ reducedMotion: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle reduced motion"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Interface Density */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interface Density</CardTitle>
            <Badge variant="neutral" size="sm">Layout</Badge>
          </div>
          <CardDescription>
            Adjust the vertical padding and element compactness across tables and sidebars.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {densities.map((item) => {
              const isSelected = settings.density === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ density: item.id })}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 relative ${
                    isSelected
                      ? "border-cine-accent bg-cine-accent/10"
                      : "border-cine-border bg-cine-surface/60 hover:bg-cine-surface"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-medium text-white text-sm">{item.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cine-accent flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
