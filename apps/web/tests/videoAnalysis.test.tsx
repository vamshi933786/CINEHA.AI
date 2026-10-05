import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import VideoAnalysisPage from "../app/video-analysis/page";
import { VideoAnalysisUpload } from "../components/video-analysis/VideoAnalysisUpload";
import { VideoPreview, type VideoPreviewHandle } from "../components/video-analysis/VideoPreview";
import { AnalysisScoreCard } from "../components/video-analysis/AnalysisScoreCard";
import { MetricScoreGrid } from "../components/video-analysis/MetricScoreGrid";
import { AnalysisTimeline } from "../components/video-analysis/AnalysisTimeline";
import { TranscriptPanel } from "../components/video-analysis/TranscriptPanel";
import { HandoffActions } from "../components/video-analysis/HandoffActions";
import { VideoAnalysisWorkspace } from "../components/video-analysis/VideoAnalysisWorkspace";
import { api } from "../lib/api";
import type { VideoAnalysisResponse } from "../types/videoAnalysis";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

// Mock API client
vi.mock("../lib/api", () => ({
  api: {
    analyzeVideo: vi.fn(),
    getVideoAnalysis: vi.fn(),
  },
}));

// Mock URL object methods for jsdom
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-video");
global.URL.revokeObjectURL = vi.fn();

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockAnalysisResponse: VideoAnalysisResponse = {
  id: "vanalysis_test123",
  video: {
    filename: "cinematic_tips.mp4",
    file_size_bytes: 4 * 1024 * 1024,
    file_size_mb: 4.0,
    duration_seconds: 15.0,
    width: 1080,
    height: 1920,
    fps: 30.0,
    has_audio: true,
    format: "mp4",
  },
  overall_score: 88,
  overall_rating: "High Retention Potential",
  summary: "Immediate contrarian hook followed by tight pacing and clear CTA directive.",
  metrics: [
    {
      id: "hook_strength",
      label: "Hook Strength",
      score: 92,
      rating: "Excellent",
      summary: "Opening speech begins at 0.2s with strong contrarian pattern interrupt.",
      evidence: ["Instant speech onset at 0.2s", "Delivers 7 words in opening 3 seconds"],
      recommendation: "Preserve this immediate vocal immediacy in future hooks.",
    },
    {
      id: "opening_clarity",
      label: "Opening Clarity",
      score: 86,
      rating: "Excellent",
      summary: "Core premise clearly communicated in opening sentence.",
      evidence: ["Subject clearly introduced"],
      recommendation: "Keep opening premise concise.",
    },
    {
      id: "retention_structure",
      label: "Retention Structure",
      score: 85,
      rating: "Excellent",
      summary: "Balanced 4-beat structure across 15 seconds.",
      evidence: ["4 timestamped beats"],
      recommendation: "Maintain 3-4s beat intervals.",
    },
    {
      id: "pacing",
      label: "Pacing",
      score: 90,
      rating: "Excellent",
      summary: "Speech cadence averages 2.65 words/second.",
      evidence: ["Optimal velocity for short-form video"],
      recommendation: "Trim minor pauses exceeding 1s.",
    },
    {
      id: "information_density",
      label: "Information Density",
      score: 84,
      rating: "Strong",
      summary: "Substantive camera settings provided.",
      evidence: ["Concrete camera shutter settings explained"],
      recommendation: "Add on-screen text to reinforce numbers.",
    },
    {
      id: "filler_repetition",
      label: "Filler / Repetition",
      score: 95,
      rating: "Excellent",
      summary: "Zero conversational filler phrases detected.",
      evidence: ["Clean vocal delivery"],
      recommendation: "Maintain this concise verbal efficiency.",
    },
    {
      id: "story_flow",
      label: "Story / Narrative Flow",
      score: 82,
      rating: "Strong",
      summary: "3-act setup, conflict, and solution flow.",
      evidence: ["Clear problem-to-solution transition"],
      recommendation: "Anchor conflict before providing solution.",
    },
    {
      id: "curiosity_open_loops",
      label: "Curiosity / Open Loops",
      score: 80,
      rating: "Strong",
      summary: "Includes curiosity trigger 'secret hack'.",
      evidence: ["Curiosity anchor in beat 2"],
      recommendation: "Tease the final reveal in the opening sentence.",
    },
    {
      id: "cta_strength",
      label: "CTA Strength",
      score: 88,
      rating: "Excellent",
      summary: "Explicit CTA detected in final segment.",
      evidence: ["Save this tip for your next shoot"],
      recommendation: "Keep CTA under 3 seconds.",
    },
    {
      id: "accessibility_readiness",
      label: "Caption / Accessibility Readiness",
      score: 94,
      rating: "Excellent",
      summary: "Granular speech timing ready for 1-click animated Caption Studio overlays.",
      evidence: ["4 synchronized timed speech segments"],
      recommendation: "Export to Caption Studio for animated styling.",
    },
  ],
  segments: [
    {
      segment_id: "seg_1",
      start_seconds: 0.2,
      end_seconds: 3.2,
      duration_seconds: 3.0,
      transcript: "Stop shooting at 60fps right now.",
      label: "HOOK",
      confidence: 0.95,
      observation: "Opening contrarian hook.",
    },
    {
      segment_id: "seg_2",
      start_seconds: 3.5,
      end_seconds: 7.8,
      duration_seconds: 4.3,
      transcript: "Here is why that frame rate is ruining your video blur.",
      label: "CONTEXT",
      confidence: 0.85,
      observation: "Problem setup.",
    },
    {
      segment_id: "seg_3",
      start_seconds: 8.0,
      end_seconds: 12.5,
      duration_seconds: 4.5,
      transcript: "Switch to 24fps with a 1/50 shutter speed.",
      label: "VALUE",
      confidence: 0.9,
      observation: "Technical resolution.",
    },
    {
      segment_id: "seg_4",
      start_seconds: 12.8,
      end_seconds: 15.0,
      duration_seconds: 2.2,
      transcript: "Save this tip for your next shoot.",
      label: "CTA",
      confidence: 0.95,
      observation: "Closing call-to-action directive.",
    },
  ],
  findings: [
    "Strength (Hook Strength): Opening speech begins at 0.2s with strong contrarian pattern interrupt.",
    "Strength (CTA Strength): Explicit CTA detected in final segment.",
  ],
  recommendations: [
    "Preserve this immediate vocal immediacy in future hooks.",
    "Export to Caption Studio for animated styling.",
  ],
  transcript: {
    available: true,
    language: "English",
    text: "Stop shooting at 60fps right now. Here is why that frame rate is ruining your video blur. Switch to 24fps with a 1/50 shutter speed. Save this tip for your next shoot.",
    segment_count: 4,
    word_count: 32,
    words_per_second: 2.65,
    silence_gaps_count: 1,
    provider: "local_whisper",
  },
  limitations: [],
  analyzed_at: "2026-10-05T12:00:00Z",
  provider_used: "local_whisper + deterministic_metrics",
};

