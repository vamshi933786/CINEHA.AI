from sqlalchemy import Column, String, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class ContentItem(BaseModel):
    __tablename__ = "content_items"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    scheduled_time = Column(String(10), nullable=True)  # HH:MM or HH:MM AM/PM
    status = Column(String(50), nullable=False, default="Planned", index=True)
    platform = Column(String(50), nullable=False, default="Instagram Reels", index=True)
    content_type = Column(String(50), nullable=False, default="Educational")
    language = Column(String(50), nullable=False, default="Tanglish")

    script_id = Column(
        String(36),
        ForeignKey("scripts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    script_version_id = Column(
        String(36),
        ForeignKey("script_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    hook_id = Column(String(100), nullable=True)
    video_analysis_id = Column(
        String(36),
        ForeignKey("video_analyses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    content_pillar = Column(String(100), nullable=True)
    content_goal = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=False, default="Medium")
    tags = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    cta = Column(String(255), nullable=True)

    # Relationships to existing entities
    script = relationship("Script", foreign_keys=[script_id], lazy="selectin")
    script_version = relationship("ScriptVersion", foreign_keys=[script_version_id], lazy="selectin")
    video_analysis = relationship("VideoAnalysis", foreign_keys=[video_analysis_id], lazy="selectin")
