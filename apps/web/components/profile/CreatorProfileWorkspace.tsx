"use client";

import React, { useState, useEffect } from "react";
import { useCreatorProfile } from "@/providers/CreatorProfileProvider";
import type {
  CreatorProfileData,
  PersonaPreviewResponse,
  ProfileCompleteness,
} from "@/types/creatorProfile";
import {
  computeClientCompleteness,
  computeClientPersonaPreview,
} from "@/lib/profileHelpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { ProfileForm } from "./ProfileForm";
import { CompletenessCard } from "./CompletenessCard";
import { PersonaPreviewPanel } from "./PersonaPreviewPanel";
import {
  Sparkles,
  Edit3,
  UserCheck,
  Info,
  RefreshCw,
  PlusCircle,
  Eye,
  Sliders,
  Layers,
} from "lucide-react";

export function CreatorProfileWorkspace() {
  const {
    profile,
    isConfigured,
    isLoading,
    error,
    saveProfile,
    refreshProfile,
    generatePersonaSummary,
  } = useCreatorProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatorProfileData>>({});
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiGeneratedPreview, setAiGeneratedPreview] =
    useState<PersonaPreviewResponse | null>(null);

  // Initialize form state when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      if (!isConfigured) {
        setIsEditing(true);
      }
    } else if (!isConfigured && !isLoading) {
      setIsEditing(true);
    }
  }, [profile, isConfigured, isLoading]);

  // Compute live completeness: prioritize server completeness in view mode, or live client calculation in edit mode
  const currentCompleteness: ProfileCompleteness = isEditing
    ? computeClientCompleteness(formData)
    : profile?.completeness || computeClientCompleteness(profile || {});

  // Compute live persona preview: prioritize AI generated summary if available, or compute live preview
  const livePreview: PersonaPreviewResponse =
    aiGeneratedPreview ||
    computeClientPersonaPreview(isEditing ? formData : profile || {});

  const handleSave = async (data: CreatorProfileData) => {
    await saveProfile(data);
    setFormData(data);
    setIsEditing(false);
    // Refresh local preview to reflect new authoritative state
    setAiGeneratedPreview(null);
  };

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    try {
      const result = await generatePersonaSummary();
      setAiGeneratedPreview(result);
    } catch {
      // Fallback: provider handles errors
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-testid="creator-profile-workspace">
      {/* Page Header */}
      <PageHeader
        title="Creator Profile & Persona Engine"
        description="Define your creator identity, content pillars, audience persona, voice matrix, and brand rules. This persona directly guides all AI generation pipelines (Hook Generator, Script Studio, and Optimizer)."
        breadcrumbs={[{ label: "Creator Profile" }]}
        badge={
          isConfigured ? (
            <Badge variant="emerald" size="md">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-cine-emerald" />
              Configured & Active ({currentCompleteness.score}% Complete)
            </Badge>
          ) : (
            <Badge variant="amber" size="md">
              <Info className="w-3.5 h-3.5 mr-1 text-cine-amber" />
              Profile Not Configured
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {isConfigured && (
              <Button
                variant={isEditing ? "outline" : "primary"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                leftIcon={
                  isEditing ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )
                }
              >
                {isEditing ? "View Mode" : "Edit Profile"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProfile}
              disabled={isLoading}
              title="Refresh profile from backend"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      {/* Loading Skeleton */}
      {isLoading && !profile && (
        <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-cine-accent border-t-transparent animate-spin" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">
              Connecting to Database
            </h4>
            <p className="text-xs text-cine-muted">
              Retrieving active creator persona preferences...
            </p>
          </div>
        </Card>
      )}

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm"
        >
          {error}
        </div>
      )}

      {/* Unconfigured Welcome Banner */}
      {!isLoading && !isConfigured && (
        <div className="p-4 rounded-xl bg-cine-card/90 border border-cine-accent/40 flex items-start gap-3 shadow-lg">
          <PlusCircle className="w-5 h-5 text-cine-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white">
              Welcome! Configure Your Creator Persona Engine
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Fill in your creator persona below. These preferences are persisted in your local SQLite database and automatically injected into Hook Generator, Script Studio, and Script Optimizer workflows.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      {!isLoading && (profile || !isConfigured) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Work Area: Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {!isEditing && isConfigured && profile ? (
              <div className="space-y-6">
                <ProfileSummaryCard
                  profile={profile}
                  onEdit={() => setIsEditing(true)}
                />

                {/* Persona Injection Banner */}
                <div className="p-4 rounded-xl bg-cine-surface/80 border border-cine-border/60 text-xs leading-relaxed text-slate-400 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-cine-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Persona Injection Active:
                    </span>{" "}
                    Your language (
                    <strong className="text-cine-accent font-medium">
                      {profile.primary_language}
                    </strong>
                    ), tone matrix (
                    <span className="text-slate-300">
                      {(profile.content_tones || []).join(", ")}
                    </span>
                    ), and brand guidelines are active across all AI generation pipelines.
                  </div>
                </div>
              </div>
            ) : (
              <ProfileForm
                initialData={profile}
                onSave={handleSave}
                onCancel={isConfigured ? () => setIsEditing(false) : undefined}
                isLoading={isLoading}
                onChange={setFormData}
              />
            )}
          </div>

          {/* Sticky Sidebar: Right Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            {/* Live AI Persona Preview */}
            <PersonaPreviewPanel
              preview={livePreview}
              onGenerateSummary={isConfigured ? handleGenerateAiSummary : undefined}
              isGenerating={isGeneratingAiSummary}
            />

            {/* Profile Completeness Score & Checklist */}
            <CompletenessCard completeness={currentCompleteness} />
          </div>
        </div>
      )}
    </div>
  );
}
