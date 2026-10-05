"use client";

import React, { useState, useEffect } from "react";
import type {
  ContentItem,
  ContentItemPayload,
  ContentStatus,
  PlatformType,
  ContentType,
  ContentPriority,
} from "@/types/calendar";
import {
  STATUS_OPTIONS,
  PLATFORM_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/types/calendar";
import type { Script } from "@/types/script";
import type { VideoAnalysisResponse } from "@/types/videoAnalysis";
import type { CreatorProfile } from "@/types/creatorProfile";
import { getTodayString } from "@/lib/calendarHelpers";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Layers,
  FileText,
  BarChart2,
  AlertCircle,
  Tag,
} from "lucide-react";

interface ContentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ContentItemPayload) => Promise<void>;
  initialData?: ContentItem | null;
  initialDate?: string | null;
  availableScripts?: Script[];
  availableAnalyses?: VideoAnalysisResponse[];
  creatorProfile?: CreatorProfile | null;
  isLoading?: boolean;
}

export function ContentItemModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialDate,
  availableScripts = [],
  availableAnalyses = [],
  creatorProfile,
  isLoading = false,
}: ContentItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [status, setStatus] = useState<ContentStatus>("Planned");
  const [platform, setPlatform] = useState<PlatformType>("Instagram Reels");
  const [contentType, setContentType] = useState<ContentType>("Educational");
  const [contentPillar, setContentPillar] = useState("");
  const [language, setLanguage] = useState("Tanglish");
  const [priority, setPriority] = useState<ContentPriority>("Medium");
  const [scriptId, setScriptId] = useState("");
  const [videoAnalysisId, setVideoAnalysisId] = useState("");
  const [cta, setCta] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setScheduledDate(initialData.scheduled_date || getTodayString());
      setScheduledTime(initialData.scheduled_time || "");
      setStatus(initialData.status || "Planned");
      setPlatform(initialData.platform || "Instagram Reels");
      setContentType(initialData.content_type || "Educational");
      setContentPillar(initialData.content_pillar || "");
      setLanguage(initialData.language || "Tanglish");
      setPriority(initialData.priority || "Medium");
      setScriptId(initialData.script_id || "");
      setVideoAnalysisId(initialData.video_analysis_id || "");
      setCta(initialData.cta || "");
      setNotes(initialData.notes || "");
      setTags(initialData.tags || []);
    } else {
      // New content item
      setTitle("");
      setDescription("");
      setScheduledDate(initialDate || getTodayString());
      setScheduledTime("18:00");
      setStatus("Planned");
      setPriority("Medium");
      setScriptId("");
      setVideoAnalysisId("");
      setNotes("");
      setTags([]);

      // Pre-fill from Creator Profile if available
      if (creatorProfile) {
        setPlatform(
          (creatorProfile.platforms?.[0] as PlatformType) || "Instagram Reels"
        );
        setLanguage(creatorProfile.primary_language || "Tanglish");
        setContentPillar(creatorProfile.content_pillars?.[0] || "");
        setCta(creatorProfile.cta_style || "");
      } else {
        setPlatform("Instagram Reels");
        setLanguage("Tanglish");
        setContentPillar("");
        setCta("");
      }
    }
    setValidationError(null);
  }, [isOpen, initialData, initialDate, creatorProfile]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Content title is required.");
      return;
    }
    if (!scheduledDate) {
      setValidationError("Scheduled date is required.");
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime.trim() || null,
        status,
        platform,
        content_type: contentType,
        content_pillar: contentPillar.trim() || null,
        language,
        priority,
        script_id: scriptId || null,
        video_analysis_id: videoAnalysisId || null,
        cta: cta.trim() || null,
        notes: notes.trim() || null,
        tags,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save content item.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-modal-title"
      data-testid="content-item-modal"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-cine-card border border-cine-border shadow-2xl p-5 sm:p-6 space-y-5 text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cine-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cine-accent" />
            <h3
              id="content-modal-title"
              className="text-base sm:text-lg font-bold text-white font-mono"
            >
              {initialData ? "Edit Scheduled Content" : "Plan New Content"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cine-surface"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-cine-rose" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label
              htmlFor="content-title"
              className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
            >
              Content Title <span className="text-cine-rose">*</span>
            </label>
            <input
              id="content-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 Camera Moves Every Creator Must Master"
              className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label
              htmlFor="content-desc"
              className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
            >
              Description / Concept Summary
            </label>
            <textarea
              id="content-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this short video covers and the visual hook angle."
              className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent resize-none"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="scheduled-date"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Scheduled Date <span className="text-cine-rose">*</span>
              </label>
              <input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="scheduled-time"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Target Release Time
              </label>
              <input
                id="scheduled-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              />
            </div>
          </div>

          {/* Status, Platform, Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="content-status"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Planning Status
              </label>
              <select
                id="content-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="content-platform"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Platform
              </label>
              <select
                id="content-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              >
                {PLATFORM_OPTIONS.map((pl) => (
                  <option key={pl} value={pl}>
                    {pl}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="content-priority"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Priority
              </label>
              <select
                id="content-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ContentPriority)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              >
                {PRIORITY_OPTIONS.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Type & Pillar Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="content-type"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Content Type
              </label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              >
                {CONTENT_TYPE_OPTIONS.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="content-pillar"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Content Pillar
                </label>
                {creatorProfile?.content_pillars?.includes(contentPillar) && (
                  <Badge variant="accent" size="sm" className="text-[10px] py-0">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    From Persona
                  </Badge>
                )}
              </div>
              <input
                id="content-pillar"
                type="text"
                value={contentPillar}
                onChange={(e) => setContentPillar(e.target.value)}
                placeholder="e.g. Mobile Filmmaking, Lighting Tips"
                list="creator-pillars-datalist"
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              />
              <datalist id="creator-pillars-datalist">
                {creatorProfile?.content_pillars?.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Linked Resources Section */}
          <div className="p-3.5 rounded-xl bg-cine-surface/40 border border-cine-border/50 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block">
              Connect Existing CINEHAI AI Assets
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Linked Script */}
              <div className="space-y-1">
                <label
                  htmlFor="linked-script"
                  className="block text-[11px] font-mono text-slate-400 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-cine-accent" />
                  Link Generated Script
                </label>
                <select
                  id="linked-script"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-cine-bg border border-cine-border text-white text-xs focus:outline-none focus:ring-1 focus:ring-cine-accent"
                >
                  <option value="">No Script Linked</option>
                  {availableScripts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.duration_seconds}s - v{s.current_version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Video Analysis */}
              <div className="space-y-1">
                <label
                  htmlFor="linked-analysis"
                  className="block text-[11px] font-mono text-slate-400 flex items-center gap-1"
                >
                  <BarChart2 className="w-3 h-3 text-cine-emerald" />
                  Link Video Analysis Audit
                </label>
                <select
                  id="linked-analysis"
                  value={videoAnalysisId}
                  onChange={(e) => setVideoAnalysisId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-cine-bg border border-cine-border text-white text-xs focus:outline-none focus:ring-1 focus:ring-cine-accent"
                >
                  <option value="">No Video Analysis Linked</option>
                  {availableAnalyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.video.filename} (Score: {a.overall_score}/100)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CTA & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="content-cta"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Call to Action (CTA)
              </label>
              <input
                id="content-cta"
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Save this reel for your next shoot"
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="content-language"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Language
              </label>
              <select
                id="content-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              >
                <option value="English">English</option>
                <option value="Telugu">Telugu</option>
                <option value="Tanglish">Tanglish</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label
              htmlFor="content-tag-input"
              className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1"
            >
              <Tag className="w-3 h-3 text-slate-400" />
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="content-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Add"
                className="flex-1 px-3 py-1.5 rounded-lg bg-cine-bg border border-cine-border text-white text-xs focus:outline-none focus:ring-1 focus:ring-cine-accent"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="text-xs h-8"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cine-border/50">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              data-testid="save-content-item-btn"
            >
              {initialData ? "Save Changes" : "Schedule Content"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
