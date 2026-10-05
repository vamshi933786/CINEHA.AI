"use client";

import React from "react";
import type { ContentItem, ContentStatus } from "@/types/calendar";
import {
  FileText,
  BarChart2,
  Clock,
  Instagram,
  Youtube,
  Video,
  AlertCircle,
} from "lucide-react";

interface CalendarItemCardProps {
  item: ContentItem;
  onClick: () => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<ContentStatus, { bg: string; dot: string; text: string }> = {
  Idea: {
    bg: "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-slate-500",
    dot: "bg-slate-400",
    text: "text-slate-400",
  },
  Planned: {
    bg: "bg-indigo-950/60 border-indigo-700/50 text-indigo-200 hover:border-indigo-400",
    dot: "bg-indigo-400",
    text: "text-indigo-300",
  },
  "Script Ready": {
    bg: "bg-purple-950/60 border-purple-700/50 text-purple-200 hover:border-purple-400",
    dot: "bg-purple-400",
    text: "text-purple-300",
  },
  "In Production": {
    bg: "bg-amber-950/60 border-amber-700/50 text-amber-200 hover:border-amber-400",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  "Ready to Publish": {
    bg: "bg-teal-950/60 border-teal-600/50 text-teal-200 hover:border-teal-400",
    dot: "bg-teal-400",
    text: "text-teal-300",
  },
  Published: {
    bg: "bg-emerald-950/60 border-emerald-600/50 text-emerald-200 hover:border-emerald-400",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  Archived: {
    bg: "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700",
    dot: "bg-slate-600",
    text: "text-slate-500",
  },
};

export function CalendarItemCard({
  item,
  onClick,
  compact = false,
}: CalendarItemCardProps) {
  const statusConfig = STATUS_STYLES[item.status] || STATUS_STYLES.Planned;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const renderPlatformIcon = () => {
    switch (item.platform) {
      case "Instagram Reels":
        return <Instagram className="w-3 h-3 text-pink-400 shrink-0" />;
      case "YouTube Shorts":
        return <Youtube className="w-3 h-3 text-red-400 shrink-0" />;
      default:
        return <Video className="w-3 h-3 text-slate-400 shrink-0" />;
    }
  };

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={handleDragStart}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`group p-1.5 rounded-md border text-left cursor-grab active:cursor-grabbing transition-all select-none shadow-sm ${statusConfig.bg}`}
        title={`${item.title} (${item.status}) - Click for details, drag to reschedule`}
        data-testid={`calendar-item-${item.id}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`}
          />
          <span className="text-[11px] font-medium truncate flex-1 leading-tight text-white group-hover:text-cine-accent">
            {item.title}
          </span>
          {item.script_id && (
            <span title="Linked Script" className="shrink-0 flex items-center">
              <FileText className="w-2.5 h-2.5 text-cine-accent" />
            </span>
          )}
          {item.video_analysis_id && (
            <span title="Linked Video Analysis" className="shrink-0 flex items-center">
              <BarChart2 className="w-2.5 h-2.5 text-cine-emerald" />
            </span>
          )}
        </div>
      </div>
    );
  }

  // Expanded card for Week and Agenda views
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group p-3 rounded-lg border text-left cursor-pointer transition-all space-y-2 select-none shadow-md ${statusConfig.bg}`}
      data-testid={`calendar-item-expanded-${item.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {renderPlatformIcon()}
          <span className="text-[11px] font-mono text-slate-400">
            {item.platform}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {item.priority === "Urgent" && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              <AlertCircle className="w-2.5 h-2.5" /> Urgent
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${statusConfig.bg} border`}
          >
            {item.status}
          </span>
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cine-accent line-clamp-2 leading-snug">
        {item.title}
      </h4>

      {item.description && (
        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {item.scheduled_time && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-300">
              <Clock className="w-3 h-3 text-slate-400" />
              {item.scheduled_time}
            </span>
          )}
          {item.content_pillar && (
            <span className="px-1.5 py-0.5 rounded bg-cine-surface border border-cine-border/50 text-[10px] text-slate-300">
              {item.content_pillar}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {item.script_id && (
            <span
              className="flex items-center gap-0.5 text-[10px] text-cine-accent font-medium px-1 rounded bg-cine-accent/10"
              title="Script Attached"
            >
              <FileText className="w-2.5 h-2.5" />
              <span>Script</span>
            </span>
          )}
          {item.video_analysis_id && (
            <span
              className="flex items-center gap-0.5 text-[10px] text-cine-emerald font-medium px-1 rounded bg-cine-emerald/10"
              title="Video Analysis Attached"
            >
              <BarChart2 className="w-2.5 h-2.5" />
              <span>Audit</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
