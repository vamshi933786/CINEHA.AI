import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TrendControlBar } from "@/components/research/TrendControlBar";
import { TrendOpportunityCard } from "@/components/research/TrendOpportunityCard";
import { ResearchHistoryDrawer } from "@/components/research/ResearchHistoryDrawer";
import type { TrendOpportunityItem, TrendResearchHistoryItem } from "@/types/trendResearch";
import { api } from "@/lib/api";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock api
vi.mock("@/lib/api", () => ({
  api: {
    createTrendResearch: vi.fn(),
    getTrendResearchHistory: vi.fn().mockResolvedValue({ sessions: [], total: 0 }),
    getTrendResearchSession: vi.fn(),
    refreshTrendResearchSession: vi.fn(),
    deleteTrendResearchSession: vi.fn(),
    createContentItem: vi.fn().mockResolvedValue({ id: "cal_123" }),
  },
}));

describe("Trend Research Assistant — Frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOpportunity: TrendOpportunityItem = {
    id: "opp_1",
    topic: "1-Light Budget Cinematic Lighting Setup",
    primary_niche: "Cinematography",
    target_audience: "Aspiring mobile filmmakers",
    platform: "Instagram Reels",
    language: "English",
    content_pillar: "Lighting Breakdowns",
    recommended_format: "Visual Teardown + Real Setup Proof",
    recommended_duration: "30–45s",
    recommended_cta: "Save this setup before your next shoot.",
    scores: {
      momentum: 92,
      audience_fit: 94,
      creator_fit: 96,
      content_opportunity: 90,
      urgency: 88,
      overall_score: 93,
    },
    why_it_matters: "Solves flat lighting without expensive gear, commanding high save rates.",
    angle_ideas: [
      "The 45-degree key light rule",
      "Why your $1,500 camera looks worse than a well-lit phone",
    ],
    recommended_hooks: [
      "Stop upgrading your camera. Your lighting is the real reason your videos look flat.",
      "Here is the exact 1-light setup top creators use that costs under $25.",
    ],
    talking_points: [
      "1. Demonstrate overhead flat room light vs 45-degree placement",
      "2. Lock manual smartphone exposure",
    ],
    source: {
      type: "creator_profile_analysis",
      label: "Creator Persona & Opportunity Engine",
      verified: false,
      citation: "Synthesized from Creator Persona & Pattern Engine",
    },
  };

  describe("TrendControlBar Component", () => {
    it("renders topic input, quick suggestions, and strictly English/Telugu/Tanglish language options", () => {
      const setTopic = vi.fn();
      const setLanguage = vi.fn();
      const onAnalyze = vi.fn();

      render(
        <TrendControlBar
          topic=""
          setTopic={setTopic}
          language="English"
          setLanguage={setLanguage}
          platform="Instagram Reels"
          setPlatform={vi.fn()}
          niche="Cinematography"
          setNiche={vi.fn()}
          audience="Mobile creators"
          setAudience={vi.fn()}
          depth="Deep Dive"
          setDepth={vi.fn()}
          horizon="Current Momentum"
          setHorizon={vi.fn()}
          count={5}
          setCount={vi.fn()}
          isLoading={false}
          onAnalyze={onAnalyze}
          creatorProfile={null}
        />
      );

      // Verify language pills
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("తెలుగు")).toBeInTheDocument();
      expect(screen.getByText("Tanglish")).toBeInTheDocument();

      // Ensure Hindi is strictly NOT present
      expect(screen.queryByText("Hindi")).not.toBeInTheDocument();
      expect(screen.queryByText("हिन्दी")).not.toBeInTheDocument();

      // Trigger analyze
      const analyzeBtn = screen.getByRole("button", { name: /Discover Content Opportunities/i });
      fireEvent.click(analyzeBtn);
      expect(onAnalyze).toHaveBeenCalledTimes(1);

      // Switch language to Telugu
      const teluguBtn = screen.getByText("తెలుగు");
      fireEvent.click(teluguBtn);
      expect(setLanguage).toHaveBeenCalledWith("Telugu");
    });
  });

  describe("TrendOpportunityCard Component", () => {
    it("renders transparent 5-factor scoring, hooks, and strategic why_it_matters", () => {
      render(<TrendOpportunityCard opportunity={mockOpportunity} />);

      // Overall Score
      expect(screen.getByText("93/100")).toBeInTheDocument();
      expect(screen.getByText(/Exceptional Opportunity/i)).toBeInTheDocument();

      // Topic & Metadata
      expect(screen.getByText("1-Light Budget Cinematic Lighting Setup")).toBeInTheDocument();
      expect(screen.getByText("Lighting Breakdowns")).toBeInTheDocument();
      expect(screen.getByText("30–45s")).toBeInTheDocument();

      // 5-factor scoring transparent verification
      expect(screen.getByText("Momentum")).toBeInTheDocument();
      expect(screen.getByText("92")).toBeInTheDocument();
      expect(screen.getByText("Audience Fit")).toBeInTheDocument();
      expect(screen.getByText("94")).toBeInTheDocument();
      expect(screen.getByText("Creator Fit")).toBeInTheDocument();
      expect(screen.getByText("96")).toBeInTheDocument();
      expect(screen.getByText("Opportunity")).toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
      expect(screen.getByText("Urgency")).toBeInTheDocument();
      expect(screen.getByText("88")).toBeInTheDocument();

      // Strategic reason
      expect(screen.getByText(/Solves flat lighting without expensive gear/i)).toBeInTheDocument();

      // Hooks
      expect(screen.getByText(/Stop upgrading your camera/i)).toBeInTheDocument();

      // Transparent source attribution (zero fake viral numbers)
      expect(screen.getByText("Creator Persona & Opportunity Engine")).toBeInTheDocument();
      expect(screen.getByText(/No fake metrics • Pattern engine/i)).toBeInTheDocument();
    });

    it("handles one-click copy hook to clipboard", async () => {
      // Mock clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(<TrendOpportunityCard opportunity={mockOpportunity} />);

      const copyButtons = screen.getAllByTitle("Copy hook to clipboard");
      fireEvent.click(copyButtons[0]);

      expect(writeTextMock).toHaveBeenCalledWith(
        "Stop upgrading your camera. Your lighting is the real reason your videos look flat."
      );
    });

    it("triggers seamless handoff to Hook Generator with pre-filled context", () => {
      render(<TrendOpportunityCard opportunity={mockOpportunity} />);

      const hookHandoffBtn = screen.getByRole("button", { name: /Generate Hooks/i });
      fireEvent.click(hookHandoffBtn);

      expect(mockPush).toHaveBeenCalledTimes(1);
      const pushedUrl = mockPush.mock.calls[0][0];
      expect(pushedUrl).toContain("/hooks?");
      expect(pushedUrl).toContain("topic=1-Light+Budget+Cinematic+Lighting+Setup");
      expect(pushedUrl).toContain("language=English");
    });

    it("triggers seamless handoff to Script Studio with pre-filled hook and topic", () => {
      render(<TrendOpportunityCard opportunity={mockOpportunity} />);

      const scriptHandoffBtn = screen.getByRole("button", { name: /Create Script/i });
      fireEvent.click(scriptHandoffBtn);

      expect(mockPush).toHaveBeenCalledTimes(1);
      const pushedUrl = mockPush.mock.calls[0][0];
      expect(pushedUrl).toContain("/scripts?");
      expect(pushedUrl).toContain("topic=1-Light+Budget+Cinematic+Lighting+Setup");
      expect(pushedUrl).toContain("hook=Stop+upgrading+your+camera");
    });

    it("schedules directly into Content Calendar via API", async () => {
      const onAdded = vi.fn();
      render(
        <TrendOpportunityCard
          opportunity={mockOpportunity}
          onAddedToCalendar={onAdded}
        />
      );

      const calendarBtn = screen.getByRole("button", { name: /Schedule to Calendar/i });
      fireEvent.click(calendarBtn);

      await waitFor(() => {
        expect(api.createContentItem).toHaveBeenCalledTimes(1);
        expect(onAdded).toHaveBeenCalledWith("1-Light Budget Cinematic Lighting Setup");
      });
    });
  });

  describe("ResearchHistoryDrawer Component", () => {
    it("renders list of past sessions and handles selection/refresh/delete actions", () => {
      const mockHistory: TrendResearchHistoryItem[] = [
        {
          id: "hist_1",
          query_topic: "Mobile Gimbal Movements",
          niche: "Cinematography",
          platform: "Instagram Reels",
          language: "Tanglish",
          opportunity_count: 5,
          top_score: 95,
          created_at: new Date().toISOString(),
        },
      ];

      const onSelect = vi.fn();
      const onRefresh = vi.fn();
      const onDelete = vi.fn();

      render(
        <ResearchHistoryDrawer
          isOpen={true}
          onClose={vi.fn()}
          history={mockHistory}
          onSelectSession={onSelect}
          onDeleteSession={onDelete}
          onRefreshSession={onRefresh}
        />
      );

      expect(screen.getByText("Mobile Gimbal Movements")).toBeInTheDocument();
      expect(screen.getByText("Tanglish")).toBeInTheDocument();
      expect(screen.getByText("5 opportunities")).toBeInTheDocument();

      // Click session
      fireEvent.click(screen.getByText("Mobile Gimbal Movements"));
      expect(onSelect).toHaveBeenCalledWith("hist_1");

      // Click refresh
      const refreshBtn = screen.getByTitle("Re-run research");
      fireEvent.click(refreshBtn);
      expect(onRefresh).toHaveBeenCalledWith("hist_1");

      // Click delete
      const deleteBtn = screen.getByTitle("Delete session");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith("hist_1");
    });
  });
});
