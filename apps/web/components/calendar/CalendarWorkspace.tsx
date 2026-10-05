"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type {
  ContentItem,
  ContentItemPayload,
  CalendarDashboardStats,
  CalendarViewMode,
  ContentPlanSuggestion,
  ContentStatus,
} from "@/types/calendar";
import type { Script } from "@/types/script";
import type { VideoAnalysisResponse } from "@/types/videoAnalysis";
import type { CreatorProfile } from "@/types/creatorProfile";
import {
  formatDateToISO,
  formatMonthYear,
  formatDateString,
  addDays,
} from "@/lib/calendarHelpers";
import { api } from "@/lib/api";
import { CalendarControls } from "./CalendarControls";
import { CalendarDashboardStatsCard } from "./CalendarDashboardStatsCard";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { AgendaView } from "./AgendaView";
import { ContentItemModal } from "./ContentItemModal";
import { ContentDetailModal } from "./ContentDetailModal";
import { ContentPlanGeneratorModal } from "./ContentPlanGeneratorModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function CalendarWorkspace() {
  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Data state
  const [items, setItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<CalendarDashboardStats | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [availableScripts, setAvailableScripts] = useState<Script[]>([]);
  const [availableAnalyses, setAvailableAnalyses] = useState<VideoAnalysisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 4000);
    },
    []
  );

  // Load items and dashboard stats
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [itemsData, statsData] = await Promise.all([
        api.getContentItems(),
        api.getCalendarDashboardStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load calendar data:", err);
      setError(err?.message || "Failed to load calendar items. Please check backend connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: Profile, Scripts, Analyses & Calendar Data
  useEffect(() => {
    let isMounted = true;

    async function loadMeta() {
      try {
        const [profileRes, scriptsRes, analysesRes] = await Promise.allSettled([
          api.getProfile(),
          api.getScripts(),
          api.listVideoAnalyses(),
        ]);

        if (!isMounted) return;

        if (profileRes.status === "fulfilled") {
          setCreatorProfile(profileRes.value.profile);
        }
        if (scriptsRes.status === "fulfilled") {
          setAvailableScripts(scriptsRes.value || []);
        }
        if (analysesRes.status === "fulfilled") {
          setAvailableAnalyses(analysesRes.value || []);
        }
      } catch (e) {
        // Tolerant failure for optional metadata
        console.warn("Could not load full metadata for calendar:", e);
      }
    }

    loadMeta();
    fetchCalendarData();

    return () => {
      isMounted = false;
    };
  }, [fetchCalendarData]);

  // Date Navigation
  const handlePrev = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 30);
      }
      return next;
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 30);
      }
      return next;
    });
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Compute header display label
  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return formatMonthYear(currentDate);
    } else if (viewMode === "week") {
      const isoStr = formatDateToISO(currentDate);
      return `Week of ${formatDateString(isoStr, "short")}`;
    } else {
      return `Agenda — ${currentDate.getFullYear()}`;
    }
  }, [currentDate, viewMode]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        const matchesPillar = (item.content_pillar || "").toLowerCase().includes(q);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesPillar && !matchesTags) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Platform filter
      if (platformFilter !== "all" && item.platform !== platformFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, platformFilter, priorityFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setPriorityFilter("all");
  }, []);

  // Card & Date Click Handlers
  const handleItemClick = useCallback((item: ContentItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleQuickScheduleDate = useCallback((dateStr: string) => {
    setEditingItem(null);
    setModalInitialDate(dateStr);
    setIsItemModalOpen(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingItem(null);
    setModalInitialDate(formatDateToISO(currentDate));
    setIsItemModalOpen(true);
  }, [currentDate]);

  const handleEditItemFromDetail = useCallback((item: ContentItem) => {
    setIsDetailModalOpen(false);
    setEditingItem(item);
    setModalInitialDate(item.scheduled_date);
    setIsItemModalOpen(true);
  }, []);

  // Reschedule via Drag & Drop
  const handleDropItem = useCallback(
    async (targetDate: string, itemId: string) => {
      const itemToMove = items.find((i) => i.id === itemId);
      if (!itemToMove || itemToMove.scheduled_date === targetDate) return;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, scheduled_date: targetDate } : i))
      );

      try {
        const updated = await api.updateContentItem(itemId, { scheduled_date: targetDate });
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
        showToast(
          `Rescheduled "${itemToMove.title}" to ${formatDateString(targetDate)}`,
          "success"
        );
        // Refresh dashboard stats
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } catch (err: any) {
        console.error("Failed to move item:", err);
        // Revert on error
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? itemToMove : i))
        );
        showToast(`Failed to reschedule item: ${err?.message || "Unknown error"}`, "error");
      }
    },
    [items, showToast]
  );

  // Status Change (from detail modal or quick actions)
  const handleStatusChange = useCallback(
    async (item: ContentItem, newStatus: string) => {
      try {
        const updated = await api.updateContentItem(item.id, {
          status: newStatus as ContentStatus,
        });
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
        setSelectedItem((curr) => (curr?.id === item.id ? updated : curr));
        showToast(`Status updated to "${newStatus.replace("_", " ")}"`, "success");
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } catch (err: any) {
        console.error("Failed to update status:", err);
        showToast(`Failed to update status: ${err?.message || "Unknown error"}`, "error");
      }
    },
    [showToast]
  );

  // Duplicate Item
  const handleDuplicateItem = useCallback(
    async (item: ContentItem, shiftDays: number) => {
      try {
        const duplicated = await api.duplicateContentItem(item.id, shiftDays);
        setItems((prev) => [...prev, duplicated]);
        setIsDetailModalOpen(false);
        showToast(
          `Duplicated "${item.title}" to ${formatDateString(duplicated.scheduled_date)}`,
          "success"
        );
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } catch (err: any) {
        console.error("Failed to duplicate item:", err);
        showToast(`Failed to duplicate item: ${err?.message || "Unknown error"}`, "error");
      }
    },
    [showToast]
  );

  // Delete Item
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      try {
        await api.deleteContentItem(itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setIsDetailModalOpen(false);
        showToast("Content item deleted", "info");
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } catch (err: any) {
        console.error("Failed to delete item:", err);
        showToast(`Failed to delete item: ${err?.message || "Unknown error"}`, "error");
      }
    },
    [showToast]
  );

  // Save (Create or Update) Item
  const handleSaveModal = useCallback(
    async (payload: ContentItemPayload) => {
      setIsSaving(true);
      try {
        if (editingItem) {
          const updated = await api.updateContentItem(editingItem.id, payload);
          setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
          showToast(`Updated "${updated.title}"`, "success");
        } else {
          const created = await api.createContentItem(payload);
          setItems((prev) => [...prev, created]);
          showToast(`Scheduled "${created.title}"`, "success");
        }
        setIsItemModalOpen(false);
        setEditingItem(null);
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } catch (err: any) {
        console.error("Failed to save content item:", err);
        showToast(`Failed to save: ${err?.message || "Check fields"}`, "error");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, showToast]
  );

  // Add suggestions from AI plan generator
  const handleAddPlanSuggestions = useCallback(
    async (suggestions: ContentPlanSuggestion[]) => {
      let addedCount = 0;
      const createdItems: ContentItem[] = [];

      for (const s of suggestions) {
        try {
          const created = await api.createContentItem({
            title: s.title,
            description: s.description,
            scheduled_date: s.suggested_date,
            scheduled_time: "10:00",
            status: "Idea",
            platform: (s.platform as any) || "Instagram Reels",
            content_type: (s.content_type as any) || "Educational",
            content_pillar: s.content_pillar || "General",
            priority: "Medium",
            tags: [s.content_pillar || "ai-planned"],
            notes: s.rationale ? `Rationale: ${s.rationale}` : null,
            cta: s.cta || "",
          });
          createdItems.push(created);
          addedCount++;
        } catch (err) {
          console.warn(`Failed to add suggestion "${s.title}":`, err);
        }
      }

      if (createdItems.length > 0) {
        setItems((prev) => [...prev, ...createdItems]);
        showToast(`Added ${addedCount} planned items to your calendar!`, "success");
        api.getCalendarDashboardStats().then(setStats).catch(() => {});
      } else {
        showToast("No items could be added.", "error");
      }
    },
    [showToast]
  );

  return (
    <div className="min-h-screen bg-cine-dark text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto" data-testid="calendar-workspace">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-700/60"
              : toast.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-700/60"
              : "bg-slate-900/90 text-slate-200 border-slate-700/60"
          }`}
          data-testid="calendar-toast"
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-cine-accent shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cine-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cine-accent to-purple-500 flex items-center justify-center shadow-lg shadow-cine-accent/20">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Content Calendar & Planning Engine
              </h1>
              <p className="text-sm text-slate-400">
                Plan, organize, and orchestrate content ideas, scripts, and video assets across platforms
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPlanModalOpen(true)}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-950/30 hover:border-purple-400 flex items-center gap-2"
            data-testid="ai-plan-generator-btn"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Plan Generator</span>
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="bg-cine-accent hover:bg-cine-accent/90 text-slate-950 font-semibold shadow-md flex items-center gap-2"
            data-testid="new-content-item-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Content Item</span>
          </Button>
        </div>
      </div>

      {/* Creator Profile Persona Link Banner */}
      {creatorProfile ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-cine-card/40 border border-cine-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Linked Persona: <strong className="text-white">{creatorProfile.display_name || creatorProfile.creator_name}</strong>
            </span>
            <span className="text-slate-400">({creatorProfile.niche || "Creator"})</span>
            {creatorProfile.content_pillars && creatorProfile.content_pillars.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 ml-2">
                {creatorProfile.content_pillars.slice(0, 3).map((pillar, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] py-0 border-cine-border/60 text-slate-300">
                    {pillar}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/profile"
            className="text-cine-accent hover:underline flex items-center gap-1 shrink-0"
          >
            Manage Persona <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              💡 Complete your <strong>Creator Profile</strong> to automatically tailor content pillar suggestions and AI calendar plans.
            </span>
          </div>
          <Link href="/profile" className="text-purple-300 hover:underline font-semibold flex items-center gap-1">
            Setup Profile <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Dashboard Stats */}
      {stats && <CalendarDashboardStatsCard stats={stats} />}

      {/* Calendar Controls (Navigation, Views, Filters) */}
      <CalendarControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        headerLabel={headerLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCalendarData}
            className="border-rose-700/60 text-rose-200 hover:bg-rose-900/40 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Calendar Views */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400 rounded-xl bg-cine-card/40 border border-cine-border/40">
            <RefreshCw className="w-6 h-6 animate-spin text-cine-accent" />
            <span className="text-sm font-mono">Loading calendar schedule...</span>
          </div>
        ) : (
          <>
            {viewMode === "month" && (
              <MonthView
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                items={filteredItems}
                onItemClick={handleItemClick}
                onDateClick={handleQuickScheduleDate}
                onDropItem={handleDropItem}
              />
            )}

            {viewMode === "week" && (
              <WeekView
                baseDateStr={formatDateToISO(currentDate)}
                items={filteredItems}
                onItemClick={handleItemClick}
                onDateClick={handleQuickScheduleDate}
                onDropItem={handleDropItem}
              />
            )}

            {viewMode === "agenda" && (
              <AgendaView
                items={filteredItems}
                onItemClick={handleItemClick}
                onCreateClick={handleOpenCreateModal}
              />
            )}
          </>
        )}
      </div>

      {/* Content Item Create / Edit Modal */}
      <ContentItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveModal}
        initialData={editingItem}
        initialDate={modalInitialDate}
        availableScripts={availableScripts}
        availableAnalyses={availableAnalyses}
        creatorProfile={creatorProfile}
        isLoading={isSaving}
      />

      {/* Content Detail Drawer/Modal */}
      <ContentDetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItem(null);
        }}
        onEdit={handleEditItemFromDetail}
        onDuplicate={handleDuplicateItem}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteItem}
      />

      {/* Content Plan AI Generator Modal */}
      <ContentPlanGeneratorModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onAddSuggestions={handleAddPlanSuggestions}
      />
    </div>
  );
}
