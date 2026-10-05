"use client";

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";

export interface VideoPreviewHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

interface VideoPreviewProps {
  videoFile?: File | null;
  videoUrl?: string | null;
  currentTime?: number;
  onTimeUpdate?: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  ({ videoFile, videoUrl, currentTime: externalTime, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Create / revoke blob URL
    useEffect(() => {
      if (videoFile) {
        const url = URL.createObjectURL(videoFile);
        setObjectUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else if (videoUrl) {
        setObjectUrl(videoUrl);
      } else {
        setObjectUrl(null);
      }
    }, [videoFile, videoUrl]);

    // Handle imperative handle for seekTo
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 9999));
          if (!isPlaying) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }
      },
      play: () => {
        videoRef.current?.play().catch(() => {});
        setIsPlaying(true);
      },
      pause: () => {
        videoRef.current?.pause();
        setIsPlaying(false);
      },
    }));

    // Sync external time if provided
    useEffect(() => {
      if (externalTime !== undefined && videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - externalTime) > 0.5) {
          videoRef.current.currentTime = externalTime;
        }
      }
    }, [externalTime]);

    const togglePlay = () => {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    const toggleMute = () => {
      if (!videoRef.current) return;
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      onTimeUpdate?.(cur);
    };

    const handleLoadedMetadata = () => {
      if (!videoRef.current) return;
      setDuration(videoRef.current.duration || 0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = val;
        setCurrentTime(val);
      }
    };

    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    };

    const restartVideo = () => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    };

    if (!objectUrl) {
      return (
        <div className="w-full aspect-[9/16] max-h-[520px] rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 text-sm">
          No video selected
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative group w-full aspect-[9/16] max-h-[520px] mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex flex-col justify-end"
      >
        <video
          ref={videoRef}
          src={objectUrl}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Video Overlay Controls */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-200">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Video seek slider"
            className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          {/* Button bar */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={restartVideo}
                aria-label="Restart video"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[11px] text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";
