"use client";

import React from "react";
import {
  History,
  Trash2,
  RefreshCw,
  ExternalLink,
  X,
  Zap,
  Globe2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { TrendResearchHistoryItem } from "@/types/trendResearch";

interface ResearchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: TrendResearchHistoryItem[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRefreshSession: (id: string) => void;
}

export function ResearchHistoryDrawer({
  isOpen,
  onClose,
  history,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onRefreshSession,
}: ResearchHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-cine-surface border-l border-cine-border h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-cine-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-cine-text">
              Research Sessions History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-cine-muted hover:text-cine-text p-1.5 rounded-lg hover:bg-cine-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-cine-muted text-xs">
              No previous research sessions recorded yet. Run your first analysis to see history here.
            </div>
          ) : (
            history.map((item) => {
              const isCurrent = currentSessionId === item.id;
              const dateStr = new Date(item.created_at).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
              );

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-sm"
                      : "bg-cine-card border-cine-border/70 hover:border-cine-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => onSelectSession(item.id)}>
                      <div className="font-medium text-cine-text line-clamp-1">
                        {item.query_topic || `${item.niche} Overview`}
                      </div>
                      <div className="text-[11px] text-cine-muted mt-0.5 flex items-center gap-2">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{item.platform}</span>
                      </div>
                    </div>

                    {item.top_score && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        <Zap className="w-3 h-3" />
                        <span>{item.top_score}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-cine-border/50">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default" size="sm" className="text-[10px]">
                        {item.language}
                      </Badge>
                      <span className="text-[10px] text-cine-muted">
                        {item.opportunity_count} opportunities
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRefreshSession(item.id)}
                        className="p-1 text-cine-muted hover:text-indigo-400 rounded hover:bg-cine-surface transition-colors"
                        title="Re-run research"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSession(item.id)}
                        className="p-1 text-cine-muted hover:text-rose-400 rounded hover:bg-cine-surface transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
