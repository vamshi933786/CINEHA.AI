"use client";

import React, { useState, useRef } from "react";
import { Upload, AlertCircle, FileVideo, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VideoAnalysisUploadProps {
  onAnalyze: (file: File, language: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const SUPPORTED_LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Tanglish", label: "Tanglish (Telugu in English Script)" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
];

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function VideoAnalysisUpload({ onAnalyze, isLoading, error }: VideoAnalysisUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidateAndSelect = (file: File) => {
    setValidationError(null);

    // 1. Zero-byte check
    if (file.size === 0) {
      setValidationError("Selected video file is empty (0 bytes). Please select a valid video asset.");
      setSelectedFile(null);
      return;
    }

    // 2. 100MB limit check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File size (${mb} MB) exceeds the strict 100 MB upload limit.`);
      setSelectedFile(null);
      return;
    }

    // 3. Extension check
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".mp4", ".mov", ".webm"].includes(ext)) {
      setValidationError(`Unsupported format "${ext}". Allowed formats are MP4, MOV, and WebM.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleValidateAndSelect(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please select or drop a video file first.");
      return;
    }
    onAnalyze(selectedFile, language);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload Box */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/50"
              : selectedFile
              ? "border-emerald-500/50 bg-emerald-950/10"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
            data-testid="video-file-input"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {selectedFile ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileVideo className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Upload className="w-7 h-7" />
              </div>
            )}

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white break-all">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
                </p>
                <p className="text-xs text-cyan-400 underline pt-1">Click or drop to replace</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-200">
                  Drag and drop short-form video or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports MP4, MOV, WebM • Up to 100 MB
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-persistence processing: video is purged immediately post-analysis</span>
            </div>
          </div>
        </div>

        {/* Options Row: Spoken Language Selector & Analyze Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="space-y-1.5">
            <label htmlFor="language-select" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spoken Video Language</span>
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end items-end h-full">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!selectedFile || isLoading}
              className="w-full sm:w-auto min-w-[180px] shadow-lg shadow-cyan-950/50"
            >
              {isLoading ? "Analyzing Video..." : "Run Retention Audit"}
            </Button>
          </div>
        </div>
      </form>

      {/* Validation or API Error Alert */}
      {(validationError || error) && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-200">Validation Notice</p>
            <p className="text-xs text-rose-300/90 leading-relaxed">{validationError || error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
