"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  Video,
  X,
  FileVideo,
  Clock,
  Film,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  sizeFormatted: string;
}

interface VideoDropzoneProps {
  selectedFile: File | null;
  videoPreviewUrl: string | null;
  videoMetadata: VideoMetadata | null;
  onVideoSelected: (file: File | null, metadata: VideoMetadata | null) => void;
  disabled?: boolean;
}

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // Strict 100 MB limit
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"];
const ALLOWED_MIME_PREFIXES = ["video/mp4", "video/quicktime", "video/webm"];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${tenths}`;
}

export function VideoDropzone({
  selectedFile,
  videoPreviewUrl,
  videoMetadata,
  onVideoSelected,
  disabled = false,
}: VideoDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setValidationError(null);

      // 1. Check file size (100 MB limit)
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        const currentSize = formatFileSize(file.size);
        setValidationError(
          `Video file exceeds the 100 MB limit (${currentSize}). Please compress or select a clip under 100 MB.`
        );
        return;
      }

      if (file.size === 0) {
        setValidationError("The selected file is empty (0 bytes). Please choose a valid video.");
        return;
      }

      // 2. Check extension
      const fileNameLower = file.name.toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
      if (!hasValidExt) {
        setValidationError(
          `Unsupported file format (${file.name}). Caption Studio accepts MP4, MOV, and WebM video files.`
        );
        return;
      }

      // 3. Immediately emit file selected with formatted size
      const initialMeta: VideoMetadata = {
        sizeFormatted: formatFileSize(file.size),
      };
      onVideoSelected(file, initialMeta);

      // Probe video element asynchronously to enrich metadata if supported
      try {
        const previewUrl = URL.createObjectURL(file);
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";

        tempVideo.onloadedmetadata = () => {
          const duration = tempVideo.duration;
          const width = tempVideo.videoWidth;
          const height = tempVideo.videoHeight;
          let aspectRatio = "16:9";
          if (width && height) {
            const ratio = width / height;
            if (Math.abs(ratio - 9 / 16) < 0.1) aspectRatio = "9:16 (Shorts/Reels)";
            else if (Math.abs(ratio - 16 / 9) < 0.1) aspectRatio = "16:9 (Landscape)";
            else if (Math.abs(ratio - 1.0) < 0.1) aspectRatio = "1:1 (Square)";
            else aspectRatio = `${width}x${height}`;
          }

          const metadata: VideoMetadata = {
            duration,
            width,
            height,
            aspectRatio,
            sizeFormatted: formatFileSize(file.size),
          };

          onVideoSelected(file, metadata);
        };

        tempVideo.src = previewUrl;
      } catch (_) {}
    },
    [onVideoSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onVideoSelected(null, null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-950/50 scale-[1.005]"
              : "border-[#2a2f45] bg-[#12131c]/80 hover:border-slate-600 hover:bg-[#151724]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
            aria-label="Upload video file"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Upload className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100">
                Drag and drop your video here, or{" "}
                <span className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Supports <strong className="text-slate-300">MP4, MOV, WebM</strong> up to{" "}
                <strong className="text-cyan-300">100 MB</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#1a1d2e] border border-[#2d334d] text-slate-300">
                .MP4
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#1a1d2e] border border-[#2d334d] text-slate-300">
                .MOV
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#1a1d2e] border border-[#2d334d] text-slate-300">
                .WEBM
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Max 100 MB
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Video Selected & Preview State */
        <div className="rounded-2xl border border-[#25293d] bg-[#12131a] overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row gap-6 p-5">
            {/* Player Preview */}
            <div className="w-full md:w-5/12 max-w-md bg-black/60 rounded-xl overflow-hidden border border-[#282d42] aspect-video flex items-center justify-center relative shadow-inner">
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain max-h-64"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Film className="w-8 h-8" />
                  <span className="text-xs">Preview loading...</span>
                </div>
              )}
            </div>

            {/* Video File Metadata & Actions */}
            <div className="w-full md:w-7/12 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold text-slate-100 max-w-[280px] sm:max-w-sm truncate"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-cyan-300 font-mono">
                          {videoMetadata?.sizeFormatted || formatFileSize(selectedFile.size)}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Speech Ingestion
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={disabled}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove selected video"
                    aria-label="Remove selected video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-[#171a28] border border-[#23283c]">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Duration
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formatDuration(videoMetadata?.duration)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#171a28] border border-[#23283c]">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Aspect Ratio
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-200">
                      <Film className="w-3.5 h-3.5 text-violet-400" />
                      <span className="truncate">{videoMetadata?.aspectRatio || "Auto"}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#171a28] border border-[#23283c] col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Format
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-300 block mt-0.5 uppercase">
                      {selectedFile.name.split(".").pop() || "MP4"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-[#161826] border border-[#222638] rounded-xl p-3 flex items-center justify-between">
                <span>Audio will be extracted and transcribed into timed speech cues.</span>
                <span className="font-mono text-cyan-400 font-semibold">100 MB Limit Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-xs underline text-rose-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
