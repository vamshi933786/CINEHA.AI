"use client";

import React, { useState, useRef } from "react";
import { api } from "@/lib/api";
import type { VideoAnalysisResponse, AnalysisLoadingStage } from "@/types/videoAnalysis";
import { VideoAnalysisUpload } from "./VideoAnalysisUpload";
import { VideoPreview, type VideoPreviewHandle } from "./VideoPreview";
import { AnalysisScoreCard } from "./AnalysisScoreCard";
import { MetricScoreGrid } from "./MetricScoreGrid";
import { AnalysisTimeline } from "./AnalysisTimeline";
import { FindingsAndRecommendations } from "./FindingsAndRecommendations";
import { TranscriptPanel } from "./TranscriptPanel";
import { HandoffActions } from "./HandoffActions";
import { StageProgress } from "./StageProgress";

export function VideoAnalysisWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<AnalysisLoadingStage>("reading");
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const videoPreviewRef = useRef<VideoPreviewHandle>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (file: File, language: string) => {
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setLoadingStage("reading");

    // Progressive stage transitions to inform the creator
    const stageTimer1 = setTimeout(() => setLoadingStage("extracting_audio"), 1200);
    const stageTimer2 = setTimeout(() => setLoadingStage("transcribing"), 3000);
    const stageTimer3 = setTimeout(() => setLoadingStage("analyzing_structure"), 5500);
    const stageTimer4 = setTimeout(() => setLoadingStage("generating_recommendations"), 7500);

    try {
      const result = await api.analyzeVideo(file, language);
      setLoadingStage("complete");
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while analyzing the video.");
      setAnalysisResult(null);
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setLoadingStage("reading");
    setCurrentTime(0);
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    videoPreviewRef.current?.seekTo(seconds);
  };

  const handleScrollToTranscript = () => {
    transcriptRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* 1. UPLOAD VIEW */}
      {!isLoading && !analysisResult && (
        <VideoAnalysisUpload
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* 2. LOADING VIEW WITH STAGES */}
      {isLoading && (
        <StageProgress
          currentStage={loadingStage}
          filename={selectedFile?.name}
        />
      )}

      {/* 3. AUDIT RESULT WORKSPACE */}
      {!isLoading && analysisResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Section: Video Player Preview (Left) + Overall Score Card (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Video Preview */}
            <div className="lg:col-span-5 w-full flex flex-col items-center">
              <div className="w-full max-w-[340px] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold text-slate-200">Interactive Preview</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px]">
                    {analysisResult.video.filename}
                  </span>
                </div>
                <VideoPreview
                  ref={videoPreviewRef}
                  videoFile={selectedFile}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                />
              </div>
            </div>

            {/* Right: Score Card & High-Level Signals */}
            <div className="lg:col-span-7 space-y-6">
              <AnalysisScoreCard analysis={analysisResult} />
              <HandoffActions
                analysis={analysisResult}
                onReset={handleReset}
                onScrollToTranscript={handleScrollToTranscript}
              />
            </div>
          </div>

          {/* 10-Dimensional Metric Grid */}
          <MetricScoreGrid metrics={analysisResult.metrics} />

          {/* Timeline / Segment Analysis */}
          <AnalysisTimeline
            segments={analysisResult.segments}
            durationSeconds={analysisResult.video.duration_seconds}
            currentTime={currentTime}
            onSeek={handleSeek}
          />

          {/* Findings, Drop-Off Hazards & Recommendations */}
          <FindingsAndRecommendations
            findings={analysisResult.findings}
            recommendations={analysisResult.recommendations}
            limitations={analysisResult.limitations}
          />

          {/* Full Spoken Transcript Panel */}
          <div ref={transcriptRef}>
            <TranscriptPanel transcript={analysisResult.transcript} />
          </div>
        </div>
      )}
    </div>
  );
}
