"use client";

import React, { useState } from "react";
import type { ContentItem } from "@/types/calendar";
import { getWeekDays } from "@/lib/calendarHelpers";
import { CalendarItemCard } from "./CalendarItemCard";
import { Plus, Calendar as CalendarIcon } from "lucide-react";

interface WeekViewProps {
  baseDateStr: string;
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onDateClick: (dateStr: string) => void;
  onDropItem: (dateStr: string, itemId: string) => void;
}

export function WeekView({
  baseDateStr,
  items,
  onItemClick,
  onDateClick,
  onDropItem,
}: WeekViewProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const weekDays = getWeekDays(baseDateStr);

  // Group items by scheduled_date
  const itemsByDate: Record<string, ContentItem[]> = {};
  for (const item of items) {
    if (!itemsByDate[item.scheduled_date]) {
      itemsByDate[item.scheduled_date] = [];
    }
    itemsByDate[item.scheduled_date].push(item);
  }

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (dateStr: string) => {
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) {
      onDropItem(dateStr, itemId);
    }
  };

  return (
    <div
      className="bg-cine-card/70 border border-cine-border/70 rounded-xl overflow-hidden shadow-xl"
      data-testid="calendar-week-view"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-cine-border/40">
        {weekDays.map((col) => {
          const dayItems = itemsByDate[col.dateStr] || [];
          const isDragTarget = dragOverDate === col.dateStr;

          return (
            <div
              key={col.dateStr}
              onDragOver={(e) => handleDragOver(e, col.dateStr)}
              onDragLeave={() => handleDragLeave(col.dateStr)}
              onDrop={(e) => handleDrop(e, col.dateStr)}
              className={`flex flex-col min-h-[350px] transition-all ${
                isDragTarget
                  ? "bg-cine-accent/10 ring-2 ring-cine-accent"
                  : "bg-cine-card/20 hover:bg-cine-surface/20"
              }`}
              data-testid={`week-column-${col.dateStr}`}
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b border-cine-border/40 flex items-center justify-between ${
                  col.isToday ? "bg-cine-accent/15" : "bg-cine-surface/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center ${
                      col.isToday
                        ? "bg-cine-accent text-white shadow-md shadow-cine-accent/30"
                        : "text-slate-300 bg-cine-bg/60 border border-cine-border/40"
                    }`}
                  >
                    {col.dayNumber}
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      {col.dayName}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      {dayItems.length} planned
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDateClick(col.dateStr)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-cine-surface transition-colors"
                  title={`Schedule on ${col.dateStr}`}
                  aria-label={`Schedule on ${col.dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items List in Column */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {dayItems.length === 0 ? (
                  <div
                    onClick={() => onDateClick(col.dateStr)}
                    className="h-28 rounded-lg border border-dashed border-cine-border/40 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-cine-accent/60 text-slate-500 hover:text-slate-300 transition-colors group"
                  >
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-cine-accent mb-1 transition-colors" />
                    <span className="text-[11px]">Plan Content</span>
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <CalendarItemCard
                      key={item.id}
                      item={item}
                      onClick={() => onItemClick(item)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
