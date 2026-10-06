"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Youtube,
  Instagram,
  Clock,
  Sparkles,
  Save,
  BarChart2,
  Wand2,
  Calendar,
  Check,
  Copy,
  Edit3,
  Layers,
  ArrowRight,
  ChevronDown,
  Info,
  ExternalLink,
  Split,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { VideoURLScriptExtraction } from "@/types/scriptInput";
import type { Script } from "@/types/script";

const ADAPTATION_GOALS = [
  { id: "Rewrite", label: "Rewrite (Fresh Screenplay)", desc: "Fresh cinematic delivery of the core premise" },
  { id: "Improve Hook", label: "Improve Hook (Stop the Scroll)", desc: "Disruptive pattern interrupt in the first 3 seconds" },
  { id: "Improve Retention", label: "Improve Retention (Visual Resets)", desc: "Pacing optimized with pattern interrupts every 4-5s" },
  { id: "Shorter Version", label: "Shorter Version (Punchy Cut)", desc: "Distills message to its highest-impact essentials" },
  { id: "Longer Version", label: "Longer Version (Masterclass)", desc: "Comprehensive step-by-step master breakdown" },
  { id: "New Angle", label: "New Angle (Contrarian Perspective)", desc: "Presents counter-intuitive truth on the subject" },
  { id: "Educational Version", label: "Educational Version (Action Framework)", desc: "Clear 3-step structured takeaways" },
  { id: "Storytelling Version", label: "Storytelling Version (Narrative Arc)", desc: "Personal vulnerability, struggle, and realization" },
  { id: "Creator-Style Rewrite", label: "Creator-Style Rewrite (Persona Alignment)", desc: "Transforms script into creator's signature voice" },
];

interface ExtractedVideoScriptPanelProps {
  extraction: VideoURLScriptExtraction;
  onScriptSaved?: (script: Script) => void;
  onReset?: () => void;
  className?: string;
}

