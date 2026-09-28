"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  Script,
  ScriptVersion,
  ScriptSegment as ScriptSegmentType,
  ScriptGenerationPayload,
} from "@/types/script";
import { ScriptInput, ScriptFormData } from "./ScriptInput";
import { ScriptPreview } from "./ScriptPreview";
import { ScriptToolbar } from "./ScriptToolbar";

interface ScriptWorkspaceProps {
  initialTopic?: string;
  initialHook?: string;
  initialPlatform?: string;
  initialLanguage?: string;
}

export function ScriptWorkspace({
  initialTopic = "",
  initialHook = "",
  initialPlatform = "Instagram Reels",
  initialLanguage = "English",
}: ScriptWorkspaceProps) {
  const [formData, setFormData] = useState<ScriptFormData>({
    topic: initialTopic,
    context: "",
    platform: initialPlatform,
    language: initialLanguage,
    duration_seconds: 30,
    tone: "",
    hookMode: initialHook ? "custom" : "auto",
    hook: initialHook,
    ctaPreset: "Follow for more",
    customCta: "",
  });

  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number>(1);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>("");
  const [editableHook, setEditableHook] = useState<string>("");
  const [editableCta, setEditableCta] = useState<string>("");
  const [editableSegments, setEditableSegments] = useState<ScriptSegmentType[]>([]);

  // Generation & saving states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [isSavingVersion, setIsSavingVersion] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial query params if they change
  useEffect(() => {
    if (initialTopic) setFormData((prev) => ({ ...prev, topic: initialTopic }));
    if (initialHook) {
      setFormData((prev) => ({
        ...prev,
        hook: initialHook,
        hookMode: "custom",
      }));
    }
  }, [initialTopic, initialHook]);

  const handleFormChange = (updates: Partial<ScriptFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (error) setError(null);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.topic.trim()) {
      setError("Please provide a topic or concept for your video.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsEditing(false);

    // Realistic progress stages
    setGenerationStage("Analyzing creator profile & audience...");
    const t1 = setTimeout(() => setGenerationStage("Structuring opening hook..."), 400);
    const t2 = setTimeout(() => setGenerationStage("Building screenplay narrative..."), 900);
    const t3 = setTimeout(() => setGenerationStage("Adding visual & B-roll directions..."), 1400);
    const t4 = setTimeout(() => setGenerationStage("Optimizing audio cues & CTA..."), 1900);

    const resolvedCta =
      formData.ctaPreset === "Custom CTA"
        ? formData.customCta.trim() || undefined
        : formData.ctaPreset;

    const payload: ScriptGenerationPayload = {
      topic: formData.topic.trim(),
      context: formData.context.trim() || undefined,
      platform: formData.platform,
      language: formData.language,
      duration_seconds: formData.duration_seconds,
      tone: formData.tone.trim() || undefined,
      hook: formData.hookMode === "custom" && formData.hook.trim() ? formData.hook.trim() : undefined,
      cta: resolvedCta,
    };

    try {
      const generatedScript = await api.generateScript(payload);
      setActiveScript(generatedScript);
      setSelectedVersionNumber(generatedScript.current_version);

      // Populate edit buffers
      setEditableTitle(generatedScript.title);
      setEditableHook(generatedScript.hook);
      setEditableCta(generatedScript.cta);
      setEditableSegments(generatedScript.segments);

      // Load versions
      if (generatedScript.versions && generatedScript.versions.length > 0) {
        setVersions(generatedScript.versions);
      } else {
        const fetchedVersions = await api.getScriptVersions(generatedScript.id);
        setVersions(fetchedVersions);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate script. Please check your connection.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  // Switch between versions
  const handleSelectVersion = (versionNum: number) => {
    setSelectedVersionNumber(versionNum);
    const targetVer = versions.find((v) => v.version_number === versionNum);
    if (targetVer) {
      setEditableTitle(targetVer.title);
      setEditableHook(targetVer.hook);
      setEditableCta(targetVer.cta);
      setEditableSegments(targetVer.segments);
    }
    setIsEditing(false);
  };

  // Toggle Edit Mode
  const handleToggleEdit = () => {
    if (!isEditing && activeScript) {
      // Initialize edit buffers
      const currentVer = versions.find((v) => v.version_number === selectedVersionNumber);
      if (currentVer) {
        setEditableTitle(currentVer.title);
        setEditableHook(currentVer.hook);
        setEditableCta(currentVer.cta);
        setEditableSegments([...currentVer.segments]);
      } else {
        setEditableTitle(activeScript.title);
        setEditableHook(activeScript.hook);
        setEditableCta(activeScript.cta);
        setEditableSegments([...activeScript.segments]);
      }
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (activeScript) {
      const currentVer = versions.find((v) => v.version_number === selectedVersionNumber);
      if (currentVer) {
        setEditableTitle(currentVer.title);
        setEditableHook(currentVer.hook);
        setEditableCta(currentVer.cta);
        setEditableSegments(currentVer.segments);
      }
    }
  };

  const handleSaveVersion = async () => {
    if (!activeScript) return;
    setIsSavingVersion(true);
    setError(null);

    try {
      const updated = await api.updateScript(activeScript.id, {
        title: editableTitle,
        hook: editableHook,
        cta: editableCta,
        segments: editableSegments,
        change_summary: `Version ${activeScript.current_version + 1} manual edits`,
      });

      setActiveScript(updated);
      setSelectedVersionNumber(updated.current_version);
      setEditableTitle(updated.title);
      setEditableHook(updated.hook);
      setEditableCta(updated.cta);
      setEditableSegments(updated.segments);

      const refreshedVersions = await api.getScriptVersions(activeScript.id);
      setVersions(refreshedVersions);

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save new version.");
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleSegmentChange = (index: number, updated: ScriptSegmentType) => {
    setEditableSegments((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const buildScreenplayText = useCallback((): string => {
    if (!activeScript) return "";
    const title = editableTitle || activeScript.title;
    const hook = editableHook || activeScript.hook;
    const cta = editableCta || activeScript.cta;
    const segments = editableSegments.length > 0 ? editableSegments : activeScript.segments;

    let text = `CINEHA.AI SHORT-FORM SCREENPLAY\n`;
    text += `====================================\n`;
    text += `TITLE: ${title}\n`;
    text += `PLATFORM: ${activeScript.platform} | DURATION: ${activeScript.duration_seconds}s | LANGUAGE: ${activeScript.language}\n`;
    text += `VERSION: v${selectedVersionNumber}.0\n\n`;
    text += `0–3s HOOK:\n"${hook}"\n\n`;
    text += `BEAT TIMELINE:\n`;
    text += `------------------------------------\n`;

    segments.forEach((seg, idx) => {
      text += `[${seg.start_time} — ${seg.end_time}] ${seg.section.toUpperCase()}\n`;
      text += `Voiceover: "${seg.voiceover}"\n`;
      text += `Visual: ${seg.visual_direction}\n`;
      if (seg.b_roll) text += `B-Roll: ${seg.b_roll}\n`;
      if (seg.on_screen_text) text += `On-Screen Text: ${seg.on_screen_text}\n`;
      if (seg.audio_direction) text += `Audio: ${seg.audio_direction}\n`;
      text += `\n`;
    });

    text += `------------------------------------\n`;
    text += `FINAL CTA:\n"${cta}"\n`;
    text += `====================================\n`;
    return text;
  }, [activeScript, editableTitle, editableHook, editableCta, editableSegments, selectedVersionNumber]);

  const handleCopy = async () => {
    const text = buildScreenplayText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (_) {
      // Fallback
      setError("Unable to access clipboard.");
    }
  };

  const handleExport = () => {
    const text = buildScreenplayText();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (editableTitle || activeScript?.title || "screenplay")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    link.href = url;
    link.download = `${safeTitle}-v${selectedVersionNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentDisplayedScript: Script | null = activeScript
    ? {
        ...activeScript,
        title: isEditing ? editableTitle : activeScript.title,
        hook: isEditing ? editableHook : activeScript.hook,
        cta: isEditing ? editableCta : activeScript.cta,
        segments: isEditing
          ? (editableSegments.length > 0 ? editableSegments : activeScript.segments)
          : activeScript.segments,
        current_version: selectedVersionNumber,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Responsive Two-Column Grid: Left: Input Form, Right: Screenplay Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Script Architect Input */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ScriptInput
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleGenerate}
            isGenerating={isGenerating}
            generationStage={generationStage}
            error={error}
          />
        </div>

        {/* Right Column: Screenplay Preview & Toolbar */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {activeScript && (
            <ScriptToolbar
              script={activeScript}
              isEditing={isEditing}
              isSavingVersion={isSavingVersion}
              onToggleEdit={handleToggleEdit}
              onSaveVersion={handleSaveVersion}
              onCancelEdit={handleCancelEdit}
              onRegenerate={() => handleGenerate()}
              onCopy={handleCopy}
              onExport={handleExport}
              hasCopied={hasCopied}
              versions={versions}
              selectedVersionNumber={selectedVersionNumber}
              onSelectVersion={handleSelectVersion}
            />
          )}

          <ScriptPreview
            script={currentDisplayedScript}
            activeSegments={
              editableSegments.length > 0
                ? editableSegments
                : activeScript?.segments || []
            }
            isEditing={isEditing}
            onSegmentChange={handleSegmentChange}
            onTitleChange={setEditableTitle}
            onHookChange={setEditableHook}
            onCtaChange={setEditableCta}
            isGenerating={isGenerating}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
