from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey
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

    versions = relationship(
        "ScriptVersion",
        back_populates="script",
        cascade="all, delete-orphan",
        order_by="ScriptVersion.version_number.desc()",
    )

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
