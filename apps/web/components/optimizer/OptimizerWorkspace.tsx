"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  History,
  Activity,
  Globe,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Script, ScriptVersion } from "../../types/script";
import type {
  OptimizationGoalKey,
  ScriptOptimizationResponse,
} from "../../types/optimizer";
import {
  getOptimizerHandoff,
  deriveRecommendedOptimizationGoals,
} from "../../types/optimizer";
import type { ScriptAnalysisResponse } from "../../types/analyzer";
import { OptimizationGoalSelector } from "./OptimizationGoalSelector";
import { OptimizationScoreComparison } from "./OptimizationScoreComparison";
import { BeforeAfterScriptView } from "./BeforeAfterScriptView";
import { ChangesSummary } from "./ChangesSummary";
import { OptimizerToolbar } from "./OptimizerToolbar";
import { OptimizerScriptSelector } from "./OptimizerScriptSelector";
import { AnalyzerFindingsCard } from "./AnalyzerFindingsCard";

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
  const [recommendedGoals, setRecommendedGoals] = useState<OptimizationGoalKey[]>([]);
  const [analyzerContext, setAnalyzerContext] = useState<ScriptAnalysisResponse | null>(null);
  const [instructions, setInstructions] = useState<string>("");

  const [customScriptText, setCustomScriptText] = useState<string | null>(null);
  const [customSourceType, setCustomSourceType] = useState<string | null>(null);
  const [customLanguage, setCustomLanguage] = useState<string | null>("English");

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
    if (id === "custom") return;
    setIsLoadingScript(true);
    setError(null);
    setOptimizationResult(null);
    setSuccessMessage(null);
    try {
      const script = await api.getScript(id);
      setCurrentScript(script);
      if (script?.language) {
        setCustomLanguage(script.language);
      }

      // Load version history
      try {
        const versions = await api.getScriptVersions(id);
        setVersionHistory(versions);
      } catch (_) {}

      // Auto-populate analyzer context if none is loaded yet
      if (typeof api.analyzeScriptById === "function") {
        api.analyzeScriptById(id)
          .then((analysisData) => {
            if (analysisData) {
              setAnalyzerContext((prev) => prev || analysisData);
              const derived = deriveRecommendedOptimizationGoals(analysisData);
              setRecommendedGoals(derived);
              if (derived.length > 0) {
                setSelectedGoals(derived);
              }
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load the selected script.");
      setCurrentScript(null);
    } finally {
      setIsLoadingScript(false);
    }
  }, []);

  useEffect(() => {
    const handoff = getOptimizerHandoff();
    if (handoff) {
      setAnalyzerContext(handoff.analysis);
      setRecommendedGoals(handoff.recommendedGoals);
      if (handoff.recommendedGoals && handoff.recommendedGoals.length > 0) {
        setSelectedGoals(handoff.recommendedGoals);
      }

      if (handoff.scriptId && handoff.scriptId !== "custom") {
        setCurrentScriptId(handoff.scriptId);
        loadScript(handoff.scriptId);
      } else {
        // Unsaved custom / imported script from unified input or preset
        setCurrentScriptId("custom");
        setCurrentScript({
          id: "custom",
          title: handoff.title || "Custom Screenplay",
          topic: "Short-form Content",
          platform: "Instagram Reels",
          language: handoff.language || "English",
          duration_seconds: handoff.durationSeconds || 30,
          tone: "Cinematic",
          hook: handoff.hook || "Stop scrolling! Here is the retention secret.",
          segments: handoff.segments || [],
          cta: handoff.cta || "Save this for your next shoot!",
          provider_used: handoff.sourceType || "unified_input",
          current_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          versions: [],
        });
        setCustomScriptText(handoff.scriptText || null);
        setCustomSourceType(handoff.sourceType || "text");
        setCustomLanguage(handoff.language || "English");
      }
    } else if (initialScriptId) {
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
    setAnalyzerContext(null);
    setRecommendedGoals([]);
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
      let response: ScriptOptimizationResponse;

      const targetLanguage = customLanguage || currentScript.language || "English";
      if (currentScriptId === "custom") {
        response = await api.optimizeScript("custom", {
          goals: selectedGoals,
          instructions: instructions.trim() ? instructions : undefined,
          script_text: customScriptText || undefined,
          title: currentScript.title,
          language: targetLanguage,
          duration_seconds: currentScript.duration_seconds,
          hook: currentScript.hook,
          segments: currentScript.segments,
          cta: currentScript.cta,
        });
      } else {
        response = await api.optimizeScript(currentScriptId, {
          goals: selectedGoals,
          instructions: instructions.trim() ? instructions : undefined,
          language: targetLanguage,
        });
      }

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

      if (currentScriptId === "custom") {
        // Save unsaved custom script as Version 1 into Studio
        const scriptText = [
          `HOOK: ${optScript.hook}`,
          "",
          ...optScript.segments.map(
            (s, i) =>
              `[${s.start_time} - ${s.end_time}] ${s.section}: ${s.voiceover}`
          ),
          "",
          `CTA: ${optScript.cta}`,
        ].join("\n");

        const savedScript = await api.saveImportedScript({
          title: optScript.title,
          topic: optScript.topic || "Screenplay",
          platform: optScript.platform || "Instagram Reels",
          language: optScript.language || "English",
          duration_seconds: optScript.duration_seconds || 30,
          text: scriptText,
        });

        setCurrentScriptId(savedScript.id);
        setCurrentScript(savedScript);
        setOptimizationResult((prev) =>
          prev ? { ...prev, is_saved: true, script_id: savedScript.id } : null
        );
        setSuccessMessage(
          `Saved as new version (v1) in Script Studio! Preserved in immutable version history.`
        );

        try {
          const versions = await api.getScriptVersions(savedScript.id);
          setVersionHistory(versions);
        } catch (_) {}
      } else {
        // Commit new immutable ScriptVersion to existing script
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
          `Successfully committed changes as Version ${updatedScript.current_version}! Original version preserved in immutable history.`
        );

        try {
          const versions = await api.getScriptVersions(currentScriptId);
          setVersionHistory(versions);
        } catch (_) {}
      }
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
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-semibold text-emerald-200">Saved as New Version</strong>
              <span>{successMessage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentScriptId && currentScriptId !== "custom" && (
              <>
                <Link
                  href={`/scripts?script_id=${currentScriptId}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition"
                >
                  View in Studio
                </Link>
                <Link
                  href={`/analyzer?script_id=${currentScriptId}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  <span>Re-audit Retention</span>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white text-xs underline px-2"
            >
              Dismiss
            </button>
          </div>
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
            href="/scripts"
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
          {/* Unsaved Custom Script Disclosure Banner */}
          {currentScriptId === "custom" && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Optimizing draft from <strong>{customSourceType?.toUpperCase() || "UNIFIED INPUT"}</strong>. Optimization preview is non-mutating. You can approve and commit as Version 1 to Script Studio below.
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                Draft in Memory
              </span>
            </div>
          )}

          {/* Diagnostic Context Forwarded from Analyzer */}
          {analyzerContext && (
            <AnalyzerFindingsCard
              analysis={analyzerContext}
              selectedGoals={selectedGoals}
              onApplyGoals={(goals) => setSelectedGoals(goals)}
              scriptId={currentScriptId !== "custom" ? currentScriptId : null}
            />
          )}

          {/* Script Language Selection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#12131a] border border-[#232738] rounded-xl shadow-md">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Script Language:</span>
              <div className="flex items-center gap-1 bg-[#181a26] p-1 rounded-lg border border-[#262b3d]">
                {(["English", "Telugu", "Tanglish"] as const).map((lang) => {
                  const currentLang = customLanguage || currentScript.language || "English";
                  const isActive = currentLang.toLowerCase() === lang.toLowerCase();
                  return (
                    <button
                      key={lang}
                      type="button"
                      disabled={isOptimizing}
                      onClick={() => {
                        setCustomLanguage(lang);
                        setCurrentScript((prev) => (prev ? { ...prev, language: lang } : null));
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        isActive
                          ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {lang === "Telugu" ? "తెలుగు (Telugu)" : lang === "Tanglish" ? "Tanglish (te-Latn)" : "English"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Optimization Output Language:</span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                {customLanguage || currentScript.language || "English"}
              </span>
            </div>
          </div>

          {/* Target Retention Goals Selector */}
          <OptimizationGoalSelector
            selectedGoals={selectedGoals}
            recommendedGoals={recommendedGoals}
            onToggleGoal={handleToggleGoal}
            onSelectAll={handleSelectAllGoals}
            onClearAll={handleClearAllGoals}
            instructions={instructions}
            onInstructionsChange={setInstructions}
            disabled={isOptimizing || isSaving}
            language={customLanguage || currentScript.language || "English"}
          />

          {/* Trigger Optimization Action Bar (if not yet run) */}
          {!optimizationResult && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#12131a] border border-[#232738] rounded-2xl shadow-xl">
              <div className="text-xs text-slate-400">
                Ready to optimize <strong className="text-white">&ldquo;{currentScript.title}&rdquo;</strong> ({currentScriptId === "custom" ? "Draft" : `v${currentScript.current_version}`}) across <strong className="text-cyan-300">{selectedGoals.length}</strong> retention vectors.
              </div>

              <button
                type="button"
                onClick={handleRunOptimization}
                disabled={isOptimizing || selectedGoals.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-400 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-cyan-950/50 self-start sm:self-auto"
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
                scriptId={currentScriptId || undefined}
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
