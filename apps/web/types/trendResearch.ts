export type ResearchLanguage = "English" | "Telugu" | "Tanglish";

export type ResearchDepth = "Quick Opportunities" | "Deep Dive" | "Comprehensive";

export type TimeHorizon = "Current Momentum" | "Next 30 Days" | "Evergreen";

export interface TrendScoreBreakdown {
  momentum: number; // 20%
  audience_fit: number; // 25%
  creator_fit: number; // 25%
  content_opportunity: number; // 20%
  urgency: number; // 10%
  overall_score: number; // Weighted composite
}

export interface TrendSourceInfo {
  type: "ai_opportunity_research" | "creator_profile_analysis" | "heuristic_opportunity" | "user_topic_research";
  label: string;
  verified: boolean;
  citation?: string;
}

export interface TrendOpportunityItem {
  id: string;
  topic: string;
  primary_niche: string;
  target_audience: string;
  platform: string;
  language: string;
  content_pillar?: string;
  recommended_format: string;
  recommended_duration: string;
  recommended_cta: string;
  scores: TrendScoreBreakdown;
  why_it_matters: string;
  angle_ideas: string[];
  recommended_hooks: string[];
  talking_points: string[];
  source: TrendSourceInfo;
}

export interface TrendResearchRequest {
  topic?: string;
  niche?: string;
  target_audience?: string;
  platform?: string;
  language?: string;
  research_depth?: string;
  time_horizon?: string;
  count?: number;
  creator_profile?: any;
}

export interface TrendResearchSessionResponse {
  id: string;
  profile_id?: string;
  query_topic?: string;
  niche: string;
  target_audience?: string;
  platform: string;
  language: string;
  research_depth: string;
  time_horizon: string;
  summary?: string;
  opportunities: TrendOpportunityItem[];
  provider_used: string;
  created_at: string;
  updated_at: string;
}

export interface TrendResearchHistoryItem {
  id: string;
  query_topic?: string;
  niche: string;
  platform: string;
  language: string;
  opportunity_count: number;
  top_opportunity_title?: string;
  top_score?: number;
  created_at: string;
}

export interface TrendResearchHistoryResponse {
  sessions: TrendResearchHistoryItem[];
  total: number;
}
