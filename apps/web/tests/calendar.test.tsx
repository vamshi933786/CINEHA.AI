import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  getTodayString,
  formatDateString,
  formatDateToISO,
  formatMonthYear,
  getMonthGrid,
  getWeekDays,
  addDays,
} from "../lib/calendarHelpers";

import { CalendarItemCard } from "../components/calendar/CalendarItemCard";
import { CalendarControls } from "../components/calendar/CalendarControls";
import { CalendarDashboardStatsCard } from "../components/calendar/CalendarDashboardStatsCard";
import { MonthView } from "../components/calendar/MonthView";
import { WeekView } from "../components/calendar/WeekView";
import { AgendaView } from "../components/calendar/AgendaView";
import { ContentItemModal } from "../components/calendar/ContentItemModal";
import { ContentDetailModal } from "../components/calendar/ContentDetailModal";
import { ContentPlanGeneratorModal } from "../components/calendar/ContentPlanGeneratorModal";
import { CalendarWorkspace } from "../components/calendar/CalendarWorkspace";

import type {
  ContentItem,
  CalendarDashboardStats,
  ContentPlanSuggestion,
} from "../types/calendar";
import { api } from "../lib/api";

const mockItem1: ContentItem = {
  id: "cal-item-1",
  title: "Sony FX3 vs iPhone 15 Pro Low Light Test",
  description: "Comparing dynamic range and ISO noise in Hyderabad night street market.",
  scheduled_date: "2026-10-10",
  scheduled_time: "18:00",
  status: "Idea",
  platform: "Instagram Reels",
  content_type: "Review",
  language: "Tanglish",
  content_pillar: "Camera Gear",
  content_goal: "Engagement",
  priority: "High",
  tags: ["gear", "cinematic"],
  notes: "Film at Charminar night market",
  cta: "Comment your guess before the reveal",
  script_id: "script-101",
  script_version_id: 1,
  video_analysis_id: "va-201",
  script_summary: {
    id: "script-101",
    title: "Sony Low Light Hook",
    current_version: 1,
    duration_seconds: 45,
    language: "Tanglish",
    updated_at: "2026-10-01T10:00:00Z",
  },
  video_analysis_summary: {
    id: "va-201",
    filename: "sony_test.mp4",
    overall_score: 88,
    overall_rating: "High Engagement",
    top_finding: "Hook retention is strong",
    created_at: "2026-10-01T10:00:00Z",
  },
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

const mockItem2: ContentItem = {
  id: "cal-item-2",
  title: "Top 3 Lighting Mistakes You're Making",
  description: "How to fix flat overhead fluorescent lights with simple bounce.",
  scheduled_date: "2026-10-12",
  scheduled_time: "11:30",
  status: "Ready to Publish",
  platform: "YouTube Shorts",
  content_type: "Tutorial",
  language: "Tanglish",
  content_pillar: "Lighting",
  content_goal: "Saves",
  priority: "Urgent",
  tags: ["lighting", "tips"],
  notes: "Use aperture lantern for key light",
  cta: "Save this reel for your next shoot",
  script_id: null,
  script_version_id: null,
  video_analysis_id: null,
  created_at: "2026-10-02T10:00:00Z",
  updated_at: "2026-10-02T10:00:00Z",
};

const mockStats: CalendarDashboardStats = {
  total_items: 2,
  planned_count: 1,
  ready_to_publish_count: 1,
  published_count: 0,
  platform_breakdown: {
    "Instagram Reels": 1,
    "YouTube Shorts": 1,
  },
  content_type_breakdown: {
    Review: 1,
    Tutorial: 1,
  },
  pillar_coverage: {
    "Camera Gear": 1,
    Lighting: 1,
  },
};

describe("Content Calendar Module", () => {
  describe("1. Calendar Helper Utilities", () => {
    it("generates correct ISO format for dates", () => {
      const d = new Date(2026, 9, 15); // Month is 0-indexed: 9 = Oct
      expect(formatDateToISO(d)).toBe("2026-10-15");
    });

    it("formats month and year correctly", () => {
      const d = new Date(2026, 9, 1);
      expect(formatMonthYear(d)).toBe("October 2026");
    });

    it("shifts dates correctly with addDays", () => {
      expect(addDays("2026-10-10", 7)).toBe("2026-10-17");
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
      expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
    });

    it("generates month grid with at least 35 cells and valid day numbers", () => {
      const grid = getMonthGrid(2026, 9); // October 2026
      expect(grid.length).toBeGreaterThanOrEqual(35);
      expect(grid.length % 7).toBe(0);

      const oct1Cell = grid.find((c) => c.dateStr === "2026-10-01");
      expect(oct1Cell).toBeDefined();
      expect(oct1Cell?.isCurrentMonth).toBe(true);
      expect(oct1Cell?.dayNumber).toBe(1);
    });

    it("generates 7 week day columns for any base date", () => {
      const week = getWeekDays("2026-10-10");
      expect(week.length).toBe(7);
      expect(week[0].dayName).toBe("Sun");
      expect(week[6].dayName).toBe("Sat");
    });

    it("formats date strings into readable forms", () => {
      const formatted = formatDateString("2026-10-10", "short");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("10");
      expect(formatted).toContain("2026");

      const weekdayFormatted = formatDateString("2026-10-10", "weekday");
      expect(weekdayFormatted).toContain("Oct");
      expect(weekdayFormatted).toContain("10");
    });
  });

  describe("2. CalendarItemCard Component", () => {
    it("renders compact month card with title and indicators", () => {
      const onClick = vi.fn();
      render(<CalendarItemCard item={mockItem1} compact onClick={onClick} />);

      expect(screen.getByText(/Sony FX3 vs iPhone 15 Pro/i)).toBeInTheDocument();
      const card = screen.getByTestId("calendar-item-cal-item-1");
      expect(card).toBeInTheDocument();

      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("renders expanded card with platform, priority, time, and content pillar", () => {
      const onClick = vi.fn();
      render(<CalendarItemCard item={mockItem2} compact={false} onClick={onClick} />);

      expect(screen.getByText(/Top 3 Lighting Mistakes You're Making/i)).toBeInTheDocument();
      expect(screen.getByText("YouTube Shorts")).toBeInTheDocument();
      expect(screen.getByText("Urgent")).toBeInTheDocument();
      expect(screen.getByText("11:30")).toBeInTheDocument();
      expect(screen.getByText("Lighting")).toBeInTheDocument();
    });

    it("attaches item ID to dataTransfer on drag start", () => {
      const setDataMock = vi.fn();
      render(<CalendarItemCard item={mockItem1} compact onClick={vi.fn()} />);

      const card = screen.getByTestId("calendar-item-cal-item-1");
      fireEvent.dragStart(card, {
        dataTransfer: { setData: setDataMock },
      });

      expect(setDataMock).toHaveBeenCalledWith("text/plain", "cal-item-1");
    });
  });

  describe("3. CalendarControls Component", () => {
    it("renders navigation buttons, views, search input, and filter controls", () => {
      const onViewModeChange = vi.fn();
      const onPrev = vi.fn();
      const onNext = vi.fn();
      const onToday = vi.fn();
      const onSearchChange = vi.fn();
      const onStatusFilterChange = vi.fn();
      const onClearFilters = vi.fn();

      render(
        <CalendarControls
          viewMode="month"
          onViewModeChange={onViewModeChange}
          headerLabel="October 2026"
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          searchQuery=""
          onSearchChange={onSearchChange}
          statusFilter="all"
          onStatusFilterChange={onStatusFilterChange}
          platformFilter="all"
          onPlatformFilterChange={vi.fn()}
          priorityFilter="all"
          onPriorityFilterChange={vi.fn()}
          onClearFilters={onClearFilters}
        />
      );

      expect(screen.getByText("October 2026")).toBeInTheDocument();

      // View mode buttons
      fireEvent.click(screen.getByRole("button", { name: /^week$/i }));
      expect(onViewModeChange).toHaveBeenCalledWith("week");

      fireEvent.click(screen.getByRole("button", { name: /^agenda$/i }));
      expect(onViewModeChange).toHaveBeenCalledWith("agenda");

      // Prev / Next / Today
      fireEvent.click(screen.getByRole("button", { name: /^today$/i }));
      expect(onToday).toHaveBeenCalledTimes(1);

      // Search input
      const searchInput = screen.getByPlaceholderText(/search content or tags/i);
      fireEvent.change(searchInput, { target: { value: "Lighting" } });
      expect(onSearchChange).toHaveBeenCalledWith("Lighting");
    });
  });

  describe("4. CalendarDashboardStatsCard Component", () => {
    it("renders aggregated stats and metrics breakdown", () => {
      render(<CalendarDashboardStatsCard stats={mockStats} />);

      expect(screen.getByText("Total Items")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Planned")).toBeInTheDocument();
      expect(screen.getByText("Ready")).toBeInTheDocument();

      // Platform pills
      expect(screen.getByText("Instagram Reels")).toBeInTheDocument();
      expect(screen.getByText("YouTube Shorts")).toBeInTheDocument();

      // Pillars
      expect(screen.getByText("Camera Gear")).toBeInTheDocument();
      expect(screen.getByText("Lighting")).toBeInTheDocument();
    });
  });

  describe("5. Month, Week, and Agenda Views", () => {
    it("renders MonthView with day cells and item cards", () => {
      const onItemClick = vi.fn();
      const onDateClick = vi.fn();
      const onDropItem = vi.fn();

      render(
        <MonthView
          year={2026}
          month={9} // October
          items={[mockItem1, mockItem2]}
          onItemClick={onItemClick}
          onDateClick={onDateClick}
          onDropItem={onDropItem}
        />
      );

      // Check weekdays
      expect(screen.getByText("Sun")).toBeInTheDocument();
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();

      // Items should be rendered
      expect(screen.getByText(/Sony FX3 vs iPhone 15 Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Top 3 Lighting Mistakes/i)).toBeInTheDocument();
    });

    it("renders WeekView with 7 columns and expanded cards", () => {
      render(
        <WeekView
          baseDateStr="2026-10-10"
          items={[mockItem1]}
          onItemClick={vi.fn()}
          onDateClick={vi.fn()}
          onDropItem={vi.fn()}
        />
      );

      expect(screen.getByText(/Sony FX3 vs iPhone 15 Pro/i)).toBeInTheDocument();
      expect(screen.getByText("Instagram Reels")).toBeInTheDocument();
    });

    it("renders AgendaView with chronological items or empty state", () => {
      const onItemClick = vi.fn();
      const onCreateClick = vi.fn();

      const { rerender } = render(
        <AgendaView
          items={[mockItem1, mockItem2]}
          onItemClick={onItemClick}
          onCreateClick={onCreateClick}
        />
      );

      expect(screen.getByText(/Sony FX3 vs iPhone 15 Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Top 3 Lighting Mistakes/i)).toBeInTheDocument();

      // Empty state
      rerender(
        <AgendaView items={[]} onItemClick={onItemClick} onCreateClick={onCreateClick} />
      );

      expect(screen.getByText(/No Scheduled Content/i)).toBeInTheDocument();
    });
  });

  describe("6. ContentItemModal Component", () => {
    it("validates title and submits valid payload", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <ContentItemModal
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
          initialDate="2026-10-15"
        />
      );

      expect(screen.getByText("Plan New Content")).toBeInTheDocument();

      const titleInput = screen.getByPlaceholderText(/3 Camera Moves Every Creator Must Master/i);
      fireEvent.change(titleInput, { target: { value: "New Color Grading Reel" } });

      const submitBtn = screen.getByTestId("save-content-item-btn");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "New Color Grading Reel",
            scheduled_date: "2026-10-15",
          })
        );
      });
    });
  });

  describe("7. ContentDetailModal Component", () => {
    it("renders item details, deep links, and trigger action callbacks", async () => {
      const onEdit = vi.fn();
      const onDuplicate = vi.fn().mockResolvedValue(undefined);
      const onStatusChange = vi.fn().mockResolvedValue(undefined);
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <ContentDetailModal
          item={mockItem1}
          isOpen={true}
          onClose={onClose}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText("Sony FX3 vs iPhone 15 Pro Low Light Test")).toBeInTheDocument();
      expect(screen.getByText("Camera Gear")).toBeInTheDocument();

      // Deep links
      expect(screen.getByText("Open in Script Studio")).toBeInTheDocument();
      expect(screen.getByText("Analyze Retention")).toBeInTheDocument();

      // Edit action
      fireEvent.click(screen.getByRole("button", { name: /edit item/i }));
      expect(onEdit).toHaveBeenCalledWith(mockItem1);

      // Duplicate action (+7 days default)
      fireEvent.click(screen.getByRole("button", { name: /duplicate/i }));
      await waitFor(() => {
        expect(onDuplicate).toHaveBeenCalledWith(mockItem1, 7);
      });

      // Mark published action
      fireEvent.click(screen.getByRole("button", { name: /mark published/i }));
      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith(mockItem1, "Published");
      });
    });
  });

  describe("8. ContentPlanGeneratorModal Component", () => {
    it("generates suggestions and calls onAddSuggestions for selected items", async () => {
      const mockGenerate = vi.spyOn(api, "generateContentPlan").mockResolvedValue({
        suggestions: [
          {
            title: "Cinematic B-Roll in 30 Seconds",
            description: "How to get smooth handheld shots using 60fps.",
            suggested_date: "2026-10-15",
            platform: "Instagram Reels",
            content_type: "Tutorial",
            content_pillar: "Camera Gear",
            language: "Tanglish",
            suggested_duration: "30s",
            cta: "Try this in your next reel",
            rationale: "High viewer retention on camera tips",
          },
        ],
        period_days: 7,
        frequency: "3/week",
        is_ai_generated: true,
        summary_note: "Optimized for mobile cinematography",
      });

      const onAddSuggestions = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <ContentPlanGeneratorModal
          isOpen={true}
          onClose={onClose}
          onAddSuggestions={onAddSuggestions}
        />
      );

      expect(screen.getByText("AI Content Planning Assistant")).toBeInTheDocument();

      const generateBtn = screen.getByTestId("generate-plan-submit-btn");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalled();
        expect(screen.getByText("Cinematic B-Roll in 30 Seconds")).toBeInTheDocument();
      });

      // Click Add Selected to Calendar
      const addBtn = screen.getByTestId("add-selected-plan-btn");
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(onAddSuggestions).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              title: "Cinematic B-Roll in 30 Seconds",
            }),
          ])
        );
      });

      mockGenerate.mockRestore();
    });
  });

  describe("9. CalendarWorkspace Integration", () => {
    beforeEach(() => {
      vi.spyOn(api, "getContentItems").mockResolvedValue([mockItem1, mockItem2]);
      vi.spyOn(api, "getCalendarDashboardStats").mockResolvedValue(mockStats);
      vi.spyOn(api, "getProfile").mockResolvedValue({
        profile: {
          id: "prof-1",
          creator_name: "Sai Panga",
          display_name: "@saipanga",
          niche: "Mobile Filmmaking",
          content_pillars: ["Camera Gear", "Lighting"],
          primary_language: "Tanglish",
          platforms: ["Instagram Reels", "YouTube Shorts"],
          content_tones: ["Cinematic"],
          created_at: "2026-10-01T00:00:00Z",
          updated_at: "2026-10-01T00:00:00Z",
        },
        is_configured: true,
      });
      vi.spyOn(api, "getScripts").mockResolvedValue([]);
      vi.spyOn(api, "listVideoAnalyses").mockResolvedValue([]);
    });

    it("loads calendar workspace with persona banner, stats, and items", async () => {
      render(<CalendarWorkspace />);

      await waitFor(() => {
        expect(
          screen.getByText("Content Calendar & Planning Engine")
        ).toBeInTheDocument();
      });

      expect(screen.getByText("@saipanga")).toBeInTheDocument();
      expect(screen.getByText(/Total Items/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Sony FX3 vs iPhone 15 Pro Low Light Test/i)
      ).toBeInTheDocument();
    });

    it("opens New Content Item modal when clicking the primary action button", async () => {
      render(<CalendarWorkspace />);

      await waitFor(() => {
        expect(screen.getByTestId("new-content-item-btn")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("new-content-item-btn"));

      await waitFor(() => {
        expect(screen.getByText("Plan New Content")).toBeInTheDocument();
      });
    });

    it("opens AI Plan Generator modal when clicking AI Plan Generator button", async () => {
      render(<CalendarWorkspace />);

      await waitFor(() => {
        expect(screen.getByTestId("ai-plan-generator-btn")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("ai-plan-generator-btn"));

      await waitFor(() => {
        expect(screen.getByText("AI Content Planning Assistant")).toBeInTheDocument();
      });
    });
  });
});
