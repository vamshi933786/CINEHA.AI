from datetime import datetime, timezone
from typing import Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.script import ScriptSegmentSchema


class CategoryScoreSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    score: int = Field(..., ge=0, le=100, description="Score from 0 to 100")
    rating: str = Field(..., description="Rating label, e.g. Excellent, Good, Fair, Poor")
    explanation: str = Field(..., description="Specific evaluation explaining why this score was assigned")


class SegmentObservationSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    segment_id: str = Field(..., description="ID of the screenplay segment")
    time_range: str = Field(..., description="Timestamp interval e.g. 0:00–0:03")
    section: str = Field(..., description="Section label e.g. HOOK, PROBLEM, SOLUTION")
    observation: str = Field(default="", description="Specific observation on pacing, wording, or viewer engagement")
    retention_risk: str = Field(default="low", description="Risk level: low, medium, high")
    suggestion: Optional[str] = Field(default=None, description="Actionable tweak to reduce drop-off")

    @model_validator(mode="before")
    @classmethod
    def normalize_observation(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("observation") and data.get("explanation"):
                data["observation"] = data["explanation"]
        return data


class ScriptAnalysisMetrics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_word_count: int = Field(..., ge=0, description="Total spoken word count in script")
    words_per_second: float = Field(..., ge=0.0, description="Pacing velocity in words per second")
    pacing_assessment: str = Field(..., description="Assessment e.g. Optimal, Rushed, Slow")
    detected_filler_words: List[str] = Field(default_factory=list, description="List of detected filler words or fluff")
    hook_duration_seconds: float = Field(..., ge=0.0, description="Duration in seconds of the opening hook beat")
    cta_duration_seconds: float = Field(default=0.0, ge=0.0, description="Duration in seconds of the closing CTA beat")


class ScriptAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    script_id: Optional[str] = Field(default=None, description="Optional ID of saved script in database")
    title: Optional[str] = Field(default=None, max_length=200, description="Script title if analyzing unsaved script")
    topic: Optional[str] = Field(default=None, max_length=500, description="Script topic/premise")
    platform: Optional[str] = Field(default="Instagram Reels", description="Target platform")
    language: Optional[str] = Field(default="English", description="Script language")
    duration_seconds: Optional[int] = Field(default=30, ge=5, le=180, description="Expected video duration")
    hook: Optional[str] = Field(default=None, description="Opening hook line")
    segments: Optional[List[ScriptSegmentSchema]] = Field(default=None, description="Array of time-coded beats")
    cta: Optional[str] = Field(default=None, description="Closing call to action")
    script_text: Optional[str] = Field(default=None, description="Normalized script text for direct analysis")
    source_type: Optional[str] = Field(default=None, description="Source format: text, pdf, docx, or image")


class ScriptAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    script_id: Optional[str] = None
    title: str
    overall_score: int = Field(..., ge=0, le=100, description="Overall retention potential score (0–100)")
    overall_rating: str = Field(..., description="Qualitative retention rating")
    hook_clarity: CategoryScoreSchema
    hook_strength: CategoryScoreSchema
    pacing_progression: CategoryScoreSchema
    information_density: CategoryScoreSchema
    filler_repetition: CategoryScoreSchema
    segment_timing: CategoryScoreSchema
    curiosity_open_loops: CategoryScoreSchema
    cta_strength: CategoryScoreSchema
    overall_retention_potential: CategoryScoreSchema
    weak_points: List[str] = Field(default_factory=list, description="Specific weak points identified in the script")
    recommendations: List[str] = Field(default_factory=list, description="Concrete optimization recommendations")
    segment_observations: List[SegmentObservationSchema] = Field(
        default_factory=list, description="Timestamped observations for each segment"
    )
    metrics: ScriptAnalysisMetrics
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    provider_used: str = Field(default="heuristic_mock")