describe("Video Analysis Module — Complete Creator Workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  describe("Upload Component & File Validation", () => {
    it("renders upload area with format specifications and language options", () => {
      render(<VideoAnalysisUpload onAnalyze={vi.fn()} isLoading={false} />);
      expect(screen.getByText(/Drag and drop short-form video/i)).toBeInTheDocument();
      expect(screen.getByText(/Supports MP4, MOV, WebM • Up to 100 MB/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Spoken Video Language/i)).toBeInTheDocument();
    });

    it("rejects 0-byte video file and displays actionable error alert", () => {
      render(<VideoAnalysisUpload onAnalyze={vi.fn()} isLoading={false} />);
      const input = screen.getByTestId("video-file-input");
      const emptyFile = new File([], "empty.mp4", { type: "video/mp4" });

      fireEvent.change(input, { target: { files: [emptyFile] } });

      expect(screen.getByText(/Selected video file is empty \(0 bytes\)/i)).toBeInTheDocument();
    });

    it("rejects file exceeding 100 MB with size notification", () => {
      render(<VideoAnalysisUpload onAnalyze={vi.fn()} isLoading={false} />);
      const input = screen.getByTestId("video-file-input");
      // Simulate 101 MB file
      const bigFile = new File([new Uint8Array(101 * 1024 * 1024)], "oversized.mp4", {
        type: "video/mp4",
      });

      fireEvent.change(input, { target: { files: [bigFile] } });

      expect(screen.getByText(/exceeds the strict 100 MB upload limit/i)).toBeInTheDocument();
    });

    it("rejects unsupported file extension", () => {
      render(<VideoAnalysisUpload onAnalyze={vi.fn()} isLoading={false} />);
      const input = screen.getByTestId("video-file-input");
      const txtFile = new File(["some text"], "script.txt", { type: "text/plain" });

      fireEvent.change(input, { target: { files: [txtFile] } });

      expect(screen.getByText(/Unsupported format "\.txt"/i)).toBeInTheDocument();
    });

    it("submits valid file and selected language to onAnalyze handler", () => {
      const mockAnalyze = vi.fn();
      render(<VideoAnalysisUpload onAnalyze={mockAnalyze} isLoading={false} />);
      const input = screen.getByTestId("video-file-input");
      const validFile = new File([new Uint8Array(1024)], "cinematic.mp4", { type: "video/mp4" });

      fireEvent.change(input, { target: { files: [validFile] } });
      const submitBtn = screen.getByRole("button", { name: /Run Retention Audit/i });
      fireEvent.click(submitBtn);

      expect(mockAnalyze).toHaveBeenCalledWith(validFile, "English");
    });
  });

  describe("HTML5 Video Preview & Interactive Controls", () => {
    it("renders video element and controls when video file is provided", () => {
      const file = new File([new Uint8Array(1024)], "test.mp4", { type: "video/mp4" });
      render(<VideoPreview videoFile={file} />);

      expect(screen.getByLabelText(/Play video/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mute audio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Video seek slider/i)).toBeInTheDocument();
    });

    it("exposes imperative seekTo handle for timeline synchronization", () => {
      const ref = React.createRef<VideoPreviewHandle>();
      const file = new File([new Uint8Array(1024)], "test.mp4", { type: "video/mp4" });
      render(<VideoPreview ref={ref} videoFile={file} />);

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.seekTo).toBe("function");
    });
  });

  describe("Analysis Score Card & 10 Metric Dimensions", () => {
    it("renders overall score, rating, and metadata badges correctly", () => {
      render(<AnalysisScoreCard analysis={mockAnalysisResponse} />);

      expect(screen.getByText("88")).toBeInTheDocument();
      expect(screen.getByText("High Retention Potential")).toBeInTheDocument();
      expect(screen.getByText("15.0s")).toBeInTheDocument();
      expect(screen.getByText("1080×1920")).toBeInTheDocument();
      expect(screen.getByText("30 fps")).toBeInTheDocument();
    });

    it("renders all 10 retention criteria and expands evidence on click", () => {
      render(<MetricScoreGrid metrics={mockAnalysisResponse.metrics} />);

      expect(screen.getByText("Hook Strength")).toBeInTheDocument();
      expect(screen.getByText("Opening Clarity")).toBeInTheDocument();
      expect(screen.getByText("Retention Structure")).toBeInTheDocument();
      expect(screen.getByText("Pacing")).toBeInTheDocument();
      expect(screen.getByText("Information Density")).toBeInTheDocument();
      expect(screen.getByText("Filler / Repetition")).toBeInTheDocument();
      expect(screen.getByText("Story / Narrative Flow")).toBeInTheDocument();
      expect(screen.getByText("Curiosity / Open Loops")).toBeInTheDocument();
      expect(screen.getByText("CTA Strength")).toBeInTheDocument();
      expect(screen.getByText("Caption / Accessibility Readiness")).toBeInTheDocument();

      // Click to expand Hook Strength
      const hookCard = screen.getByText("Hook Strength").closest("div");
      fireEvent.click(hookCard!);

      expect(screen.getByText("Instant speech onset at 0.2s")).toBeInTheDocument();
      expect(screen.getByText(/Recommended Tweak:/i)).toBeInTheDocument();
    });
  });

  describe("Timeline & Segment Seeking", () => {
    it("renders time-coded narrative segments and triggers onSeek when clicked", () => {
      const mockSeek = vi.fn();
      render(
        <AnalysisTimeline
          segments={mockAnalysisResponse.segments}
          durationSeconds={15.0}
          onSeek={mockSeek}
        />
      );

      expect(screen.getByText(/\[HOOK\]/i)).toBeInTheDocument();
      expect(screen.getByText(/\[CONTEXT\]/i)).toBeInTheDocument();
      expect(screen.getByText(/\[VALUE\]/i)).toBeInTheDocument();
      expect(screen.getByText(/\[CTA\]/i)).toBeInTheDocument();

      // Click on the HOOK card
      const hookItem = screen.getByText(/Stop shooting at 60fps right now/i);
      fireEvent.click(hookItem);

      expect(mockSeek).toHaveBeenCalledWith(0.2);
    });
  });

  describe("Transcript Panel & Copy Action", () => {
    it("displays spoken transcript and triggers clipboard copy", async () => {
      render(<TranscriptPanel transcript={mockAnalysisResponse.transcript} />);

      expect(screen.getByText(/Stop shooting at 60fps right now/i)).toBeInTheDocument();
      expect(screen.getByText(/32 words • 2.65 words\/sec/i)).toBeInTheDocument();

      const copyBtn = screen.getByRole("button", { name: /Copy Transcript/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAnalysisResponse.transcript.text);
    });
  });


  describe("Creator Handoff Actions", () => {
    it("navigates to /analyzer with transcript stored in sessionStorage", () => {
      render(<HandoffActions analysis={mockAnalysisResponse} onReset={vi.fn()} />);

      const analyzerBtn = screen.getByRole("button", { name: /Open Script Analyzer/i });
      fireEvent.click(analyzerBtn);

      expect(mockPush).toHaveBeenCalledWith("/analyzer");
      const stored = window.sessionStorage.getItem("cineha_script_text_handoff");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).script_text).toContain("Stop shooting at 60fps");
    });

    it("navigates to /optimizer with OptimizerHandoffPayload stored in sessionStorage", () => {
      render(<HandoffActions analysis={mockAnalysisResponse} onReset={vi.fn()} />);

      const optimizerBtn = screen.getByRole("button", { name: /Open Script Optimizer/i });
      fireEvent.click(optimizerBtn);

      expect(mockPush).toHaveBeenCalledWith("/optimizer");
      const stored = window.sessionStorage.getItem("cineha_optimizer_handoff");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.title).toBe("cinematic_tips");
      expect(parsed.recommendedGoals).toBeDefined();
    });
  });

  describe("End-to-End Workspace Workflow", () => {
    it("executes complete flow: upload -> progressive stage loading -> renders audit results", async () => {
      (api.analyzeVideo as any).mockResolvedValue(mockAnalysisResponse);

      render(<VideoAnalysisPage />);

      // Verify page header
      expect(screen.getByText("Video Retention Analyzer")).toBeInTheDocument();

      // Upload file
      const input = screen.getByTestId("video-file-input");
      const file = new File([new Uint8Array(1024)], "demo.mp4", { type: "video/mp4" });
      fireEvent.change(input, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: /Run Retention Audit/i });
      fireEvent.click(submitBtn);

      // Loading stage indicator
      expect(screen.getByText(/Running Multimodal Retention Audit/i)).toBeInTheDocument();

      // Wait for result
      await waitFor(() => {
        expect(screen.getByText("High Retention Potential")).toBeInTheDocument();
      });

      expect(screen.getAllByText("88").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("10-Dimensional Retention Diagnostics")).toBeInTheDocument();
    });

    it("displays error message if analysis fails", async () => {
      (api.analyzeVideo as any).mockRejectedValue(new Error("FFmpeg media container decode failed"));

      render(<VideoAnalysisPage />);

      const input = screen.getByTestId("video-file-input");
      const file = new File([new Uint8Array(1024)], "corrupted.mp4", { type: "video/mp4" });
      fireEvent.change(input, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: /Run Retention Audit/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/FFmpeg media container decode failed/i)).toBeInTheDocument();
      });
    });

    it("loads existing analysis record when initialAnalysisId is provided", async () => {
      (api.getVideoAnalysis as any).mockResolvedValue(mockAnalysisResponse);

      render(<VideoAnalysisWorkspace initialAnalysisId="vanalysis_test123" />);

      await waitFor(() => {
        expect(api.getVideoAnalysis).toHaveBeenCalledWith("vanalysis_test123");
        expect(screen.getByText("High Retention Potential")).toBeInTheDocument();
      });

      expect(screen.getByText("cinematic_tips.mp4")).toBeInTheDocument();
    });
  });
});
