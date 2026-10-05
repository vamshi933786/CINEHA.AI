from sqlalchemy import Column, String, Text, JSON
from app.models.base import BaseModel

class CreatorProfile(BaseModel):
    __tablename__ = "creator_profiles"

    # Profile Identity
    creator_name = Column(String(100), nullable=False, index=True)
    display_name = Column(String(100), nullable=True)
    creator_type = Column(String(50), nullable=False, default="Filmmaker")
    creator_bio = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)

    # Content Identity
    niche = Column(String(100), nullable=False, index=True)
    secondary_niches = Column(JSON, nullable=False, default=list)
    content_pillars = Column(JSON, nullable=False, default=list)
    topics_to_avoid = Column(JSON, nullable=False, default=list)

    # Audience Persona
    target_audience = Column(Text, nullable=True)
    target_audience_age = Column(String(50), nullable=True)
    audience_interests = Column(JSON, nullable=False, default=list)
    audience_pain_points = Column(JSON, nullable=False, default=list)
    audience_sophistication = Column(String(50), nullable=True)

    # Voice & Style
    content_tones = Column(JSON, nullable=False, default=list)
    energy = Column(String(50), nullable=True)
    humor = Column(String(50), nullable=True)
    storytelling_style = Column(String(50), nullable=True)
    vocabulary = Column(String(50), nullable=True)
    custom_tone_notes = Column(Text, nullable=True)

    # Content & Platform Preferences
    primary_language = Column(String(50), nullable=False)
    secondary_languages = Column(JSON, nullable=False, default=list)
    script_preference = Column(String(50), nullable=True)
    platforms = Column(JSON, nullable=False, default=list)
    preferred_aspect_ratio = Column(String(20), nullable=True)
    typical_duration = Column(String(50), nullable=True)
    cta_style = Column(String(50), nullable=True)
    secondary_cta_styles = Column(JSON, nullable=False, default=list)
    content_goals = Column(JSON, nullable=False, default=list)

    # Brand Guidance
    brand_positioning = Column(Text, nullable=True)
    core_message = Column(Text, nullable=True)
    words_to_use = Column(JSON, nullable=False, default=list)
    words_to_avoid = Column(JSON, nullable=False, default=list)
    style_rules = Column(JSON, nullable=False, default=list)
    liked_examples = Column(JSON, nullable=False, default=list)
    disliked_examples = Column(JSON, nullable=False, default=list)