export function ExtractedVideoScriptPanel({
  extraction,
  onScriptSaved,
  onReset,
  className = "",
}: ExtractedVideoScriptPanelProps) {
  const router = useRouter();

  // Editable text state
  const [editedText, setEditedText] = useState<string>(extraction.transcript);
  const [editedTitle, setEditedTitle] = useState<string>(
    extraction.title || (extraction.platform === "YouTube" ? "YouTube Video Script" : "Instagram Reel Script")
  );

  // AI Generation configuration
  const [goal, setGoal] = useState<string>("Rewrite");
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [targetPlatform, setTargetPlatform] = useState<string>("Instagram Reels");
  const [targetLanguage, setTargetLanguage] = useState<string>(extraction.language || "English");
  const [instructions, setInstructions] = useState<string>("");

  // Generation status & generated script
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);
  const [activeTab, setActiveTab] = useState<"original" | "generated" | "compare">("original");

  // Save states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;
  const charCount = editedText.length;

  // Handle Save Extracted Script to DB
  const handleSaveAsScript = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await api.saveImportedScript({
        title: editedTitle.trim() || "Extracted Video Script",
        text: editedText.trim(),
        platform: targetPlatform,
        language: targetLanguage,
        duration_seconds: targetDuration,
        source_type: "video_url",
        source_url: extraction.source_url,
        source_platform: extraction.platform,
        original_video_title: extraction.title,
        extraction_method: extraction.extraction_method,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (onScriptSaved) {
        onScriptSaved(saved);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save script.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle AI Script Generation
  const handleGenerateAIScript = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await api.generateScriptFromUrl({
        url: extraction.source_url,
        extracted_text: editedText.trim(),
        original_video_title: editedTitle.trim(),
        platform: targetPlatform,
        language: targetLanguage,
        duration_seconds: targetDuration,
        goal,
        instructions: instructions.trim() || undefined,
      });

      setGeneratedScript(generated);
      setActiveTab("generated");
      if (onScriptSaved) {
        onScriptSaved(generated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate screenplay with AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handoff to Retention Analyzer
  const handleAnalyzeRetention = () => {
    const textToAnalyze = activeTab === "generated" && generatedScript ? generatedScript.hook : editedText;
    const query = new URLSearchParams({
      text: textToAnalyze,
      language: targetLanguage,
      source: "video_url",
      title: editedTitle,
    });
    router.push(`/analyzer?${query.toString()}`);
  };

  // Handoff to Script Optimizer
  const handleOptimizeScript = () => {
    const textToOptimize = activeTab === "generated" && generatedScript ? generatedScript.hook : editedText;
    const query = new URLSearchParams({
      text: textToOptimize,
      language: targetLanguage,
      source: "video_url",
      title: editedTitle,
    });
    router.push(`/optimizer?${query.toString()}`);
  };

  // Handoff to Content Calendar
  const handlePushToCalendar = () => {
    const query = new URLSearchParams({
      title: editedTitle,
      platform: targetPlatform,
      language: targetLanguage,
    });
    router.push(`/calendar?${query.toString()}`);
  };

  const handleCopy = async () => {
    const textToCopy = activeTab === "generated" && generatedScript ? JSON.stringify(generatedScript, null, 2) : editedText;
    await navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Source Metadata Bar */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {extraction.platform === "YouTube" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-400">
                  <Instagram className="w-3.5 h-3.5" /> Instagram Reel
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                {extraction.extraction_method === "official_transcript"
                  ? "Official Captions"
                  : extraction.extraction_method === "public_caption"
                  ? "Public Auto-Captions"
                  : extraction.extraction_method === "hybrid_restoration"
                  ? "Local Whisper + Hybrid Telugu"
                  : "Local Whisper STT"}
              </span>

              {extraction.duration_seconds && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {Math.round(extraction.duration_seconds)}s
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white tracking-wide pt-1">
              {extraction.title || "Extracted Video Dialogue"}
            </h3>

            {extraction.creator_name && (
              <p className="text-xs text-slate-400">
                Creator: <span className="text-slate-200 font-medium">@{extraction.creator_name}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
                Extract Another URL
              </Button>
            )}
            <a
              href={extraction.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <span>View Video</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* View Switcher Tabs (if AI Script is generated) */}
        {generatedScript && (
          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab("original")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                activeTab === "original"
                  ? "bg-cyan-500/15 border-cyan-500 text-cyan-300"
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              Original Extracted ({wordCount} words)
            </button>
            <button
              onClick={() => setActiveTab("generated")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                activeTab === "generated"
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ✨ AI Screenplay ({goal})
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                activeTab === "compare"
                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Split className="w-3.5 h-3.5 inline mr-1" /> Side-by-Side Comparison
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Extracted Script / Comparison */}
        <div className={generatedScript && activeTab === "compare" ? "lg:col-span-6" : "lg:col-span-7"}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  {activeTab === "generated" ? "AI Adapted Screenplay" : "Original Extracted Transcript (Editable)"}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {/* Editable Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Script Title</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Transcript Textarea or Screenplay segments */}
            {activeTab === "generated" && generatedScript ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Hook Directive</span>
                  <p className="text-sm text-indigo-100 font-medium">{generatedScript.hook}</p>
                </div>
                {generatedScript.segments.map((seg, idx) => (
                  <div key={seg.id || idx} className="p-3 rounded-xl border border-white/10 bg-slate-950/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300">
                        {seg.start_time} - {seg.end_time} • {seg.section}
                      </span>
                    </div>
                    <p className="text-sm text-white">{seg.voiceover}</p>
                    <p className="text-xs text-slate-400 italic">🎥 {seg.visual_direction}</p>
                    {seg.on_screen_text && (
                      <p className="text-[11px] font-mono text-emerald-400">📝 {seg.on_screen_text}</p>
                    )}
                  </div>
                ))}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">CTA Directive</span>
                  <p className="text-sm text-emerald-100 font-medium">{generatedScript.cta}</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Spoken Dialogue</label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-y"
                  placeholder="Extracted video dialogue..."
                />
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  leftIcon={hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {hasCopied ? "Copied" : "Copy Text"}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAsScript}
                  disabled={isSaving}
                  isLoading={isSaving}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {savedSuccess ? "Saved to Studio!" : "Save as Script Studio v1"}
                </Button>
              </div>

              {/* Cross-Module Handoffs */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAnalyzeRetention}
                  leftIcon={<BarChart2 className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Analyze Retention
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOptimizeScript}
                  leftIcon={<Wand2 className="w-3.5 h-3.5 text-indigo-400" />}
                >
                  Optimize
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePushToCalendar}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-purple-400" />}
                >
                  Schedule
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 pt-1 font-medium">{error}</p>
            )}
          </div>
        </div>

        {/* Right Column: AI Script Adaptation Engine */}
        <div className={generatedScript && activeTab === "compare" ? "lg:col-span-6" : "lg:col-span-5"}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Generate Brand-New Script</h4>
                <p className="text-xs text-slate-400">Transform spoken dialogue into high-retention screenplay</p>
              </div>
            </div>

            {/* Adaptation Goal Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adaptation Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {ADAPTATION_GOALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                {ADAPTATION_GOALS.find((g) => g.id === goal)?.desc}
              </p>
            </div>

            {/* Target Duration & Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  disabled={isGenerating}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>

            {/* Target Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Output Language</label>
              <div className="grid grid-cols-3 gap-2">
                {["English", "Telugu", "Tanglish"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLanguage(lang)}
                    disabled={isGenerating}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      targetLanguage === lang
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Creative Directives (Optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={isGenerating}
                rows={3}
                placeholder="e.g. Focus on mobile gimbal movement, keep voice confident and fast..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleGenerateAIScript}
                disabled={isGenerating || !editedText.trim()}
                isLoading={isGenerating}
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-300" />}
              >
                {isGenerating ? "Crafting Screenplay..." : `Generate ${goal} Screenplay`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
