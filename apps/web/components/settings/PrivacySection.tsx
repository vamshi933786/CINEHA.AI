"use client";

import React, { useState } from "react";
import {
  Shield,
  Trash2,
  RotateCcw,
  HardDrive,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PrivacySettings } from "@/types/settings";
import { ConfirmationModal } from "./ConfirmationModal";

export interface PrivacySectionProps {
  settings: PrivacySettings;
  onChange: (updates: Partial<PrivacySettings>) => void;
  onResetAll: () => void;
  onClearPreferences: () => void;
}

export function PrivacySection({
  settings,
  onChange,
  onResetAll,
  onClearPreferences,
}: PrivacySectionProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Privacy Guarantees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <CardTitle>Data Privacy & Architecture Guarantees</CardTitle>
            </div>
            <Badge variant="emerald" size="sm">Zero Leak</Badge>
          </div>
          <CardDescription>
            How CINEHAI AI handles your video media, audio waveforms, and creator data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cine-card/60 border border-cine-border space-y-2">
              <div className="flex items-center gap-2 text-cine-text text-xs font-semibold">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                Transient Video Purge
              </div>
              <p className="text-xs text-cine-muted leading-relaxed">
                Raw video uploads are processed in memory and scratch temp paths during FFmpeg extraction. Files are automatically deleted immediately after audio separation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cine-card/60 border border-cine-border space-y-2">
              <div className="flex items-center gap-2 text-cine-text text-xs font-semibold">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                Zero Cloud Voice Retention
              </div>
              <p className="text-xs text-cine-muted leading-relaxed">
                Local Whisper operates 100% on-device on your local CPU/Apple Silicon. No raw audio waveforms or creator voices are saved to any cloud bucket or used for model training.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cine-card/60 border border-cine-border space-y-2">
              <div className="flex items-center gap-2 text-cine-text text-xs font-semibold">
                <Lock className="w-4 h-4 text-amber-400" />
                Local Client Preferences
              </div>
              <p className="text-xs text-cine-muted leading-relaxed">
                UI density, theme choices, and template defaults reside entirely inside your browser&apos;s isolated <code className="text-cine-accent dark:text-indigo-300 font-mono text-[11px]">localStorage</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Telemetry Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Storage & Local Session Controls</CardTitle>
          <CardDescription>
            Manage browser storage caching and client-side session persistence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Persist Drafts Locally */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-cine-card/60 border border-cine-border">
            <div>
              <h4 className="text-sm font-medium text-cine-text">Save Studio Drafts Locally</h4>
              <p className="text-xs text-cine-muted mt-0.5">
                Caches unfinished script drafts and caption cues in browser memory so you don&apos;t lose progress on reload.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.persistDraftsLocally}
                onChange={(e) => onChange({ persistDraftsLocally: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Save Studio Drafts Locally"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>

          {/* Local Diagnostics */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-cine-card/60 border border-cine-border">
            <div>
              <h4 className="text-sm font-medium text-cine-text">Client Performance Diagnostics</h4>
              <p className="text-xs text-cine-muted mt-0.5">
                Collects local latency timestamps during health probes to diagnose offline connectivity issues.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.localTelemetryEnabled}
                onChange={(e) => onChange({ localTelemetryEnabled: e.target.checked })}
                className="sr-only peer"
                aria-label="Toggle Client Diagnostics"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cine-accent"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone / Reset Actions */}
      <Card className="border-rose-300 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <CardTitle className="text-rose-900 dark:text-rose-200">Reset & Cache Maintenance</CardTitle>
            </div>
            <Badge variant="rose" size="sm">Workspace Reset</Badge>
          </div>
          <CardDescription className="text-rose-700 dark:text-rose-300/70">
            Revert customized workspace preferences or purge cached settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-cine-card/80 border border-cine-border">
            <div>
              <h4 className="text-sm font-semibold text-cine-text">Reset Settings to Factory Defaults</h4>
              <p className="text-xs text-cine-muted mt-1 max-w-lg leading-relaxed">
                Reverts all studio preferences, theme settings, caption template choices, and positioning coordinates back to original defaults. Your database scripts, creator profile persona, and calendar items are completely safe and untouched.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsResetModalOpen(true)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="shrink-0"
            >
              Reset to Defaults
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-cine-card/80 border border-cine-border">
            <div>
              <h4 className="text-sm font-semibold text-cine-text">Clear Local Storage Cache</h4>
              <p className="text-xs text-cine-muted mt-1 max-w-lg leading-relaxed">
                Purges the local browser cache key (<code className="text-cine-accent dark:text-indigo-300 font-mono text-[11px]">cinehai_settings</code>).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="shrink-0"
            >
              Clear Storage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          onResetAll();
          setIsResetModalOpen(false);
        }}
        title="Reset All Settings to Factory Defaults?"
        description="This will restore all workspace settings, theme preferences, and Caption Studio defaults to their original state. Your creator profile, generated scripts, and video history will NOT be affected."
        confirmLabel="Yes, Reset Settings"
        cancelLabel="Cancel"
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          onClearPreferences();
          setIsClearModalOpen(false);
        }}
        title="Clear Local Preferences Cache?"
        description="This removes cached settings from your browser. Settings will immediately reload with the standard system configuration."
        confirmLabel="Clear Cache"
        cancelLabel="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}
