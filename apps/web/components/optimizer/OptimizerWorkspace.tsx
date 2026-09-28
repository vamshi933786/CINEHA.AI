"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  FileEdit,
  History,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Script, ScriptVersion } from "../../types/script";
import type {
  OptimizationGoalKey,
  ScriptOptimizationResponse,
} from "../../types/optimizer";
import { OptimizationGoalSelector } from "./OptimizationGoalSelector";
import { OptimizationScoreComparison } from "./OptimizationScoreComparison";
import { BeforeAfterScriptView } from "./BeforeAfterScriptView";
import { ChangesSummary } from "./ChangesSummary";
import { OptimizerToolbar } from "./OptimizerToolbar";
import { OptimizerScriptSelector } from "./OptimizerScriptSelector";

export const OptimizerWorkspace: React.FC = () => {
  const searchParams = useSearchParams();
  const initialScriptId = searchParams.get("script_id");

  const [currentScriptId, setCurrentScriptId] = useState<string | null>(initialScriptId);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<OptimizationGoalKey[]>([
    "improve_hook",
    "improve_pacing",
    "remove_filler",
  ]);
  const [instructions, setInstructions] = useState<string>("");

  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] =
    useState<ScriptOptimizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<ScriptVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);

  // Load script when currentScriptId changes
  const loadScript = useCallback(async (id: string) => {
    setIsLoadingScript(true);
    setError(null);
    setOptimizationResult(null);
    setSuccessMessage(null);
    try {
      const script = await api.getScript(id);
      setCurrentScript(script);

      // Load versions
      try {
        const versions = await api.getScriptVersions(id);
        setVersionHistory(versions);
      } catch (_) {}
    } catch (err: any) {
      setError(err?.message || "Failed to load the selected script.");
      setCurrentScript(null);
    } finally {
      setIsLoadingScript(false);
    }
  }, []);

  useEffect(() => {
    if (initialScriptId) {
      setCurrentScriptId(initialScriptId);
      loadScript(initialScriptId);
    } else {
      // Fetch latest script to set as default if available
      api.getScripts(1)
        .then((scripts) => {
          if (scripts && scripts.length > 0) {
            setCurrentScriptId(scripts[0].id);
            loadScript(scripts[0].id);
          }
        })
        .catch(() => {});
    }
  }, [initialScriptId, loadScript]);

  const handleSelectScriptId = (id: string) => {
    setCurrentScriptId(id);
    loadScript(id);
  };

  const handleToggleGoal = (goal: OptimizationGoalKey) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSelectAllGoals = () => {
    setSelectedGoals([
      "improve_hook",
      "improve_pacing",
      "remove_filler",
      "strengthen_curiosity",
      "improve_cta",
      "general_retention",
    ]);
  };

  const handleClearAllGoals = () => {
    setSelectedGoals([]);
  };

  const handleRunOptimization = async () => {
    if (!currentScriptId || !currentScript) {
      setError("Please select or load a screenplay first.");
      return;
    }

    if (selectedGoals.length === 0) {
      setError("Please select at least one retention goal to optimize.");
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.optimizeScript(currentScriptId, {
        goals: selectedGoals,
        instructions: instructions.trim() ? instructions : undefined,
      });

      setOptimizationResult(response);
    } catch (err: any) {
      setError(err?.message || "An error occurred while optimizing the script.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveOptimizedVersion = async () => {
    if (!currentScriptId || !optimizationResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const optScript = optimizationResult.optimized_script;
      const goalsList = optimizationResult.optimization_goals.join(", ");
      const changeSummary = `Optimized for [${goalsList}] via ${optimizationResult.provider_used}`;

      const updatedScript = await api.saveOptimizedScript(currentScriptId, {
        title: optScript.title,
        hook: optScript.hook,
        segments: optScript.segments,
        cta: optScript.cta,
        change_summary: changeSummary,
      });

      setCurrentScript(updatedScript);
      setOptimizationResult((prev) => (prev ? { ...prev, is_saved: true } : null));
      setSuccessMessage(
        `Successfully committed changes as Version ${updatedScript.current_version}! Previous versions preserved in immutable history.`
      );

      // Refresh version list
      try {
        const versions = await api.getScriptVersions(currentScriptId);
        setVersionHistory(versions);
      } catch (_) {}
    } catch (err: any) {
      setError(err?.message || "Failed to commit optimized version.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Script Selector Header */}
      <OptimizerScriptSelector
        currentScriptId={currentScriptId}
        onSelectScriptId={handleSelectScriptId}
        isLoading={isLoadingScript || isOptimizing}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5">Optimization Notice</strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs flex items-start gap-3 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5">Version Committed</strong>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* No script selected empty state */}
      {!currentScript && !isLoadingScript && (
        <div className="p-12 text-center rounded-2xl border border-[#232738] bg-[#12131a] shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            No Screenplay Selected
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            Select a saved screenplay using the selector above or generate a new one in AI Script Studio to start optimizing for viewer retention.
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-400 transition shadow-lg shadow-cyan-950/40"
          >
            <Sparkles className="w-4 h-4" />
            Go to AI Script Studio
          </Link>
        </div>
      )}

      {/* Main Content when script is selected */}
      {currentScript && (
        <>
          {/* Target Retention Goals Selector */}
          <OptimizationGoalSelector
            selectedGoals={selectedGoals}
            onToggleGoal={handleToggleGoal}
            onSelectAll={handleSelectAllGoals}
            onClearAll={handleClearAllGoals}
            instructions={instructions}
            onInstructionsChange={setInstructions}
            disabled={isOptimizing || isSaving}
          />

          {/* Trigger Optimization Action Bar (if not yet run) */}
          {!optimizationResult && (
            <div className="flex items-center justify-between p-4 bg-[#12131a] border border-[#232738] rounded-2xl shadow-xl">
              <div className="text-xs text-slate-400">
                Ready to optimize <strong className="text-white">&ldquo;{currentScript.title}&rdquo;</strong> (v{currentScript.current_version}) across <strong className="text-cyan-300">{selectedGoals.length}</strong> retention vectors.
              </div>

              <button
                type="button"
                onClick={handleRunOptimization}
                disabled={isOptimizing || selectedGoals.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-400 transition flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-cyan-950/50"
              >
                <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
                {isOptimizing ? "Optimizing Retention..." : "Run Script Optimization"}
              </button>
            </div>
          )}

          {/* Optimization Results Section */}
          {optimizationResult && (
            <div className="space-y-6">
              {/* Toolbar */}
              <OptimizerToolbar
                scriptId={currentScript.id}
                currentVersion={currentScript.current_version}
                isSaving={isSaving}
                isOptimizing={isOptimizing}
                isSaved={optimizationResult.is_saved}
                providerUsed={optimizationResult.provider_used}
                optimizedScript={optimizationResult.optimized_script}
                onSaveVersion={handleSaveOptimizedVersion}
                onRunOptimization={handleRunOptimization}
              />

              {/* Score Delta Comparison */}
              <OptimizationScoreComparison
                beforeAnalysis={optimizationResult.analysis_before}
                afterAnalysis={optimizationResult.analysis_after}
              />

              {/* Audit Trail of Changes */}
              <ChangesSummary changes={optimizationResult.changes_made} />

              {/* Full Before & After Screenplay View */}
              <BeforeAfterScriptView
                originalScript={optimizationResult.original_script}
                optimizedScript={optimizationResult.optimized_script}
              />
            </div>
          )}

          {/* Version History Toggle Card */}
          {versionHistory.length > 0 && (
            <div className="bg-[#12131a] border border-[#232738] rounded-2xl p-4 shadow-xl">
              <button
                type="button"
                onClick={() => setShowVersionHistory((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>
                    Immutable Version History ({versionHistory.length} Versions Recorded)
                  </span>
                </div>
                <span className="text-slate-500 hover:text-slate-300">
                  {showVersionHistory ? "Hide History" : "View History"}
                </span>
              </button>

              {showVersionHistory && (
                <div className="mt-4 pt-4 border-t border-[#232738] space-y-2">
                  {versionHistory.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-[#161824] border border-[#232738] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px]">
                          v{v.version_number}
                        </span>
                        <div>
                          <strong className="text-white block">{v.title}</strong>
                          <span className="text-[11px] text-slate-400">
                            {v.change_summary || "Initial version"}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
