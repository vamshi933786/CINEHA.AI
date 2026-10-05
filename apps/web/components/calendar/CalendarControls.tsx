"use client";

import React from "react";
import type {
  CalendarViewMode,
  ContentStatus,
  PlatformType,
  ContentPriority,
} from "@/types/calendar";
import {
  STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/types/calendar";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Calendar,
  Grid,
  List,
} from "lucide-react";

interface CalendarControlsProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  headerLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  platformFilter: string;
  onPlatformFilterChange: (plat: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (prio: string) => void;
  onClearFilters: () => void;
}

export function CalendarControls({
  viewMode,
  onViewModeChange,
  headerLabel,
  onPrev,
  onNext,
  onToday,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  platformFilter,
  onPlatformFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onClearFilters,
}: CalendarControlsProps) {
  const hasActiveFilters = Boolean(
    searchQuery || statusFilter || platformFilter || priorityFilter
  );

  return (
    <div
      className="space-y-3 bg-cine-card/80 p-3 sm:p-4 rounded-xl border border-cine-border/70 shadow-lg"
      data-testid="calendar-controls"
    >
      {/* Top Row: Navigation and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Group */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrev}
            aria-label="Previous period"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToday}
            className="text-xs h-8 px-2.5 font-medium"
          >
            Today
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNext}
            aria-label="Next period"
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <h2 className="text-base sm:text-lg font-bold text-white font-mono ml-2">
            {headerLabel}
          </h2>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center p-1 rounded-lg bg-cine-bg/80 border border-cine-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "month"
                ? "bg-cine-accent text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Month</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("week")}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "week"
                ? "bg-cine-accent text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Week</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === "agenda"
                ? "bg-cine-accent text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cine-border/40">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search content or tags..."
            aria-label="Search content or tags"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-cine-bg/90 border border-cine-border focus:border-cine-accent text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cine-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          aria-label="Filter by Status"
          className="px-2.5 py-1.5 text-xs rounded-lg bg-cine-bg/90 border border-cine-border focus:border-cine-accent text-slate-300 focus:outline-none focus:ring-1 focus:ring-cine-accent"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Platform Filter */}
        <select
          value={platformFilter}
          onChange={(e) => onPlatformFilterChange(e.target.value)}
          aria-label="Filter by Platform"
          className="px-2.5 py-1.5 text-xs rounded-lg bg-cine-bg/90 border border-cine-border focus:border-cine-accent text-slate-300 focus:outline-none focus:ring-1 focus:ring-cine-accent"
        >
          <option value="">All Platforms</option>
          {PLATFORM_OPTIONS.map((pl) => (
            <option key={pl} value={pl}>
              {pl}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          aria-label="Filter by Priority"
          className="px-2.5 py-1.5 text-xs rounded-lg bg-cine-bg/90 border border-cine-border focus:border-cine-accent text-slate-300 focus:outline-none focus:ring-1 focus:ring-cine-accent"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((pr) => (
            <option key={pr} value={pr}>
              {pr}
            </option>
          ))}
        </select>

        {/* Reset / Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-cine-rose hover:underline flex items-center gap-1 px-2 py-1 focus:outline-none"
          >
            <X className="w-3 h-3" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
