"use client";

import React, { useState } from "react";
import { useCreatorProfile } from "@/providers/CreatorProfileProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProfileSummaryCard } from "@/components/profile/ProfileSummaryCard";
import { ProfileForm } from "@/components/profile/ProfileForm";
import {
  Sparkles,
  Edit3,
  UserCheck,
  Info,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { profile, isConfigured, isLoading, error, saveProfile, refreshProfile } =
    useCreatorProfile();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (data: any) => {
    await saveProfile(data);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Creator Profile & Persona Engine"
        description="Define your creator identity, content niche, target audience, platforms, language, and communication style. This persona directly guides all downstream AI generation pipelines."
        breadcrumbs={[{ label: "Creator Profile" }]}
        badge={
          isConfigured ? (
            <Badge variant="emerald" size="md">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-cine-emerald" />
              Configured & Active
            </Badge>
          ) : (
            <Badge variant="amber" size="md">
              <Info className="w-3.5 h-3.5 mr-1 text-cine-amber" />
              Profile Not Created
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {isConfigured && !isEditing && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Profile
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

      {/* View Mode: Profile Summary Card */}
      {!isLoading && isConfigured && profile && !isEditing && (
        <div className="space-y-6">
          <ProfileSummaryCard
            profile={profile}
            onEdit={() => setIsEditing(true)}
          />

          {/* Integration Note */}
          <div className="p-4 rounded-xl bg-cine-surface/80 border border-cine-border/60 text-xs leading-relaxed text-slate-400 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-cine-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">
                Persona Injection Active:
              </span>{" "}
              Your language preference (
              <strong className="text-cine-accent font-medium">
                {profile.primary_language}
              </strong>
              ) and selected tones (
              <span className="text-slate-300">
                {profile.content_tones.join(", ")}
              </span>
              ) will be automatically injected into the Hook Generator, Script Studio, and Multi-Agent Orchestrator workflows.
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode OR Empty State Form */}
      {!isLoading && (!isConfigured || isEditing) && (
        <div className="space-y-6">
          {!isConfigured && (
            <div className="p-4 rounded-xl bg-cine-card/80 border border-cine-border/70 flex items-start gap-3">
              <PlusCircle className="w-5 h-5 text-cine-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Welcome! Set Up Your Creator Profile
                </h4>
                <p className="text-xs text-cine-muted mt-0.5 leading-relaxed">
                  Fill in your creator persona below. These preferences will be persisted in your relational database and automatically applied across all script generation and research workflows.
                </p>
              </div>
            </div>
          )}

          <ProfileForm
            initialData={profile}
            onSave={handleSave}
            onCancel={isConfigured ? () => setIsEditing(false) : undefined}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
