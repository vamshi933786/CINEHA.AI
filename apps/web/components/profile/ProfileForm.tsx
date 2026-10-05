"use client";

import React, { useState, useEffect } from "react";
import type {
  CreatorProfile,
  CreatorProfileData,
} from "@/types/creatorProfile";
import {
  CREATOR_TYPES,
  NICHE_PRESETS,
  AGE_RANGES,
  SOPHISTICATION_LEVELS,
  TONE_PRESETS,
  ENERGY_PRESETS,
  HUMOR_PRESETS,
  STORYTELLING_PRESETS,
  VOCABULARY_PRESETS,
  LANGUAGE_OPTIONS,
  SCRIPT_PREFERENCES,
  PLATFORM_OPTIONS,
  ASPECT_RATIOS,
  DURATION_OPTIONS,
  CTA_OPTIONS,
  GOAL_OPTIONS,
} from "@/types/creatorProfile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TagListManager } from "./TagListManager";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  User,
  Film,
  Target,
  Radio,
  Globe,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface ProfileFormProps {
  initialData?: CreatorProfile | null;
  onSave: (data: CreatorProfileData) => Promise<any>;
  onCancel?: () => void;
  isLoading?: boolean;
  onChange?: (data: CreatorProfileData) => void;
}

interface FormErrors {
  creator_name?: string;
  niche?: string;
  primary_language?: string;
  platforms?: string;
  content_tones?: string;
  creator_bio?: string;
}

type TabKey = "identity" | "content" | "audience" | "voice" | "preferences" | "brand";

const FORM_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "identity", label: "Identity", icon: User },
  { key: "content", label: "Content & Pillars", icon: Film },
  { key: "audience", label: "Target Audience", icon: Target },
  { key: "voice", label: "Voice & Style", icon: Radio },
  { key: "preferences", label: "Platforms & Lang", icon: Globe },
  { key: "brand", label: "Brand Guidance", icon: ShieldCheck },
];

