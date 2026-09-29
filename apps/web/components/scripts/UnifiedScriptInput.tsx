"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Save,
  Globe,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import type {
  ScriptSourceType,
  NormalizedScriptInput,
  NormalizedScriptResponse,
} from "@/types/scriptInput";
import { api } from "../../lib/api";
import { getOCRProvider } from "@/lib/ocr/ocrProvider";

const SCRIPT_LANGUAGES = ["English", "Telugu", "Tanglish"];
const SCRIPT_DURATIONS = [15, 30, 45, 60];

const MODE_OPTIONS: Array<{
  id: ScriptSourceType;
  label: string;
  icon: React.ElementType;
  description: string;
  accept?: string;
}> = [
  {
    id: "text",
    label: "Paste Text",
    icon: FileText,
    description: "Directly paste or type dialogue & screenplay notes",
  },
  {
    id: "pdf",
    label: "Upload PDF",
    icon: FileCode,
    description: "Screenplay documents (.pdf, max 10MB)",
    accept: ".pdf",
  },
  {
    id: "docx",
    label: "Upload DOCX",
    icon: FileText,
    description: "Word screenplay drafts (.docx, max 10MB)",
    accept: ".docx",
  },
  {
    id: "image",
    label: "Upload Image",
    icon: ImageIcon,
    description: "Screenshots, whiteboard notes (.jpg, .png, .webp)",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  },
];

export interface UnifiedScriptInputProps {
  onAnalyzeScript: (normalized: NormalizedScriptInput, title?: string) => Promise<void> | void;
  isAnalyzing?: boolean;
  initialText?: string;
  initialSourceType?: ScriptSourceType;
  className?: string;
}

