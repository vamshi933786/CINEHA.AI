"use client";

import React from "react";
import type { ContentItem } from "@/types/calendar";
import { formatDateString } from "@/lib/calendarHelpers";
import { CalendarItemCard } from "./CalendarItemCard";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AgendaViewProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
  onCreateClick: () => void;
}

export function AgendaView({
  items,
  onItemClick,
  onCreateClick,
}: AgendaViewProps) {
  // Sort items by date asc, time asc
  const sortedItems = [...items].sort((a, b) => {
    if (a.scheduled_date !== b.scheduled_date) {
      return a.scheduled_date.localeCompare(b.scheduled_date);
    }
    return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
  });

  // Group by scheduled_date
  const groupedByDate: Record<string, ContentItem[]> = {};
  for (const item of sortedItems) {
    if (!groupedByDate[item.scheduled_date]) {
      groupedByDate[item.scheduled_date] = [];
    }
    groupedByDate[item.scheduled_date].push(item);
  }

  const dateKeys = Object.keys(groupedByDate);

  if (dateKeys.length === 0) {
    return (
      <div
        className="p-12 text-center rounded-xl bg-cine-card/40 border border-cine-border/50 space-y-4"
        data-testid="agenda-empty-state"
      >
        <div className="w-12 h-12 rounded-full bg-cine-surface border border-cine-border/60 flex items-center justify-center mx-auto text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">
            No Scheduled Content Found
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no content items matching your current filters or date range.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateClick}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Schedule New Content
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-agenda-view">
      {dateKeys.map((dateStr) => {
        const dayItems = groupedByDate[dateStr];
        const formattedDate = formatDateString(dateStr, "full");

        return (
          <div key={dateStr} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cine-accent shrink-0" />
              <h3 className="text-xs sm:text-sm font-semibold font-mono text-slate-200">
                {formattedDate}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                ({dayItems.length} {dayItems.length === 1 ? "item" : "items"})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dayItems.map((item) => (
                <CalendarItemCard
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
