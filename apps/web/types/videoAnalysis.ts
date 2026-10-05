export interface VideoMetadata {
  filename: string;
  file_size_bytes: number;
  file_size_mb: number;
  duration_seconds: number;
  width: number;
  height: number;
  fps: number;
  has_audio: boolean;
  format: string;
}

export interface VideoAnalysisMetric {
  id: string;
  label: string;
  score: number;
  rating: string;
  summary: string;
  evidence: string[];
  recommendation?: string;
}

export interface VideoAnalysisSegment {
  segment_id: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  transcript: string;
  label: string;
  confidence: number;
  observation?: string;
}

export interface VideoTranscriptInfo {
  available: boolean;
  language: string;
  text: string;
  segment_count: number;
  word_count: number;
  words_per_second: number;
  silence_gaps_count: number;
  provider: string;
  notice?: string;
}

export interface VideoAnalysisResponse {
  id: string;
  video: VideoMetadata;
  overall_score: number;
  overall_rating: string;
  summary: string;
  metrics: VideoAnalysisMetric[];
  segments: VideoAnalysisSegment[];
  findings: string[];
  recommendations: string[];
  transcript: VideoTranscriptInfo;
  limitations: string[];
  analyzed_at: string;
  provider_used: string;
}

export type AnalysisLoadingStage =
  | "reading"
  | "extracting_audio"
  | "transcribing"
  | "analyzing_structure"
  | "generating_recommendations"
  | "complete";

export interface AnalysisStageConfig {
  stage: AnalysisLoadingStage;
  label: string;
  description: string;
}

export const ANALYSIS_STAGES: AnalysisStageConfig[] = [
  { stage: "reading", label: "Reading video", description: "Inspecting video container, dimensions, and frame rate" },
  { stage: "extracting_audio", label: "Extracting audio", description: "Demuxing vocal audio stream for speech recognition" },
  { stage: "transcribing", label: "Transcribing speech", description: "Decoding spoken dialogue using Local Whisper" },
  { stage: "analyzing_structure", label: "Analyzing structure", description: "Evaluating hook immediacy, pacing velocity, and retention drop-offs" },
  { stage: "generating_recommendations", label: "Generating recommendations", description: "Auditing psychological retention loops and CTA strength" },
  { stage: "complete", label: "Complete", description: "Audit ready for review" },
];