export function ProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  onChange,
}: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("identity");

  // 1. Profile Identity
  const [creatorName, setCreatorName] = useState(initialData?.creator_name || "");
  const [displayName, setDisplayName] = useState(initialData?.display_name || "");
  const [creatorType, setCreatorType] = useState(initialData?.creator_type || "Filmmaker");
  const [creatorBio, setCreatorBio] = useState(initialData?.creator_bio || "");
  const [location, setLocation] = useState(initialData?.location || "");

  // 2. Content Identity & Pillars
  const [niche, setNiche] = useState(initialData?.niche || "Cinematography");
  const [isCustomNiche, setIsCustomNiche] = useState(
    initialData?.niche ? !(NICHE_PRESETS as readonly string[]).includes(initialData.niche) : false
  );
  const [secondaryNiches, setSecondaryNiches] = useState<string[]>(initialData?.secondary_niches || []);
  const [contentPillars, setContentPillars] = useState<string[]>(initialData?.content_pillars || []);
  const [topicsToAvoid, setTopicsToAvoid] = useState<string[]>(initialData?.topics_to_avoid || []);

  // 3. Audience Persona
  const [targetAudience, setTargetAudience] = useState(initialData?.target_audience || "");
  const [targetAudienceAge, setTargetAudienceAge] = useState(initialData?.target_audience_age || "18–24");
  const [audienceSophistication, setAudienceSophistication] = useState(
    initialData?.audience_sophistication || "Beginner"
  );
  const [audienceInterests, setAudienceInterests] = useState<string[]>(initialData?.audience_interests || []);
  const [audiencePainPoints, setAudiencePainPoints] = useState<string[]>(initialData?.audience_pain_points || []);

  // 4. Voice & Style
  const [contentTones, setContentTones] = useState<string[]>(
    initialData?.content_tones || ["Educational", "Conversational", "Bold"]
  );
  const [energy, setEnergy] = useState(initialData?.energy || "High-energy");
  const [humor, setHumor] = useState(initialData?.humor || "Light");
  const [storytellingStyle, setStorytellingStyle] = useState(
    initialData?.storytelling_style || "Story-driven"
  );
  const [vocabulary, setVocabulary] = useState(initialData?.vocabulary || "Balanced");
  const [customToneNotes, setCustomToneNotes] = useState(initialData?.custom_tone_notes || "");

  // 5. Content & Platform Preferences
  const [primaryLanguage, setPrimaryLanguage] = useState(initialData?.primary_language || "Tanglish");
  const [secondaryLanguages, setSecondaryLanguages] = useState<string[]>(initialData?.secondary_languages || []);
  const [scriptPreference, setScriptPreference] = useState(
    initialData?.script_preference || "Tanglish / Romanized Telugu"
  );
  const [platforms, setPlatforms] = useState<string[]>(
    initialData?.platforms || ["Instagram Reels", "YouTube Shorts"]
  );
  const [preferredAspectRatio, setPreferredAspectRatio] = useState(
    initialData?.preferred_aspect_ratio || "9:16"
  );
  const [typicalDuration, setTypicalDuration] = useState(initialData?.typical_duration || "45 sec");
  const [ctaStyle, setCtaStyle] = useState(initialData?.cta_style || "Save");
  const [secondaryCtaStyles, setSecondaryCtaStyles] = useState<string[]>(initialData?.secondary_cta_styles || []);
  const [contentGoals, setContentGoals] = useState<string[]>(
    initialData?.content_goals || ["Increase retention", "Build personal brand"]
  );

  // 6. Brand Guidance
  const [brandPositioning, setBrandPositioning] = useState(initialData?.brand_positioning || "");
  const [coreMessage, setCoreMessage] = useState(initialData?.core_message || "");
  const [wordsToUse, setWordsToUse] = useState<string[]>(initialData?.words_to_use || []);
  const [wordsToAvoid, setWordsToAvoid] = useState<string[]>(initialData?.words_to_avoid || []);
  const [styleRules, setStyleRules] = useState<string[]>(initialData?.style_rules || []);

  // Status & Validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Helper to compile current state into CreatorProfileData
  const getFormData = (): CreatorProfileData => ({
    creator_name: creatorName.trim(),
    display_name: displayName.trim() || undefined,
    creator_type: creatorType,
    creator_bio: creatorBio.trim() || undefined,
    location: location.trim() || undefined,

    niche: niche.trim(),
    secondary_niches: secondaryNiches,
    content_pillars: contentPillars,
    topics_to_avoid: topicsToAvoid,

    target_audience: targetAudience.trim() || undefined,
    target_audience_age: targetAudienceAge,
    audience_interests: audienceInterests,
    audience_pain_points: audiencePainPoints,
    audience_sophistication: audienceSophistication,

    content_tones: contentTones,
    energy,
    humor,
    storytelling_style: storytellingStyle,
    vocabulary,
    custom_tone_notes: customToneNotes.trim() || undefined,

    primary_language: primaryLanguage,
    secondary_languages: secondaryLanguages,
    script_preference: scriptPreference,
    platforms,
    preferred_aspect_ratio: preferredAspectRatio,
    typical_duration: typicalDuration,
    cta_style: ctaStyle,
    secondary_cta_styles: secondaryCtaStyles,
    content_goals: contentGoals,

    brand_positioning: brandPositioning.trim() || undefined,
    core_message: coreMessage.trim() || undefined,
    words_to_use: wordsToUse,
    words_to_avoid: wordsToAvoid,
    style_rules: styleRules,
  });

  // Notify parent of live changes
  useEffect(() => {
    onChange?.(getFormData());
  }, [
    creatorName,
    displayName,
    creatorType,
    creatorBio,
    location,
    niche,
    secondaryNiches,
    contentPillars,
    topicsToAvoid,
    targetAudience,
    targetAudienceAge,
    audienceSophistication,
    audienceInterests,
    audiencePainPoints,
    contentTones,
    energy,
    humor,
    storytellingStyle,
    vocabulary,
    customToneNotes,
    primaryLanguage,
    secondaryLanguages,
    scriptPreference,
    platforms,
    preferredAspectRatio,
    typicalDuration,
    ctaStyle,
    secondaryCtaStyles,
    contentGoals,
    brandPositioning,
    coreMessage,
    wordsToUse,
    wordsToAvoid,
    styleRules,
  ]);

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleReset = () => {
    if (!initialData) return;
    setCreatorName(initialData.creator_name || "");
    setDisplayName(initialData.display_name || "");
    setCreatorType(initialData.creator_type || "Filmmaker");
    setCreatorBio(initialData.creator_bio || "");
    setLocation(initialData.location || "");

    setNiche(initialData.niche || "Cinematography");
    setIsCustomNiche(
      initialData.niche ? !(NICHE_PRESETS as readonly string[]).includes(initialData.niche) : false
    );
    setSecondaryNiches(initialData.secondary_niches || []);
    setContentPillars(initialData.content_pillars || []);
    setTopicsToAvoid(initialData.topics_to_avoid || []);

    setTargetAudience(initialData.target_audience || "");
    setTargetAudienceAge(initialData.target_audience_age || "18–24");
    setAudienceSophistication(initialData.audience_sophistication || "Beginner");
    setAudienceInterests(initialData.audience_interests || []);
    setAudiencePainPoints(initialData.audience_pain_points || []);

    setContentTones(initialData.content_tones || ["Educational", "Conversational", "Bold"]);
    setEnergy(initialData.energy || "High-energy");
    setHumor(initialData.humor || "Light");
    setStorytellingStyle(initialData.storytelling_style || "Story-driven");
    setVocabulary(initialData.vocabulary || "Balanced");
    setCustomToneNotes(initialData.custom_tone_notes || "");

    setPrimaryLanguage(initialData.primary_language || "Tanglish");
    setSecondaryLanguages(initialData.secondary_languages || []);
    setScriptPreference(initialData.script_preference || "Tanglish / Romanized Telugu");
    setPlatforms(initialData.platforms || ["Instagram Reels", "YouTube Shorts"]);
    setPreferredAspectRatio(initialData.preferred_aspect_ratio || "9:16");
    setTypicalDuration(initialData.typical_duration || "45 sec");
    setCtaStyle(initialData.cta_style || "Save");
    setSecondaryCtaStyles(initialData.secondary_cta_styles || []);
    setContentGoals(initialData.content_goals || ["Increase retention", "Build personal brand"]);

    setBrandPositioning(initialData.brand_positioning || "");
    setCoreMessage(initialData.core_message || "");
    setWordsToUse(initialData.words_to_use || []);
    setWordsToAvoid(initialData.words_to_avoid || []);
    setStyleRules(initialData.style_rules || []);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!creatorName.trim()) {
      newErrors.creator_name = "Creator name is required.";
    }
    if (!niche.trim()) {
      newErrors.niche = "Primary content niche is required.";
    }
    if (!primaryLanguage.trim()) {
      newErrors.primary_language = "Primary language is required.";
    }
    if (platforms.length === 0) {
      newErrors.platforms = "Select at least one target platform.";
    }
    if (contentTones.length === 0) {
      newErrors.content_tones = "Select at least one delivery tone.";
    }
    if (creatorBio.length > 1000) {
      newErrors.creator_bio = "Bio cannot exceed 1000 characters.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.creator_name || newErrors.creator_bio) {
        setActiveTab("identity");
      } else if (newErrors.niche) {
        setActiveTab("content");
      } else if (newErrors.content_tones) {
        setActiveTab("voice");
      } else if (newErrors.primary_language || newErrors.platforms) {
        setActiveTab("preferences");
      }
    }
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
      await onSave(getFormData());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setServerError(err.message || "Failed to save creator profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" data-testid="profile-form">
      {/* Success Alert */}
      {saveSuccess && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-cine-emerald" />
          <div>
            <span className="font-semibold">Persona Profile Saved Successfully!</span>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Your persona preferences are now persisted and will automatically guide all AI generation modules.
            </p>
          </div>
        </div>
      )}

      {/* Validation Errors Alert */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs sm:text-sm flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-cine-rose" />
            <span>Please complete all required fields:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 mt-1 text-rose-300">
            {Object.values(errors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
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

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-cine-card/80 border border-cine-border/50">
        {FORM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-cine-accent text-white shadow-md shadow-cine-accent/20"
                  : "text-slate-400 hover:text-white hover:bg-cine-surface"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile Identity */}
      {activeTab === "identity" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cine-accent" />
              <CardTitle className="text-base font-semibold">Creator Identity</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Basic creator details, display name, creator vertical type, and bio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`w-full px-3 py-2.5 rounded-lg bg-cine-bg border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent ${
                    errors.creator_name ? "border-rose-500" : "border-cine-border focus:border-cine-accent"
                  }`}
                />
                {errors.creator_name && (
                  <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.creator_name}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="display-name"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Display Handle / Channel Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. @cinehashoots"
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Creator Type */}
              <div className="space-y-1.5">
                <label
                  htmlFor="creator-type"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Creator Archetype
                </label>
                <select
                  id="creator-type"
                  value={creatorType}
                  onChange={(e) => setCreatorType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {CREATOR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label
                  htmlFor="location"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Location / Region
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hyderabad, India"
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent"
                />
              </div>
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
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Content Identity & Pillars */}
      {activeTab === "content" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cine-accent" />
              <CardTitle className="text-base font-semibold">Content Identity & Pillars</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Primary vertical, secondary sub-niches, content pillars, and topics to avoid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Primary Niche */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Primary Content Niche <span className="text-cine-rose">*</span>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent"
                />
              )}
              {errors.niche && (
                <p className="text-xs text-cine-rose flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.niche}
                </p>
              )}
            </div>

            {/* Secondary Niches */}
            <TagListManager
              label="Secondary Niches / Sub-verticals"
              tags={secondaryNiches}
              onChange={setSecondaryNiches}
              placeholder="e.g. Lighting, Color Grading, Storyboarding"
              helperText="Related disciplines or subtopics you frequently cover."
            />

            {/* Content Pillars */}
            <TagListManager
              label="Core Content Pillars"
              tags={contentPillars}
              onChange={setContentPillars}
              placeholder="e.g. Mobile Camera Settings, Lighting Setups, Cinematic Editing"
              helperText="The 3–5 recurring pillars that define your channel."
            />

            {/* Topics to Avoid */}
            <TagListManager
              label="Topics to Avoid"
              tags={topicsToAvoid}
              onChange={setTopicsToAvoid}
              placeholder="e.g. Politics, Gossip, Gear Snobbery"
              helperText="Topics AI agents will never generate hooks or scripts for."
            />
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Audience Persona */}
      {activeTab === "audience" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cine-accent" />
              <CardTitle className="text-base font-semibold">Target Audience Persona</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Calibrate audience demographics, sophistication, interests, and pain points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Target Audience Summary */}
            <div className="space-y-1.5">
              <label
                htmlFor="target-audience"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Audience Summary
              </label>
              <textarea
                id="target-audience"
                rows={2}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Aspiring filmmakers and short-form creators looking to shoot cinematic reels on a budget."
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age Range */}
              <div className="space-y-1.5">
                <label
                  htmlFor="audience-age"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Primary Age Demographic
                </label>
                <select
                  id="audience-age"
                  value={targetAudienceAge}
                  onChange={(e) => setTargetAudienceAge(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {AGE_RANGES.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sophistication Level */}
              <div className="space-y-1.5">
                <label
                  htmlFor="audience-sophistication"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Knowledge / Skill Level
                </label>
                <select
                  id="audience-sophistication"
                  value={audienceSophistication}
                  onChange={(e) => setAudienceSophistication(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {SOPHISTICATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience Interests */}
            <TagListManager
              label="Audience Interests"
              tags={audienceInterests}
              onChange={setAudienceInterests}
              placeholder="e.g. Smartphone cameras, Premiere Pro, Film lighting, Film look LUTs"
              helperText="Hobbies, gear, and topics your viewers are passionate about."
            />

            {/* Audience Pain Points */}
            <TagListManager
              label="Audience Pain Points & Struggles"
              tags={audiencePainPoints}
              onChange={setAudiencePainPoints}
              placeholder="e.g. Grainy low-light video, Boring camera movement, Low engagement"
              helperText="Problems your scripts solve to create high-retention hooks."
            />
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Voice & Style */}
      {activeTab === "voice" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cine-rose" />
              <CardTitle className="text-base font-semibold">Voice & Delivery Matrix</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Delivery tone, humor level, pacing energy, storytelling style, and vocabulary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Content Tones Multi-Select */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Content Delivery Tones <span className="text-cine-rose">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TONE_PRESETS.map((tone) => {
                  const isSelected = contentTones.includes(tone);
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => toggleItem(contentTones, tone, setContentTones)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Energy Level */}
              <div className="space-y-1.5">
                <label
                  htmlFor="energy-level"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Energy / Pacing
                </label>
                <select
                  id="energy-level"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {ENERGY_PRESETS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Humor Level */}
              <div className="space-y-1.5">
                <label
                  htmlFor="humor-level"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Humor Frequency
                </label>
                <select
                  id="humor-level"
                  value={humor}
                  onChange={(e) => setHumor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {HUMOR_PRESETS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Storytelling Style */}
              <div className="space-y-1.5">
                <label
                  htmlFor="storytelling-style"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Storytelling Style
                </label>
                <select
                  id="storytelling-style"
                  value={storytellingStyle}
                  onChange={(e) => setStorytellingStyle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {STORYTELLING_PRESETS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vocabulary Level */}
              <div className="space-y-1.5">
                <label
                  htmlFor="vocabulary-level"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Vocabulary Complexity
                </label>
                <select
                  id="vocabulary-level"
                  value={vocabulary}
                  onChange={(e) => setVocabulary(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {VOCABULARY_PRESETS.map((voc) => (
                    <option key={voc} value={voc}>
                      {voc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Tone Notes */}
            <div className="space-y-1.5">
              <label
                htmlFor="custom-tone-notes"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Custom Tone & Delivery Notes
              </label>
              <textarea
                id="custom-tone-notes"
                rows={2}
                value={customToneNotes}
                onChange={(e) => setCustomToneNotes(e.target.value)}
                placeholder="e.g. Always speak directly to camera with punchy one-liners. Use colloquial Telugu idioms naturally."
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent resize-none"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Preferences & Platforms */}
      {activeTab === "preferences" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cine-emerald" />
              <CardTitle className="text-base font-semibold">Distribution & Language Preferences</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Target platforms, aspect ratios, durations, language, and CTA formats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Primary Language */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Primary Content Language <span className="text-cine-rose">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = primaryLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPrimaryLanguage(lang)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center min-h-[44px] transition-all ${
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

            {/* Script Preference */}
            <div className="space-y-1.5">
              <label
                htmlFor="script-preference"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Script Generation Alphabet / Mode
              </label>
              <select
                id="script-preference"
                value={scriptPreference}
                onChange={(e) => setScriptPreference(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
              >
                {SCRIPT_PREFERENCES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Languages */}
            <TagListManager
              label="Secondary / Regional Languages"
              tags={secondaryLanguages}
              onChange={setSecondaryLanguages}
              placeholder="e.g. Hindi, Tamil, Kannada"
              helperText="Additional languages for multilingual expansions."
            />

            {/* Target Distribution Channels */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Target Distribution Channels <span className="text-cine-rose">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLATFORM_OPTIONS.map((plat) => {
                  const isSelected = platforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => toggleItem(platforms, plat, setPlatforms)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 min-h-[44px] transition-all ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label
                  htmlFor="aspect-ratio"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Preferred Aspect Ratio
                </label>
                <select
                  id="aspect-ratio"
                  value={preferredAspectRatio}
                  onChange={(e) => setPreferredAspectRatio(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {ASPECT_RATIOS.map((ar) => (
                    <option key={ar} value={ar}>
                      {ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Typical Duration */}
              <div className="space-y-1.5">
                <label
                  htmlFor="duration-pref"
                  className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
                >
                  Target Video Duration
                </label>
                <select
                  id="duration-pref"
                  value={typicalDuration}
                  onChange={(e) => setTypicalDuration(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
                >
                  {DURATION_OPTIONS.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CTA Style */}
            <div className="space-y-1.5">
              <label
                htmlFor="cta-style"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Default Call-to-Action (CTA)
              </label>
              <select
                id="cta-style"
                value={ctaStyle}
                onChange={(e) => setCtaStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm focus:outline-none focus:ring-2 focus:ring-cine-accent"
              >
                {CTA_OPTIONS.map((cta) => (
                  <option key={cta} value={cta}>
                    {cta}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Goals Multi-Select */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                Content Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = contentGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleItem(contentGoals, goal, setContentGoals)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: Brand Guidance */}
      {activeTab === "brand" && (
        <Card className="border-cine-border/60">
          <CardHeader className="pb-4 border-b border-cine-border/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cine-accent" />
              <CardTitle className="text-base font-semibold">Brand Guidance & Rules</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Brand positioning, core message, signature vocabulary, and strict style constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Brand Positioning */}
            <div className="space-y-1.5">
              <label
                htmlFor="brand-positioning"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Brand Positioning Statement
              </label>
              <textarea
                id="brand-positioning"
                rows={2}
                value={brandPositioning}
                onChange={(e) => setBrandPositioning(e.target.value)}
                placeholder="e.g. The go-to Telugu mobile filmmaking channel for practical cinematography tips without expensive cinema cameras."
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent resize-none"
              />
            </div>

            {/* Core Message */}
            <div className="space-y-1.5">
              <label
                htmlFor="core-message"
                className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
              >
                Channel Core Message / Motto
              </label>
              <input
                id="core-message"
                type="text"
                value={coreMessage}
                onChange={(e) => setCoreMessage(e.target.value)}
                placeholder="e.g. You don't need a RED camera to tell a million-dollar story."
                className="w-full px-3 py-2.5 rounded-lg bg-cine-bg border border-cine-border focus:border-cine-accent text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cine-accent"
              />
            </div>

            {/* Words to Use */}
            <TagListManager
              label="Signature Words & Catchphrases to Use"
              tags={wordsToUse}
              onChange={setWordsToUse}
              placeholder="e.g. Frame cheddam, Masterclass, Cinema look, Pro tip"
              helperText="Words AI agents will naturally sprinkle into scripts."
            />

            {/* Words to Avoid */}
            <TagListManager
              label="Banned Words & Cliches to Avoid"
              tags={wordsToAvoid}
              onChange={setWordsToAvoid}
              placeholder="e.g. In today's video, Don't forget to like, Guys"
              helperText="Words AI agents will strictly avoid using in hooks and intros."
            />

            {/* Style Rules */}
            <TagListManager
              label="Brand Style Rules & Constraints"
              tags={styleRules}
              onChange={setStyleRules}
              placeholder="e.g. No clickbait questions, Always start with visual action, Hook within first 2.5s"
              helperText="Explicit rules passed directly to the Script Optimizer and Hook Agent."
            />
          </CardContent>
        </Card>
      )}

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-cine-border/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {initialData && (
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              size="md"
              disabled={isLoading}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Reset Changes
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
      </div>
    </form>
  );
}
