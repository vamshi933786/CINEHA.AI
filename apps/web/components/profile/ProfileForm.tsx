"use client";

import React, { useState } from "react";
import type {
  CreatorProfile,
  CreatorProfileData,
} from "@/types/creatorProfile";
import {
  NICHE_PRESETS,
  PLATFORM_OPTIONS,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
  GOAL_OPTIONS,
} from "@/types/creatorProfile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  User,
  Film,
  Target,
  Globe,
  Radio,
  Sparkles,
} from "lucide-react";

interface ProfileFormProps {
  initialData?: CreatorProfile | null;
  onSave: (data: CreatorProfileData) => Promise<any>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  creator_name?: string;
  niche?: string;
  primary_language?: string;
  platforms?: string;
  content_tones?: string;
  content_goals?: string;
  creator_bio?: string;
}

export function ProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: ProfileFormProps) {
  // Form State
  const [creatorName, setCreatorName] = useState(
    initialData?.creator_name || ""
  );
  const [niche, setNiche] = useState(initialData?.niche || "Cinematography");
  const [isCustomNiche, setIsCustomNiche] = useState(
    initialData?.niche
      ? !(NICHE_PRESETS as readonly string[]).includes(initialData.niche)
      : false
  );
  const [targetAudience, setTargetAudience] = useState(
    initialData?.target_audience || ""
  );
  const [platforms, setPlatforms] = useState<string[]>(
    initialData?.platforms || ["Instagram Reels", "YouTube Shorts"]
  );
  const [primaryLanguage, setPrimaryLanguage] = useState(
    initialData?.primary_language || "Tanglish"
  );
  const [contentTones, setContentTones] = useState<string[]>(
    initialData?.content_tones || ["Educational", "Cinematic", "Conversational"]
  );
  const [creatorBio, setCreatorBio] = useState(initialData?.creator_bio || "");
  const [contentGoals, setContentGoals] = useState<string[]>(
    initialData?.content_goals || ["Increase retention", "Build personal brand"]
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Toggle multi-select items
  const toggleItem = (
    list: string[],
    item: string,
    setter: (val: string[]) => void
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!creatorName.trim()) {
      newErrors.creator_name = "Creator name is required.";
    }

    if (!niche.trim()) {
      newErrors.niche = "Content niche is required.";
    }

    if (!primaryLanguage.trim()) {
      newErrors.primary_language = "Primary language is required.";
    }

    if (platforms.length === 0) {
      newErrors.platforms = "Select at least one platform.";
    }

    if (contentTones.length === 0) {
      newErrors.content_tones = "Select at least one content tone.";
    }

    if (contentGoals.length === 0) {
      newErrors.content_goals = "Select at least one content goal.";
    }

    if (creatorBio.length > 1000) {
      newErrors.creator_bio = "Bio cannot exceed 1000 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSaveSuccess(false);

    if (!validate()) {
      return;
    }

    try {
      await onSave({
        creator_name: creatorName.trim(),
        niche: niche.trim(),
        target_audience: targetAudience.trim(),
        platforms,
        primary_language: primaryLanguage,
        content_tones: contentTones,
        creator_bio: creatorBio.trim(),
        content_goals: contentGoals,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setServerError(err.message || "Failed to save creator profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Success Alert */}
      {saveSuccess && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-cine-emerald" />
          <div>
            <span className="font-semibold">Profile Saved Successfully!</span>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Your persona preferences are now persisted and ready to guide all AI generation modules.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs sm:text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-cine-rose" />
          <div>
            <span className="font-semibold">Save Failed</span>
            <p className="text-xs text-rose-400/80 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Identity & Story */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-cine-border/50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cine-accent" />
                <CardTitle className="text-base font-semibold">
                  Creator Identity & Niche
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Your personal brand name and primary filmmaking or creator vertical.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Creator Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="creator-name"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Creator Name <span className="text-cine-rose">*</span>
                </label>
                <input
                  id="creator-name"
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Sai Panga / Cinehashoots"
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent min-h-[44px] transition-colors ${
                    errors.creator_name
                      ? "border-rose-500"
                      : "border-cine-border focus:border-cine-accent"
                  }`}
                />
                {errors.creator_name && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.creator_name}
                  </p>
                )}
              </div>

              {/* Niche Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                    Content Niche <span className="text-cine-rose">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomNiche(!isCustomNiche);
                      if (isCustomNiche) setNiche(NICHE_PRESETS[0]);
                      else setNiche("");
                    }}
                    className="text-xs text-cine-accent hover:underline focus:outline-none"
                  >
                    {isCustomNiche ? "Pick Preset Niche" : "Enter Custom Niche"}
                  </button>
                </div>

                {!isCustomNiche ? (
                  <div className="flex flex-wrap gap-2">
                    {NICHE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNiche(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                          niche === preset
                            ? "bg-cine-accent text-white border-cine-accent shadow-sm"
                            : "bg-cine-card hover:bg-cine-surface text-slate-300 border-cine-border"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Enter your custom niche (e.g. Drone Videography)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent min-h-[44px]"
                  />
                )}

                {errors.niche && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.niche}
                  </p>
                )}
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label
                  htmlFor="target-audience"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Target Audience
                </label>
                <textarea
                  id="target-audience"
                  rows={3}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. College students and aspiring creators interested in mobile filmmaking and cinematic camera movements."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent transition-colors resize-none"
                />
                <span className="text-[11px] text-cine-muted">
                  Helps the AI calibrate vocabulary and hook resonance.
                </span>
              </div>

              {/* Creator Bio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="creator-bio"
                    className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Creator Bio / Style Note
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {creatorBio.length}/1000
                  </span>
                </div>
                <textarea
                  id="creator-bio"
                  rows={3}
                  value={creatorBio}
                  onChange={(e) => setCreatorBio(e.target.value)}
                  maxLength={1000}
                  placeholder="Share a short summary of your creative background, equipment preferences, or signature catchphrases."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent transition-colors resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Distribution & Voice */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-cine-border/50">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cine-emerald" />
                <CardTitle className="text-base font-semibold">
                  Distribution & Communication Style
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Platform targeting, bilingual language mode, and tone settings.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Distribution Channels */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Target Distribution Channels <span className="text-cine-rose">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PLATFORM_OPTIONS.map((plat) => {
                    const isSelected = platforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() =>
                          toggleItem(platforms, plat, setPlatforms)
                        }
                        className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 min-h-[44px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                          isSelected
                            ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm"
                            : "bg-cine-card hover:bg-cine-surface text-slate-400 border-cine-border"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                        <span>{plat}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.platforms && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.platforms}
                  </p>
                )}
              </div>

              {/* Primary Language */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Primary Language <span className="text-cine-rose">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = primaryLanguage === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setPrimaryLanguage(lang)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center min-h-[44px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                          isSelected
                            ? "bg-cine-accent text-white border-cine-accent shadow-sm"
                            : "bg-cine-card hover:bg-cine-surface text-slate-300 border-cine-border"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-cine-muted">
                  Supports English, Telugu, and natural bilingual Tanglish code-switching.
                </span>
              </div>

              {/* Content Tones */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Content Delivery Tones <span className="text-cine-rose">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => {
                    const isSelected = contentTones.includes(tone);
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() =>
                          toggleItem(contentTones, tone, setContentTones)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                          isSelected
                            ? "bg-pink-950/60 border-pink-500 text-pink-300 shadow-sm"
                            : "bg-cine-card hover:bg-cine-surface text-slate-400 border-cine-border"
                        }`}
                      >
                        {tone}
                      </button>
                    );
                  })}
                </div>
                {errors.content_tones && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.content_tones}
                  </p>
                )}
              </div>

              {/* Content Goals */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Content Creation Goals <span className="text-cine-rose">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = contentGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() =>
                          toggleItem(contentGoals, goal, setContentGoals)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                          isSelected
                            ? "bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm"
                            : "bg-cine-card hover:bg-cine-surface text-slate-400 border-cine-border"
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
                {errors.content_goals && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.content_goals}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-cine-border/50">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            size="md"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Save Creator Profile
        </Button>
      </div>
    </form>
  );
}
