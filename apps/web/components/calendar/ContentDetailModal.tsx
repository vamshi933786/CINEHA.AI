"use client";

import React, { useState } from "react";
import type { ContentItem } from "@/types/calendar";
import { formatDateString } from "@/lib/calendarHelpers";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Edit3,
  Copy,
  Trash2,
  CalendarCheck,
  Archive,
  Clock,
  Calendar,
  FileText,
  BarChart2,
  ExternalLink,
  Tag,
  AlertCircle,
  Instagram,
  Youtube,
  Video,
} from "lucide-react";
import Link from "next/link";

interface ContentDetailModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ContentItem) => void;
  onDuplicate: (item: ContentItem, shiftDays: number) => Promise<void>;
  onStatusChange: (item: ContentItem, newStatus: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export function ContentDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ContentDetailModalProps) {
  const [shiftDays, setShiftDays] = useState(7);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen || !item) return null;

  const handleDuplicate = async () => {
    setIsActionLoading(true);
    try {
      await onDuplicate(item, shiftDays);
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkPublished = async () => {
    setIsActionLoading(true);
    try {
      await onStatusChange(item, "Published");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsActionLoading(true);
    try {
      await onStatusChange(item, "Archived");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      data-testid="content-detail-modal"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-cine-card border border-cine-border shadow-2xl p-5 sm:p-6 space-y-6 text-left">
        {/* Header with Title and Close */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-cine-border/50">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" size="sm">
                {item.platform}
              </Badge>
              <Badge
                variant={
                  item.status === "Published"
                    ? "emerald"
                    : item.status === "Ready to Publish"
                    ? "amber"
                    : "neutral"
                }
                size="sm"
              >
                {item.status}
              </Badge>
              {item.priority === "Urgent" && (
                <Badge variant="rose" size="sm">
                  Urgent
                </Badge>
              )}
            </div>
            <h3
              id="detail-modal-title"
              className="text-lg sm:text-xl font-bold text-white leading-snug break-words"
            >
              {item.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cine-surface shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date and Timing Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-cine-surface/40 border border-cine-border/40 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cine-accent shrink-0" />
            <span>
              Target Date:{" "}
              <strong className="text-white">
                {formatDateString(item.scheduled_date, "full")}
              </strong>
            </span>
          </div>

          {item.scheduled_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Time: {item.scheduled_time}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Concept Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-cine-bg/60 p-3 rounded-lg border border-cine-border/40">
              {item.description}
            </p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-cine-surface/30 border border-cine-border/30 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Content Type
            </span>
            <span className="text-white font-medium">{item.content_type}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-cine-surface/30 border border-cine-border/30 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Pillar
            </span>
            <span className="text-white font-medium">
              {item.content_pillar || "General"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-cine-surface/30 border border-cine-border/30 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Language
            </span>
            <span className="text-white font-medium">{item.language}</span>
          </div>
        </div>

        {/* CTA */}
        {item.cta && (
          <div className="p-2.5 rounded-lg bg-cine-accent/10 border border-cine-accent/30 text-xs flex items-center gap-2">
            <span className="font-mono font-semibold text-cine-accent">
              Target CTA:
            </span>
            <span className="text-slate-200">"{item.cta}"</span>
          </div>
        )}

        {/* Linked Script Section */}
        {item.script_summary && (
          <div className="p-3.5 rounded-xl bg-cine-surface/40 border border-cine-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cine-accent" />
                Linked Script: {item.script_summary.title}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                v{item.script_summary.current_version} · {item.script_summary.duration_seconds}s
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/scripts?id=${item.script_id}`}
                className="text-xs text-cine-accent hover:underline flex items-center gap-1 px-2 py-1 rounded bg-cine-surface border border-cine-border"
              >
                <span>Open in Script Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href={`/analyzer?script_id=${item.script_id}`}
                className="text-xs text-slate-300 hover:underline flex items-center gap-1 px-2 py-1 rounded bg-cine-surface border border-cine-border"
              >
                <span>Analyze Retention</span>
              </Link>
              <Link
                href={`/optimizer?script_id=${item.script_id}`}
                className="text-xs text-slate-300 hover:underline flex items-center gap-1 px-2 py-1 rounded bg-cine-surface border border-cine-border"
              >
                <span>Optimize Script</span>
              </Link>
            </div>
          </div>
        )}

        {/* Linked Video Analysis Section */}
        {item.video_analysis_summary && (
          <div className="p-3.5 rounded-xl bg-cine-surface/40 border border-cine-emerald/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-cine-emerald" />
                Linked Video Audit: {item.video_analysis_summary.filename}
              </span>
              <Badge variant="emerald" size="sm">
                Score: {item.video_analysis_summary.overall_score}/100
              </Badge>
            </div>

            {item.video_analysis_summary.top_finding && (
              <p className="text-xs text-slate-300 italic">
                Top finding: "{item.video_analysis_summary.top_finding}"
              </p>
            )}

            <div className="pt-1">
              <Link
                href={`/video-analysis?id=${item.video_analysis_id}`}
                className="text-xs text-cine-emerald hover:underline flex items-center gap-1 px-2 py-1 rounded bg-cine-surface border border-cine-border inline-flex"
              >
                <span>Open Video Analysis</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Planning Notes
            </span>
            <p className="text-xs text-slate-300 whitespace-pre-wrap p-2.5 rounded bg-cine-bg/60 border border-cine-border/30">
              {item.notes}
            </p>
          </div>
        )}

        {/* Delete Confirmation Box if active */}
        {showDeleteConfirm && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-cine-rose" />
              <span>Are you sure you want to delete this scheduled item?</span>
            </div>
            <p className="text-slate-300">
              This action cannot be undone. Linked scripts and video analyses will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!showDeleteConfirm && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-cine-border/50">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-rose-400 hover:text-rose-300 border-rose-900/50 hover:bg-rose-950/20"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.status !== "Published" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkPublished}
                  disabled={isActionLoading}
                  className="text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/20"
                  leftIcon={<CalendarCheck className="w-3.5 h-3.5" />}
                >
                  Mark Published
                </Button>
              )}

              {item.status !== "Archived" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={isActionLoading}
                  className="text-slate-400 border-slate-700 hover:bg-slate-800"
                  leftIcon={<Archive className="w-3.5 h-3.5" />}
                >
                  Archive
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isActionLoading}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Duplicate (+{shiftDays}d)
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onEdit(item)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Item
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
