"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Compass,
  History,
  Sparkles,
  ArrowUpDown,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  Calendar,
} from "lucide-react";
import { useCreatorProfile } from "@/providers/CreatorProfileProvider";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrendControlBar } from "./TrendControlBar";
import { TrendOpportunityCard } from "./TrendOpportunityCard";
import { ResearchHistoryDrawer } from "./ResearchHistoryDrawer";
import type {
  ResearchLanguage,
  ResearchDepth,
  TimeHorizon,
  TrendOpportunityItem,
  TrendResearchSessionResponse,
  TrendResearchHistoryItem,
} from "@/types/trendResearch";

export function TrendResearchWorkspace() {
  const { profile, isConfigured } = useCreatorProfile();

  // Controls state
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<ResearchLanguage>("English");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("Deep Dive");
  const [horizon, setHorizon] = useState<TimeHorizon>("Current Momentum");
  const [count, setCount] = useState(5);

  // Active Session & Data state
  const [activeSession, setActiveSession] =
    useState<TrendResearchSessionResponse | null>(null);
  const [history, setHistory] = useState<TrendResearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "score" | "momentum" | "urgency" | "audience_fit"
  >("score");

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // Synchronize profile defaults
  useEffect(() => {
    if (profile) {
      if (profile.niche && !niche) setNiche(profile.niche);
      if (profile.target_audience && !audience) setAudience(profile.target_audience);
      if (profile.platforms && profile.platforms.length > 0) {
        setPlatform(profile.platforms[0]);
      }
      if (profile.primary_language) {
        const langLower = profile.primary_language.toLowerCase();
        if (langLower.includes("telugu") || langLower === "te") {
          setLanguage("Telugu");
        } else if (langLower.includes("tanglish")) {
          setLanguage("Tanglish");
        } else {
          setLanguage("English");
        }
      }
    }
  }, [profile]);

  // Load research history on mount
  const loadHistory = useCallback(async () => {
    try {
      const res = await api.getTrendResearchHistory(20);
      setHistory(res.sessions || []);
      // If we don't have an active session, load the most recent one
      if (res.sessions && res.sessions.length > 0 && !activeSession) {
        const latestId = res.sessions[0].id;
        const sessionDetail = await api.getTrendResearchSession(latestId);
        setActiveSession(sessionDetail);
      }
    } catch (err) {
      console.warn("Could not load research history:", err);
    }
  }, [activeSession]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Run opportunity analysis
  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await api.createTrendResearch({
        topic: topic.trim() || undefined,
        niche: niche.trim() || (profile?.niche || undefined),
        target_audience: audience.trim() || (profile?.target_audience || undefined),
        platform,
        language,
        research_depth: depth,
        time_horizon: horizon,
        count,
        creator_profile: profile
          ? {
              creator_name: profile.creator_name,
              niche: profile.niche,
              target_audience: profile.target_audience,
              platforms: profile.platforms,
              primary_language: profile.primary_language,
              content_tones: profile.content_tones,
              creator_bio: profile.creator_bio,
              content_goals: profile.content_goals,
            }
          : undefined,
      });

      setActiveSession(response);
      showToast(`Discovered ${response.opportunities.length} content opportunities!`);
      // Refresh history list
      loadHistory();
    } catch (err: any) {
      showToast(err.message || "Failed to analyze trend opportunities.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Select a session from history
  const handleSelectSession = async (id: string) => {
    try {
      setIsLoading(true);
      const sessionDetail = await api.getTrendResearchSession(id);
      setActiveSession(sessionDetail);
      setIsHistoryOpen(false);
      showToast("Loaded previous research session.");
    } catch (err: any) {
      showToast(err.message || "Failed to load session", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh a session
  const handleRefreshSession = async (id: string) => {
    try {
      setIsLoading(true);
      const refreshed = await api.refreshTrendResearchSession(id);
      setActiveSession(refreshed);
      showToast("Refreshed research session.");
      loadHistory();
    } catch (err: any) {
      showToast(err.message || "Failed to refresh session", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a session
  const handleDeleteSession = async (id: string) => {
    try {
      await api.deleteTrendResearchSession(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
      showToast("Deleted research session from history.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to delete session", "error");
    }
  };

  // Sorted opportunities
  const sortedOpportunities = useMemo(() => {
    if (!activeSession?.opportunities) return [];
    const list = [...activeSession.opportunities];
    switch (sortBy) {
      case "momentum":
        return list.sort((a, b) => b.scores.momentum - a.scores.momentum);
      case "urgency":
        return list.sort((a, b) => b.scores.urgency - a.scores.urgency);
      case "audience_fit":
        return list.sort((a, b) => b.scores.audience_fit - a.scores.audience_fit);
      case "score":
      default:
        return list.sort((a, b) => b.scores.overall_score - a.scores.overall_score);
    }
  }, [activeSession, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm backdrop-blur-md animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header with History Button */}
      <PageHeader
        title="Trend Research Assistant"
        description="Discover high-retention short-form content opportunities personalized to your creator persona, content pillars, and audience interests."
        breadcrumbs={[{ label: "Trend Research" }]}
        badge={
          <Badge variant="accent" size="md">
            <Compass className="w-3.5 h-3.5 mr-1" />
            Short-Form Opportunity Intelligence
          </Badge>
        }
        actions={
          <Button
            onClick={() => setIsHistoryOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>History ({history.length})</span>
          </Button>
        }
      />

      {/* Control Bar */}
      <TrendControlBar
        topic={topic}
        setTopic={setTopic}
        language={language}
        setLanguage={setLanguage}
        platform={platform}
        setPlatform={setPlatform}
        niche={niche}
        setNiche={setNiche}
        audience={audience}
        setAudience={setAudience}
        depth={depth}
        setDepth={setDepth}
        horizon={horizon}
        setHorizon={setHorizon}
        count={count}
        setCount={setCount}
        isLoading={isLoading}
        onAnalyze={handleAnalyze}
        creatorProfile={profile}
      />

      {/* Active Session Content */}
      {activeSession ? (
        <div className="space-y-4 pt-2">
          {/* Active Session Strategic Summary */}
          {activeSession.summary && (
            <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <span>Strategic Opportunity Brief</span>
                  <span className="text-[10px] text-cine-muted font-normal">
                    • {activeSession.platform} • {activeSession.language}
                  </span>
                </div>
                <p className="text-xs text-cine-text leading-relaxed">
                  {activeSession.summary}
                </p>
              </div>
            </div>
          )}

          {/* Results Action Bar: Count & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-cine-text">
                Content Opportunities ({sortedOpportunities.length})
              </h3>
              <span className="text-xs text-cine-muted">
                Sorted by {sortBy === "score" ? "Opportunity Score" : sortBy}
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-cine-muted flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-cine-card border border-cine-border rounded-lg px-2.5 py-1.5 text-xs text-cine-text focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="score">Highest Opportunity Score</option>
                <option value="momentum">Highest Momentum</option>
                <option value="urgency">Highest Urgency</option>
                <option value="audience_fit">Highest Audience Fit</option>
              </select>
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sortedOpportunities.map((opp) => (
              <TrendOpportunityCard
                key={opp.id}
                opportunity={opp}
                onAddedToCalendar={(title) =>
                  showToast(`Scheduled "${title}" to Content Calendar!`)
                }
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-cine-surface border border-dashed border-cine-border rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-cine-text">
            Ready to uncover your next high-retention content?
          </h3>
          <p className="text-xs text-cine-muted max-w-md mx-auto">
            Choose your target language (English, తెలుగు, or Tanglish), enter a seed topic or let our AI curate opportunities directly from your creator persona.
          </p>
          <div className="pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              variant="primary"
              size="md"
              className="px-6 py-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Discover Opportunities Now</span>
            </Button>
          </div>
        </div>
      )}

      {/* History Drawer */}
      <ResearchHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRefreshSession={handleRefreshSession}
      />
    </div>
  );
}
