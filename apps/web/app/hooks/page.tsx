"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCreatorProfile } from "@/providers/CreatorProfileProvider";
import { api } from "@/lib/api";
import {
  HOOK_TAXONOMIES,
  HookItem,
  HookGenerationResponse,
} from "@/types/hook";
import { PLATFORM_OPTIONS, LANGUAGE_OPTIONS } from "@/types/creatorProfile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HookCard } from "@/components/hooks/HookCard";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Bookmark,
  User,
  ArrowRight,
  Filter,
  CheckCheck,
} from "lucide-react";

export default function HookGeneratorPage() {
  const { profile, isConfigured } = useCreatorProfile();

  // Form State
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [platform, setPlatform] = useState<string>("Instagram Reels");
  const [language, setLanguage] = useState<string>("English");
  const [count, setCount] = useState<number>(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    ...HOOK_TAXONOMIES,
  ]);

  // Synchronize language and platform with creator profile once loaded
  useEffect(() => {
    if (profile) {
      if (profile.primary_language) {
        setLanguage(profile.primary_language);
      }
      if (profile.platforms && profile.platforms.length > 0) {
        setPlatform(profile.platforms[0]);
      }
    }
  }, [profile]);

  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generationResponse, setGenerationResponse] =
    useState<HookGenerationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedHooks, setSavedHooks] = useState<HookItem[]>([]);
  const [activeTab, setActiveTab] = useState<"generated" | "saved">("generated");

  // Loading message animation cycle
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const loadingMessages = [
    "Analyzing your creator persona and audience...",
    "Generating 9-taxonomy psychological hook structures...",
    "Crafting visual framing and vocal delivery cues...",
  ];

  // Category toggle handlers
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories([...HOOK_TAXONOMIES]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!topic.trim()) {
      setErrorMessage("Please enter a topic or core subject for your hook.");
      return;
    }

    setIsGenerating(true);
    setActiveTab("generated");

    try {
      const response = await api.generateHooks({
        topic: topic.trim(),
        context: context.trim() || undefined,
        platform,
        language,
        count,
        categories:
          selectedCategories.length === HOOK_TAXONOMIES.length
            ? undefined
            : selectedCategories,
        creator_profile: profile || undefined,
      });

      setGenerationResponse(response);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to generate hooks. Please verify backend connectivity."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Save hook locally
  const toggleSaveHook = (hook: HookItem) => {
    if (savedHooks.some((h) => h.id === hook.id)) {
      setSavedHooks(savedHooks.filter((h) => h.id !== hook.id));
    } else {
      setSavedHooks([...savedHooks, hook]);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Hook Generator"
        description="Engineer original, scroll-stopping openings across 9 psychological taxonomies tailored for 0–3 second retention."
        breadcrumbs={[{ label: "Hook Generator" }]}
        badge={
          <Badge variant="accent" size="md">
            <Sparkles className="w-3 h-3 mr-1" />
            9-Taxonomy Engine
          </Badge>
        }
        actions={
          savedHooks.length > 0 ? (
            <Button
              variant={activeTab === "saved" ? "primary" : "secondary"}
              size="sm"
              onClick={() =>
                setActiveTab(activeTab === "saved" ? "generated" : "saved")
              }
              leftIcon={<Bookmark className="w-3.5 h-3.5" />}
            >
              Saved Hooks ({savedHooks.length})
            </Button>
          ) : undefined
        }
      />

      {/* Creator Profile Warning if unconfigured */}
      {!isConfigured && (
        <div
          role="region"
          aria-label="Profile setup reminder"
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Personalization Notice:</strong> Complete your Creator Profile to personalize your hooks with your niche, audience, and signature tones.
            </span>
          </div>

          <Link href="/profile" className="shrink-0">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto text-amber-200 border-amber-500/30">
              Set Up Creator Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Main Input Form */}
      <Card className="border-cine-border/80 shadow-lg">
        <CardHeader className="pb-4 border-b border-cine-border/50">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cine-accent" />
            Hook Parameters
          </CardTitle>
          <CardDescription className="text-xs">
            Define your core subject and let the AI generate high-retention openings with visual choreography cues.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Row 1: Topic and Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label
                  htmlFor="hook-topic"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Topic or Premise <span className="text-cine-rose">*</span>
                </label>
                <input
                  id="hook-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 3 Golden Rules for Smooth Gimbal Movements"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent min-h-[44px]"
                  disabled={isGenerating}
                />
                <span className="text-[11px] text-cine-muted">
                  What is the core subject of your short-form video?
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hook-context"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Optional Angle or Context
                </label>
                <input
                  id="hook-context"
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. For beginner creators using budget phone gimbals"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent min-h-[44px]"
                  disabled={isGenerating}
                />
                <span className="text-[11px] text-cine-muted">
                  Add target angle, equipment, or specific scenario.
                </span>
              </div>
            </div>

            {/* Row 2: Platform, Language, Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              {/* Platform */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Target Platform
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PLATFORM_OPTIONS.map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlatform(plat)}
                      disabled={isGenerating}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border text-center truncate transition-colors min-h-[40px] ${
                        platform === plat
                          ? "bg-cine-accent text-white border-cine-accent font-semibold shadow-sm"
                          : "bg-cine-card hover:bg-cine-surface text-slate-300 border-cine-border"
                      }`}
                      title={plat}
                    >
                      {plat.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Script Language
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      disabled={isGenerating}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition-colors min-h-[40px] ${
                        language === lang
                          ? "bg-cine-accent text-white border-cine-accent font-semibold shadow-sm"
                          : "bg-cine-card hover:bg-cine-surface text-slate-300 border-cine-border"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of hooks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Hook Quantity
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      disabled={isGenerating}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition-colors min-h-[40px] font-mono ${
                        count === num
                          ? "bg-cine-accent text-white border-cine-accent font-semibold shadow-sm"
                          : "bg-cine-card hover:bg-cine-surface text-slate-300 border-cine-border"
                      }`}
                    >
                      {num} Hooks
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: 9 Hook Categories Selector */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Selected Taxonomies ({selectedCategories.length}/9)
                </label>
                <button
                  type="button"
                  onClick={selectAllCategories}
                  disabled={isGenerating}
                  className="text-xs text-cine-accent hover:underline focus:outline-none flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Select All 9
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {HOOK_TAXONOMIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[38px] flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-cine-accent/20 border-cine-accent text-indigo-300 shadow-sm"
                          : "bg-cine-card hover:bg-cine-surface text-slate-400 border-cine-border"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-cine-accent" : "bg-slate-600"
                        }`}
                      />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-cine-rose" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-cine-border/50">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Generate {count} Hooks
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading Progress State */}
      {isGenerating && (
        <Card className="p-8 sm:p-12 text-center bg-cine-surface/90 border-cine-accent/40 shadow-xl">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cine-accent/20 border border-cine-accent/40 flex items-center justify-center mx-auto text-cine-accent animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                Generating Short-Form Openings
              </h3>
              <p className="text-xs text-cine-muted font-mono h-5 transition-opacity">
                {loadingMessages[loadingStep]}
              </p>
            </div>

            <div className="w-full bg-cine-card rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cine-accent to-cine-rose h-1.5 w-full animate-pulse" />
            </div>
          </div>
        </Card>
      )}

      {/* Results View: Generated Hooks or Saved Hooks */}
      {!isGenerating && activeTab === "generated" && generationResponse && (
        <section className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cine-border/50">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{generationResponse.count} Hooks Generated</span>
                <Badge variant="emerald" size="sm">
                  Ready
                </Badge>
              </h3>
              <p className="text-xs text-cine-muted mt-0.5">
                Topic: <strong className="text-slate-200">"{topic}"</strong> ·{" "}
                {generationResponse.persona_used ? (
                  <span>
                    Personalized for:{" "}
                    <strong className="text-cine-accent">
                      {generationResponse.persona_used}
                    </strong>
                  </span>
                ) : (
                  <span>Generic Mode</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Regenerate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {generationResponse.hooks.map((hook, index) => (
              <HookCard
                key={hook.id}
                hook={hook}
                index={index}
                isSaved={savedHooks.some((h) => h.id === hook.id)}
                onToggleSave={toggleSaveHook}
              />
            ))}
          </div>
        </section>
      )}

      {/* Saved Hooks Tab */}
      {!isGenerating && activeTab === "saved" && (
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-cine-border/50">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <span>Saved Hooks ({savedHooks.length})</span>
              </h3>
              <p className="text-xs text-cine-muted mt-0.5">
                Hooks bookmarked during your creative sessions
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("generated")}
            >
              Back to Generated Hooks
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {savedHooks.map((hook, index) => (
              <HookCard
                key={hook.id}
                hook={hook}
                index={index}
                isSaved={true}
                onToggleSave={toggleSaveHook}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
