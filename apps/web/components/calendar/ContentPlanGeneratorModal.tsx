"use client";

import React, { useState } from "react";
import type {
  ContentPlanSuggestion,
  GenerateContentPlanResponse,
} from "@/types/calendar";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Sparkles,
  Calendar,
  Check,
  Plus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";

interface ContentPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuggestions: (suggestions: ContentPlanSuggestion[]) => Promise<void>;
}

export function ContentPlanGeneratorModal({
  isOpen,
  onClose,
  onAddSuggestions,
}: ContentPlanGeneratorModalProps) {
  const [periodDays, setPeriodDays] = useState(7);
  const [frequency, setFrequency] = useState("3/week");
  const [goalsInput, setGoalsInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<GenerateContentPlanResponse | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const goals = goalsInput
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await api.generateContentPlan({
        planning_period_days: periodDays,
        posting_frequency: frequency,
        content_goals: goals.length > 0 ? goals : undefined,
      });

      setPlanResult(res);
      // Select all by default
      setSelectedIndices(res.suggestions.map((_, i) => i));
    } catch (err: any) {
      setError(err.message || "Failed to generate content plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectIndex = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const handleAddSelected = async () => {
    if (!planResult) return;
    const toAdd = selectedIndices.map((i) => planResult.suggestions[i]);
    if (toAdd.length === 0) return;

    setIsAdding(true);
    try {
      await onAddSuggestions(toAdd);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add items to calendar.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddAll = async () => {
    if (!planResult) return;
    setIsAdding(true);
    try {
      await onAddSuggestions(planResult.suggestions);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add items to calendar.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generator-modal-title"
      data-testid="content-plan-generator-modal"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-cine-card border border-cine-border shadow-2xl p-5 sm:p-6 space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cine-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cine-accent" />
            <h3
              id="generator-modal-title"
              className="text-base sm:text-lg font-bold text-white font-mono"
            >
              AI Content Planning Assistant
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cine-surface"
            aria-label="Close generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-cine-rose" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Configuration Form */}
        {!planResult && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesize a multi-day publishing schedule based on your creator persona,
              core content pillars, and desired cadence. Suggestions will be previewed below
              before anything is added to your calendar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Planning Period */}
              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Planning Horizon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPeriodDays(days)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                        periodDays === days
                          ? "bg-cine-accent text-white border-cine-accent shadow-sm"
                          : "bg-cine-surface text-slate-300 border-cine-border hover:bg-cine-card"
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Posting Frequency */}
              <div className="space-y-1">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Target Posting Cadence
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
                >
                  <option value="1/week">1 post per week</option>
                  <option value="2/week">2 posts per week</option>
                  <option value="3/week">3 posts per week (Recommended)</option>
                  <option value="5/week">5 posts per week</option>
                  <option value="Daily">Daily posts</option>
                </select>
              </div>
            </div>

            {/* Custom Focus / Goals */}
            <div className="space-y-1">
              <label
                htmlFor="plan-goals"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Special Focus or Goals (Optional)
              </label>
              <input
                id="plan-goals"
                type="text"
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
                placeholder="e.g. Budget lighting tips, Camera moves, Smartphone tutorials"
                className="w-full px-3 py-2 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cine-accent"
              />
            </div>

            {/* Generate Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleGenerate}
                isLoading={isLoading}
                leftIcon={<Sparkles className="w-4 h-4" />}
                data-testid="generate-plan-submit-btn"
              >
                {isLoading ? "Generating Content Plan..." : "Generate Content Plan"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Suggestions Preview */}
        {planResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-cine-surface/50 border border-cine-border/50 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={planResult.is_ai_generated ? "accent" : "neutral"} size="sm">
                  {planResult.is_ai_generated ? "Gemini Synthesized" : "Persona Matched"}
                </Badge>
                <span className="text-slate-300">{planResult.summary_note}</span>
              </div>
              <button
                type="button"
                onClick={() => setPlanResult(null)}
                className="text-cine-accent hover:underline text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Change Criteria
              </button>
            </div>

            {/* Suggestions Checklist */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {planResult.suggestions.map((sug, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectIndex(idx)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? "bg-cine-accent/10 border-cine-accent/60 shadow-md"
                        : "bg-cine-bg/60 border-cine-border/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectIndex(idx)}
                          className="mt-0.5 rounded border-cine-border text-cine-accent focus:ring-cine-accent"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-bold text-cine-accent">
                              {sug.suggested_date}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cine-surface border text-[10px] text-slate-300">
                              {sug.content_pillar}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cine-surface border text-[10px] text-slate-300">
                              {sug.content_type}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-white">
                            {sug.title}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pl-6">
                      {sug.description}
                    </p>

                    {sug.rationale && (
                      <div className="pl-6 text-[11px] text-slate-400 italic">
                        Rationale: {sug.rationale}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-cine-border/50">
              <span className="text-xs font-mono text-slate-400">
                {selectedIndices.length} of {planResult.suggestions.length} selected
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isAdding}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddSelected}
                  disabled={selectedIndices.length === 0}
                  isLoading={isAdding}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  data-testid="add-selected-plan-btn"
                >
                  Add Selected ({selectedIndices.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