export function UnifiedScriptInput({
  onAnalyzeScript,
  isAnalyzing = false,
  initialText = "",
  initialSourceType = "text",
  className = "",
}: UnifiedScriptInputProps) {
  const [sourceType, setSourceType] = useState<ScriptSourceType>(initialSourceType);
  const [scriptTitle, setScriptTitle] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [duration, setDuration] = useState<number>(30);

  // Text state
  const [scriptText, setScriptText] = useState<string>(initialText);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Extraction states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionMetadata, setExtractionMetadata] = useState<{
    method?: string;
    confidence?: number;
    provider?: string;
    isProduction?: boolean;
    wordCount?: number;
    charCount?: number;
    filename?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistence state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedScriptId, setSavedScriptId] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputId = useId();

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle switching tabs
  const handleSelectMode = (mode: ScriptSourceType) => {
    setSourceType(mode);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // File drop / picker change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, sourceType);
  };

  const processFile = async (file: File, mode: ScriptSourceType) => {
    setError(null);
    setSelectedFile(file);
    setSaveSuccessMessage(null);

    // 1. Validate file size <= 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size === 0) {
      setError(`The file "${file.name}" is empty (0 bytes).`);
      return;
    }
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File size (${sizeMb} MB) exceeds the 10 MB limit for documents and images.`);
      return;
    }

    // 2. Validate MIME / extension
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (mode === "pdf" && ext !== ".pdf") {
      setError(`Invalid format "${ext}". Please upload a .pdf document.`);
      return;
    }
    if (mode === "docx" && ext !== ".docx") {
      setError(`Invalid format "${ext}". Please upload a .docx Word document.`);
      return;
    }
    if (mode === "image") {
      const validImg = [".jpg", ".jpeg", ".png", ".webp"];
      if (!validImg.includes(ext) && !file.type.startsWith("image/")) {
        setError(`Invalid format "${ext}". Allowed image types: JPG, PNG, WebP.`);
        return;
      }
      // Create local preview URL
      if (imagePreviewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
      }
    }

    // 3. Extract text
    setIsExtracting(true);
    try {
      if (mode === "image") {
        // Use OCR provider boundary
        const ocrProvider = getOCRProvider();
        const ocrRes = await ocrProvider.extractText(file, language);
        if (ocrRes.error) {
          throw new Error(ocrRes.error);
        }
        setScriptText(ocrRes.extractedText);
        setExtractionMetadata({
          method: "ocr",
          confidence: ocrRes.confidence,
          provider: ocrRes.providerName,
          isProduction: ocrRes.isProduction,
          filename: file.name,
          wordCount: ocrRes.extractedText.split(/\s+/).filter(Boolean).length,
          charCount: ocrRes.extractedText.length,
        });
      } else {
        // PDF or DOCX via backend extraction endpoint
        const res: NormalizedScriptResponse = await api.extractScript({
          file,
          sourceType: mode,
          language,
        });
        setScriptText(res.text);
        setExtractionMetadata({
          method: res.extraction_method,
          confidence: res.confidence ?? 1.0,
          provider: res.provider_name,
          isProduction: true,
          filename: file.name,
          wordCount: res.word_count,
          charCount: res.character_count,
        });
      }

      // Default title from filename if not set
      if (!scriptTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setScriptTitle(cleanName);
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(
        err.message ||
          `Failed to extract text from ${file.name}. Please verify the file is not corrupted or password-protected.`
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setScriptText("");
    setExtractionMetadata(null);
    setError(null);
    setSaveSuccessMessage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const charCount = scriptText.length;

  const handleAnalyzeClick = async () => {
    if (!scriptText.trim()) {
      setError("Please provide script text before running retention analysis.");
      return;
    }

    const normalizedInput: NormalizedScriptInput = {
      sourceType,
      text: scriptText.trim(),
      originalFileName: selectedFile?.name,
      language,
      extractionMethod: extractionMetadata?.method || (sourceType === "text" ? "direct_input" : sourceType),
      confidence: extractionMetadata?.confidence,
      providerName: extractionMetadata?.provider,
      isProduction: extractionMetadata?.isProduction,
      metadata: {
        duration_seconds: duration,
        character_count: charCount,
        word_count: wordCount,
      },
    };

    const resolvedTitle = scriptTitle.trim() || selectedFile?.name || "Imported Screenplay";
    await onAnalyzeScript(normalizedInput, resolvedTitle);
  };

  const handleSaveToStudio = async () => {
    if (!scriptText.trim()) {
      setError("Cannot save an empty script.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccessMessage(null);

    try {
      const titleToSave = scriptTitle.trim() || selectedFile?.name || "Imported Screenplay";
      const saved = await api.saveImportedScript({
        title: titleToSave,
        text: scriptText.trim(),
        platform: "Instagram Reels",
        language,
        duration_seconds: duration,
      });

      setSavedScriptId(saved.id);
      setSaveSuccessMessage(`Script saved to Studio as Version 1!`);
    } catch (err: any) {
      setError(err.message || "Failed to save script to Studio.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMode = MODE_OPTIONS.find((m) => m.id === sourceType) || MODE_OPTIONS[0];

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>Provide Script</span>
            <span className="text-xs font-normal text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Unified Input + OCR
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            How do you want to provide your script? All formats normalize into editable screenplay text.
          </p>
        </div>

        {/* Global Controls: Language & Duration */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <select
              aria-label="Script Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              {SCRIPT_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-slate-900 text-white">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Duration selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <select
              aria-label="Target Duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            >
              {SCRIPT_DURATIONS.map((dur) => (
                <option key={dur} value={dur} className="bg-slate-900 text-white">
                  {dur}s
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Input Mode Selector Grid */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Choose Script Input Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = sourceType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMode(opt.id)}
                className={`flex flex-col items-center sm:items-start text-center sm:text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                    : "bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-white">{opt.label}</span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1 hidden sm:block">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Script Title input */}
      <div>
        <label
          htmlFor="unified-script-title"
          className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Script Title <span className="text-slate-500 text-[11px] normal-case">(Optional)</span>
        </label>
        <input
          id="unified-script-title"
          type="text"
          value={scriptTitle}
          onChange={(e) => setScriptTitle(e.target.value)}
          placeholder="e.g. 24fps Cinematography Secrets"
          className="w-full rounded-xl bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Mode-specific upload zone (when not "text") */}
      {sourceType !== "text" && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file, sourceType);
            }}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-all ${
              selectedFile
                ? "border-cyan-500/40 bg-cyan-950/10"
                : "border-white/15 bg-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/50"
            }`}
          >
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept={currentMode.accept}
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-cyan-400 font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Selected: <strong>{selectedFile.name}</strong> (
                    {(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <label
                    htmlFor={fileInputId}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer transition-colors"
                  >
                    Change File
                  </label>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-1 text-xs rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/20 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor={fileInputId}
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-cyan-400 hover:underline">
                    Click to browse
                  </span>
                  <span className="text-xs text-slate-400"> or drag and drop your {sourceType.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Max file size: 10 MB • {currentMode.description}
                </p>
              </label>
            )}
          </div>

          {/* Image Preview thumbnail (Step 8: Image Preview) */}
          {sourceType === "image" && imagePreviewUrl && (
            <div className="p-3 rounded-xl border border-white/10 bg-slate-800/40 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-lg overflow-hidden border border-white/10 bg-slate-950 flex-shrink-0">
                <Image
                  src={imagePreviewUrl}
                  alt="Script screenshot preview"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="flex-1 space-y-1 text-left w-full">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Image Preview</span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">{selectedFile?.name}</p>
                <p className="text-[11px] text-slate-500">
                  Format: {selectedFile?.type || "image"} • Size:{" "}
                  {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                </p>
                {isExtracting ? (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium pt-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting script text via OCR...</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400/90 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>OCR text extracted. Review and edit mistakes below.</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extraction In-Progress Indicator */}
      {isExtracting && (
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              Extracting screenplay content from <strong>{selectedFile?.name || sourceType}</strong>...
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400/80">Normalizing format</span>
        </div>
      )}

      {/* Provider & Confidence Info Banner */}
      {extractionMetadata && !isExtracting && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-white">Extraction Source:</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {extractionMetadata.method?.toUpperCase()}
              </span>
              {extractionMetadata.confidence !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Confidence: {Math.round(extractionMetadata.confidence * 100)}%
                </span>
              )}
              {!extractionMetadata.isProduction && (
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  Development Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {sourceType === "image" && !extractionMetadata.isProduction
                ? "Development OCR Mode (mock/heuristic) — No production cloud vision API key is configured. Please verify and edit the extracted script text below."
                : "Extracted text has been normalized into screenplay format. You can edit any line before analysis."}
            </p>
          </div>
        </div>
      )}

      {/* Error Alert with switch-to-text safety */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-200">Input / Extraction Issue: </strong>
              <span>{error}</span>
            </div>
          </div>
          {sourceType !== "text" && (
            <button
              type="button"
              onClick={() => handleSelectMode("text")}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 text-white font-medium border border-rose-500/30 transition-colors whitespace-nowrap self-end sm:self-auto"
            >
              Switch to Paste Text
            </button>
          )}
        </div>
      )}

      {/* Editable Extracted Script Text Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="unified-script-editor"
            className="block text-xs font-semibold text-slate-200 uppercase tracking-wider"
          >
            {sourceType === "text" ? "Script Text" : "Review & Edit Extracted Screenplay"}
          </label>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        <textarea
          id="unified-script-editor"
          ref={textareaRef}
          rows={7}
          value={scriptText}
          onChange={(e) => {
            setScriptText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            sourceType === "text"
              ? "Paste or type your script here...\n\nExample:\nStop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.\n\nSwitch to 24fps with a 180-degree shutter angle.\n\nSave this before your next shoot!"
              : "Extracted script text will appear here. You can freely edit and correct any words before running analysis..."
          }
          className="w-full rounded-xl bg-slate-800/80 p-3.5 text-sm text-white placeholder-slate-500 border border-white/10 focus:border-cyan-500 focus:outline-none transition-colors font-mono leading-relaxed"
        />
        <p className="text-[11px] text-slate-500">
          The extracted text is fully editable. Fix typos, refine phrasing, or modify timecodes before analyzing.
        </p>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
          {savedScriptId && (
            <Link
              href={`/scripts?script_id=${savedScriptId}`}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              Open in Studio <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {scriptText.trim() && (
            <button
              type="button"
              disabled={isSaving || !scriptText.trim()}
              onClick={handleSaveToStudio}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSaving ? "Saving..." : "Save to Studio"}</span>
            </button>
          )}
          {scriptText.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={!scriptText.trim() || isAnalyzing || isExtracting}
          onClick={handleAnalyzeClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin" : ""}`} />
          <span>{isAnalyzing ? "Running Retention Audit..." : "Analyze Script"}</span>
        </button>
      </div>
    </div>
  );
}
