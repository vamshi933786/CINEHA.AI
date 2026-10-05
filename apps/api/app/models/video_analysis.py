from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON
from app.models.base import BaseModel

class VideoAnalysis(BaseModel):
    __tablename__ = "video_analyses"

    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    width = Column(Integer, nullable=False, default=1080)
    height = Column(Integer, nullable=False, default=1920)
    fps = Column(Float, nullable=False, default=30.0)
    has_audio = Column(Boolean, nullable=False, default=True)

    overall_score = Column(Integer, nullable=False, default=0)
    overall_rating = Column(String(50), nullable=False, default="Needs Work")
    summary = Column(Text, nullable=False, default="")

    metrics = Column(JSON, nullable=False, default=list)
    segments = Column(JSON, nullable=False, default=list)
    findings = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)

    transcript_text = Column(Text, nullable=True)
    transcript_metadata = Column(JSON, nullable=False, default=dict)
    limitations = Column(JSON, nullable=False, default=list)
    provider_used = Column(String(100), nullable=False, default="local_whisper_gemini")
