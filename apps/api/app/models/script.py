from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Script(BaseModel):
    __tablename__ = "scripts"

    profile_id = Column(
        String(36),
        ForeignKey("creator_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(200), nullable=False)
    topic = Column(String(500), nullable=False)
    platform = Column(String(50), nullable=False, index=True)
    language = Column(String(50), nullable=False)
    duration_seconds = Column(Integer, nullable=False, default=30)
    tone = Column(String(100), nullable=False)
    hook = Column(Text, nullable=False)
    segments = Column(JSON, nullable=False, default=list)
    cta = Column(String(255), nullable=False)
    provider_used = Column(String(50), nullable=False, default="heuristic_mock")
    current_version = Column(Integer, nullable=False, default=1)

    # Source & extraction metadata
    source_type = Column(String(50), nullable=True, default="scratch")
    source_url = Column(String(500), nullable=True)
    source_platform = Column(String(50), nullable=True)
    original_video_title = Column(String(255), nullable=True)
    extraction_method = Column(String(50), nullable=True)

    versions = relationship(
        "ScriptVersion",
        back_populates="script",
        cascade="all, delete-orphan",
        order_by="ScriptVersion.version_number.desc()",
    )

    visuals = relationship(
        "ScriptVisual",
        back_populates="script",
        cascade="all, delete-orphan",
        order_by="ScriptVisual.created_at.asc()",
    )

class ScriptVisual(BaseModel):
    __tablename__ = "script_visuals"

    script_id = Column(
        String(36),
        ForeignKey("scripts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    script_version_id = Column(String(36), nullable=True)
    segment_id = Column(String(100), nullable=False, index=True)
    concept_title = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    visual_type = Column(String(50), nullable=False, default="Concept Illustration")
    importance = Column(String(50), nullable=False, default="Recommended")
    related_script_text = Column(Text, nullable=False)
    suggested_prompt = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    aspect_ratio = Column(String(20), nullable=False, default="9:16")
    style = Column(String(50), nullable=False, default="Clean Educational")
    language = Column(String(50), nullable=False, default="English")
    status = Column(String(50), nullable=False, default="suggested")
    image_asset_reference = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    provider = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    placement = Column(String(100), nullable=True)
    is_attached = Column(Boolean, nullable=False, default=False)
    error_message = Column(Text, nullable=True)

    script = relationship("Script", back_populates="visuals")

class ScriptVersion(BaseModel):
    __tablename__ = "script_versions"

    script_id = Column(
        String(36),
        ForeignKey("scripts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    segments = Column(JSON, nullable=False, default=list)
    hook = Column(Text, nullable=False)
    cta = Column(String(255), nullable=False)
    change_summary = Column(String(255), nullable=False, default="Initial generation")
    provider_used = Column(String(50), nullable=False, default="heuristic_mock")

    script = relationship("Script", back_populates="versions")
