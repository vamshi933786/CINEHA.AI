"use client";

import React, { useState } from "react";
import type { ContentItem } from "@/types/calendar";
import { getMonthGrid } from "@/lib/calendarHelpers";
import { CalendarItemCard } from "./CalendarItemCard";
import { Plus } from "lucide-react";

interface MonthViewProps {
  year: number;
  month: number;
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onDateClick: (dateStr: string) => void;
  onDropItem: (dateStr: string, itemId: string) => void;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView({
  year,
  month,
  items,
  onItemClick,
  onDateClick,
  onDropItem,
}: MonthViewProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const cells = getMonthGrid(year, month);

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
      data-testid="calendar-month-view"
    >
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-cine-border/60 bg-cine-surface/80 text-center py-2.5">
        {WEEKDAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-cine-border/30 bg-cine-bg/40">
        {cells.map((cell) => {
          const dayItems = itemsByDate[cell.dateStr] || [];
          const isDragTarget = dragOverDate === cell.dateStr;

          return (
            <div
              key={cell.dateStr}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={() => handleDragLeave(cell.dateStr)}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              onClick={() => onDateClick(cell.dateStr)}
              className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 transition-all flex flex-col justify-between group cursor-pointer ${
                cell.isCurrentMonth
                  ? "bg-cine-card/30 hover:bg-cine-surface/40"
                  : "bg-cine-bg/70 opacity-50 hover:opacity-75"
              } ${
                isDragTarget
                  ? "ring-2 ring-cine-accent bg-cine-accent/10 border-cine-accent"
                  : ""
              }`}
              data-testid={`calendar-cell-${cell.dateStr}`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-mono font-medium w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    cell.isToday
                      ? "bg-cine-accent text-white font-bold shadow-md shadow-cine-accent/30"
                      : cell.isCurrentMonth
                      ? "text-slate-300"
                      : "text-slate-500"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateClick(cell.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-cine-surface text-slate-400 hover:text-white transition-opacity focus:opacity-100"
                  title={`Add content for ${cell.dateStr}`}
                  aria-label={`Add content for ${cell.dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items List in Cell */}
              <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none flex-1">
                {dayItems.slice(0, 3).map((item) => (
                  <CalendarItemCard
                    key={item.id}
                    item={item}
                    compact
                    onClick={() => onItemClick(item)}
                  />
                ))}

                {dayItems.length > 3 && (
                  <div className="text-[10px] font-mono text-cine-accent text-center pt-0.5 font-medium hover:underline">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
