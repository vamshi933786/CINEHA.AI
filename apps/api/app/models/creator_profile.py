from sqlalchemy import Column, String, Text, JSON
from app.models.base import BaseModel

class CreatorProfile(BaseModel):
    __tablename__ = "creator_profiles"

    creator_name = Column(String(100), nullable=False, index=True)
    niche = Column(String(100), nullable=False, index=True)
    target_audience = Column(Text, nullable=True)
    platforms = Column(JSON, nullable=False, default=list)
    primary_language = Column(String(50), nullable=False)
    content_tones = Column(JSON, nullable=False, default=list)
    creator_bio = Column(Text, nullable=True)
    content_goals = Column(JSON, nullable=False, default=list)
