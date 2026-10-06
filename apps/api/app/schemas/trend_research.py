from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.creator_profile import CreatorProfileBase


def calculate_overall_score(
    momentum: int,
    audience_fit: int,
    creator_fit: int,
    content_opportunity: int,
    urgency: int,
) -> int:
    """
    Computes transparent weighted Content Opportunity Score (0-100):
    Momentum (20%) + Audience Fit (25%) + Creator Fit (25%) + Content Opportunity (20%) + Urgency (10%).
    """
    score = (
        (0.20 * momentum)
        + (0.25 * audience_fit)
        + (0.25 * creator_fit)
        + (0.20 * content_opportunity)
        + (0.10 * urgency)
    )
    return max(0, min(100, round(score)))


class TrendScoreBreakdown(BaseModel):
    momentum: int = Field(ge=0, le=100, description="Interest momentum velocity (weight 20%)")
    audience_fit: int = Field(ge=0, le=100, description="Target audience pain point & interest fit (weight 25%)")
    creator_fit: int = Field(ge=0, le=100, description="Creator voice, niche, and skill alignment (weight 25%)")
    content_opportunity: int = Field(ge=0, le=100, description="Engagement potential vs competition (weight 20%)")
    urgency: int = Field(ge=0, le=100, description="Timeliness and immediate creator relevance (weight 10%)")
    overall_score: int = Field(ge=0, le=100, description="Weighted composite Content Opportunity Score")


class TrendSourceInfo(BaseModel):
    type: str = Field(
        default="ai_opportunity_research",
        description="Source type: ai_opportunity_research | creator_profile_analysis | heuristic_opportunity | user_topic_research",
    )
    label: str = Field(default="AI Opportunity Analysis", description="Human-readable attribution label")
    verified: bool = Field(default=False, description="Whether citation is backed by verified web source")
    citation: Optional[str] = Field(
        default="Synthesized from Creator Persona, Content Pillars & Short-Form Pattern Engine",
        description="Transparent methodology or citation",
    )


class TrendOpportunityItem(BaseModel):
    id: str
    topic: str
    primary_niche: str
    target_audience: str
    platform: str
    language: str
    content_pillar: Optional[str] = None
    recommended_format: str
    recommended_duration: str
    recommended_cta: str
    scores: TrendScoreBreakdown
    why_it_matters: str
    angle_ideas: List[str] = Field(default_factory=list)
    recommended_hooks: List[str] = Field(default_factory=list)
    talking_points: List[str] = Field(default_factory=list)
    source: TrendSourceInfo


class TrendResearchRequest(BaseModel):
    topic: Optional[str] = Field(None, description="Optional seed query or specific topic to explore")
    niche: Optional[str] = Field(None, description="Domain/niche override (defaults to Creator Profile)")
    target_audience: Optional[str] = Field(None, description="Target audience override")
    platform: Optional[str] = Field("Instagram Reels", description="Target platform (Instagram Reels, YouTube Shorts, TikTok)")
    language: Optional[str] = Field("English", description="Target language (English, Telugu, Tanglish)")
    research_depth: Optional[str] = Field("Deep Dive", description="Depth: Quick Opportunities | Deep Dive | Comprehensive")
    time_horizon: Optional[str] = Field("Current Momentum", description="Horizon: Current Momentum | Next 30 Days | Evergreen")
    count: Optional[int] = Field(5, ge=1, le=10, description="Number of content opportunities to return")
    creator_profile: Optional[CreatorProfileBase] = None


class TrendResearchSessionResponse(BaseModel):
    id: str
    profile_id: Optional[str] = None
    query_topic: Optional[str] = None
    niche: str
    target_audience: Optional[str] = None
    platform: str
    language: str
    research_depth: str
    time_horizon: str
    summary: Optional[str] = None
    opportunities: List[TrendOpportunityItem] = Field(default_factory=list)
    provider_used: str = "heuristic_mock"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrendResearchHistoryItem(BaseModel):
    id: str
    query_topic: Optional[str] = None
    niche: str
    platform: str
    language: str
    opportunity_count: int
    top_opportunity_title: Optional[str] = None
    top_score: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrendResearchHistoryResponse(BaseModel):
    sessions: List[TrendResearchHistoryItem] = Field(default_factory=list)
    total: int = 0
