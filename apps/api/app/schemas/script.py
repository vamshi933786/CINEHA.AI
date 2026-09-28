from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

VALID_PLATFORMS = [
    "Instagram Reels",
    "TikTok",
    "YouTube Shorts",
]

VALID_LANGUAGES = [
    "English",
    "Telugu",
    "Tanglish",
    "Tenglish",
]

VALID_DURATIONS = [15, 30, 45, 60, 90]


class ScriptSegmentSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique segment identifier, e.g. seg_1")
    start_time: str = Field(..., description="Timestamp start e.g. 0:00")
    end_time: str = Field(..., description="Timestamp end e.g. 0:03")
    section: str = Field(..., description="Section label e.g. HOOK, PROBLEM, SOLUTION, CTA")
    voiceover: str = Field(..., description="Spoken dialogue or voiceover script")
    visual_direction: str = Field(..., description="Camera instruction or shot framing")
    b_roll: Optional[str] = Field(default=None, description="B-roll suggestions or cutaway cues")
    on_screen_text: str = Field(..., description="Lower thirds, graphic overlays or text punchlines")
    audio_direction: Optional[str] = Field(default=None, description="Sound effects, foley, or music pacing cues")


class ScriptGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Topic / premise for the video script",
        examples=["5 Lighting Tricks with your Smartphone"],
    )
    context: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional additional context, gear, or scenario",
    )
    platform: str = Field(
        default="Instagram Reels",
        description="Target distribution platform",
    )
    language: str = Field(
        default="English",
        description="Language for generation (English, Telugu, Tanglish)",
    )
    duration_seconds: int = Field(
        default=30,
        description="Target duration in seconds (15, 30, 45, 60, 90)",
    )
    tone: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Desired tone (e.g. Cinematic, High-energy, Educational). Defaults to profile tone if omitted.",
    )
    hook: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Selected or custom hook text. If omitted, Script Agent generates one.",
    )
    cta: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Target CTA goal or custom call to action. If omitted, Script Agent optimizes one.",
    )
    profile_id: Optional[str] = Field(
        default=None,
        description="Creator profile UUID to personalize script generation",
    )

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Topic must be at least 2 characters long.")
        return stripped

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        if v not in VALID_PLATFORMS:
            raise ValueError(f"Platform '{v}' is invalid. Allowed: {VALID_PLATFORMS}")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in VALID_LANGUAGES:
            raise ValueError(f"Language '{v}' is invalid. Allowed: {VALID_LANGUAGES}")
        return v

    @field_validator("duration_seconds")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in VALID_DURATIONS:
            raise ValueError(f"Duration {v}s is invalid. Allowed durations: {VALID_DURATIONS}")
        return v


class ScriptUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    hook: Optional[str] = Field(default=None, min_length=1)
    segments: Optional[List[ScriptSegmentSchema]] = None
    cta: Optional[str] = Field(default=None, min_length=1, max_length=255)
    change_summary: Optional[str] = Field(
        default="Manual update",
        max_length=255,
        description="Summary of changes saved into the new version",
    )


class ScriptVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    script_id: str
    version_number: int
    title: str
    segments: List[ScriptSegmentSchema]
    hook: str
    cta: str
    change_summary: str
    provider_used: str
    created_at: datetime
    updated_at: datetime


class ScriptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: Optional[str] = None
    title: str
    topic: str
    platform: str
    language: str
    duration_seconds: int
    tone: str
    hook: str
    segments: List[ScriptSegmentSchema]
    cta: str
    provider_used: str
    current_version: int
    created_at: datetime
    updated_at: datetime
    versions: Optional[List[ScriptVersionResponse]] = None
