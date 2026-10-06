from sqlalchemy import Column, String, Text, JSON, ForeignKey
from app.models.base import BaseModel

class TrendResearchSession(BaseModel):
    __tablename__ = "trend_research_sessions"

    profile_id = Column(
        String(36),
        ForeignKey("creator_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    query_topic = Column(String(255), nullable=True)
    niche = Column(String(100), nullable=False)
    target_audience = Column(Text, nullable=True)
    platform = Column(String(50), nullable=False, default="Instagram Reels")
    language = Column(String(50), nullable=False, default="English")
    research_depth = Column(String(50), nullable=False, default="Deep Dive")
    time_horizon = Column(String(50), nullable=False, default="Current Momentum")
    summary = Column(Text, nullable=True)
    opportunities = Column(JSON, nullable=False, default=list)
    provider_used = Column(String(50), nullable=False, default="heuristic_mock")
