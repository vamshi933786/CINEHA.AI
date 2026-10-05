from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class VideoMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")

    filename: str = Field(..., description="Name of the uploaded video file")
    file_size_bytes: int = Field(..., ge=0, description="Size in bytes")
    file_size_mb: float = Field(..., ge=0.0, description="Size in megabytes")
    duration_seconds: float = Field(..., ge=0.0, description="Probed duration in seconds")
    width: int = Field(..., ge=0, description="Video frame width in pixels")
    height: int = Field(..., ge=0, description="Video frame height in pixels")
    fps: float = Field(..., ge=0.0, description="Video frame rate per second")
    has_audio: bool = Field(..., description="Whether an audio stream was detected")
    format: str = Field(..., description="Detected video container format e.g. mp4, mov, webm")


class VideoAnalysisMetric(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique machine identifier for metric")
    label: str = Field(..., description="Human-readable category label")
    score: int = Field(..., ge=0, le=100, description="Heuristic score strictly bounded 0-100")
    rating: str = Field(..., description="Qualitative rating label e.g. Excellent, Strong, Moderate, Needs Work")
    summary: str = Field(..., description="Concise analysis explanation")
    evidence: List[str] = Field(default_factory=list, description="Specific factual observations supporting the score")
    recommendation: Optional[str] = Field(default=None, description="Actionable tweak to improve this dimension")


class VideoAnalysisSegment(BaseModel):
    model_config = ConfigDict(extra="ignore")

    segment_id: str = Field(..., description="Identifier for this structural segment")
    start_seconds: float = Field(..., ge=0.0, description="Start timestamp in seconds")
    end_seconds: float = Field(..., ge=0.0, description="End timestamp in seconds")
    duration_seconds: float = Field(..., ge=0.0, description="Duration of segment in seconds")
    transcript: str = Field(..., description="Spoken transcript excerpt for this segment")
    label: str = Field(..., description="Structural classification e.g. HOOK, CONTEXT, VALUE, PAYOFF, CTA")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in classification heuristic")
    observation: Optional[str] = Field(default=None, description="Detailed pedagogical observation")


class VideoTranscriptInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")

    available: bool = Field(..., description="Whether a spoken transcript was successfully extracted")
    language: str = Field(default="English", description="Spoken language analyzed")
    text: str = Field(default="", description="Full spoken transcript")
    segment_count: int = Field(default=0, ge=0, description="Number of speech segments detected")
    word_count: int = Field(default=0, ge=0, description="Total spoken word count")
    words_per_second: float = Field(default=0.0, ge=0.0, description="Speech velocity")
    silence_gaps_count: int = Field(default=0, ge=0, description="Number of detectable silence gaps (>1s)")
    provider: str = Field(default="local_whisper", description="Transcription provider used")
    notice: Optional[str] = Field(default=None, description="Optional provider or restoration notice")


class VideoAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique analysis record identifier")
    video: VideoMetadata = Field(..., description="Technical video container metadata")
    overall_score: int = Field(..., ge=0, le=100, description="Overall retention potential score (0-100)")
    overall_rating: str = Field(..., description="Overall qualitative tier e.g. High Retention, Good, Fair, Needs Work")
    summary: str = Field(..., description="Creator-facing executive summary")
    metrics: List[VideoAnalysisMetric] = Field(..., description="10 standardized evaluation metrics")
    segments: List[VideoAnalysisSegment] = Field(default_factory=list, description="Time-coded structural breakdown")
    findings: List[str] = Field(default_factory=list, description="Key empirical strengths and drop-off hazards")
    recommendations: List[str] = Field(default_factory=list, description="Prioritized creator action items")
    transcript: VideoTranscriptInfo = Field(..., description="Full spoken transcript details")
    limitations: List[str] = Field(default_factory=list, description="Methodology disclosures and unavailable signals")
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    provider_used: str = Field(default="local_whisper_gemini", description="AI / heuristic engine utilized")
