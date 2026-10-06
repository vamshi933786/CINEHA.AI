from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re

class ContentStatus(str, Enum):
    IDEA = "Idea"
    PLANNED = "Planned"
    SCRIPT_READY = "Script Ready"
    IN_PRODUCTION = "In Production"
    READY_TO_PUBLISH = "Ready to Publish"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"

class PlatformType(str, Enum):
    INSTAGRAM_REELS = "Instagram Reels"
    YOUTUBE_SHORTS = "YouTube Shorts"
    TIKTOK = "TikTok"
    FACEBOOK_REELS = "Facebook Reels"
    OTHER = "Other"

class ContentType(str, Enum):
    EDUCATIONAL = "Educational"
    STORYTELLING = "Storytelling"
    TUTORIAL = "Tutorial"
    BEHIND_THE_SCENES = "Behind the Scenes"
    REVIEW = "Review"
    OPINION = "Opinion"
    LIST = "List"
    TRANSFORMATION = "Transformation"
    ANNOUNCEMENT = "Announcement"
    ENTERTAINMENT = "Entertainment"
    OTHER = "Other"

class ContentPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

VALID_STATUSES = [s.value for s in ContentStatus]
VALID_PLATFORMS = [p.value for p in PlatformType]
VALID_CONTENT_TYPES = [t.value for t in ContentType]
VALID_PRIORITIES = [p.value for p in ContentPriority]

class LinkedScriptSummary(BaseModel):
    id: str
    title: str
    current_version: int
    duration_seconds: int
    language: str
    updated_at: datetime

    class Config:
        from_attributes = True

class LinkedVideoAnalysisSummary(BaseModel):
    id: str
    filename: str
    overall_score: int
    overall_rating: str
    top_finding: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ContentItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Headline or topic title")
    description: Optional[str] = Field(None, max_length=2000, description="Planning summary or logline")
    scheduled_date: str = Field(..., description="Target release date in YYYY-MM-DD format")
    scheduled_time: Optional[str] = Field(None, max_length=20, description="Optional target posting time e.g. 18:00")
    status: str = Field(default=ContentStatus.PLANNED.value)
    platform: str = Field(default=PlatformType.INSTAGRAM_REELS.value)
    content_type: str = Field(default=ContentType.EDUCATIONAL.value)
    language: str = Field(default="Tanglish")

    script_id: Optional[str] = Field(None, description="Linked Script UUID")
    script_version_id: Optional[str] = Field(None, description="Linked ScriptVersion UUID")
    hook_id: Optional[str] = Field(None, description="Linked Hook ID")
    video_analysis_id: Optional[str] = Field(None, description="Linked Video Analysis UUID")

    content_pillar: Optional[str] = Field(None, max_length=100)
    content_goal: Optional[str] = Field(None, max_length=100)
    priority: str = Field(default=ContentPriority.MEDIUM.value)
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=3000)
    cta: Optional[str] = Field(None, max_length=255)

    @field_validator("scheduled_date")
    @classmethod
    def validate_scheduled_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("scheduled_date must be in YYYY-MM-DD format")
        # Validate actual date numbers
        try:
            parts = [int(p) for p in v.split("-")]
            date(parts[0], parts[1], parts[2])
        except Exception:
            raise ValueError("scheduled_date is not a valid calendar date")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(VALID_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of: {', '.join(VALID_PRIORITIES)}")
        return v

class ContentItemCreate(ContentItemBase):
    pass

class ContentItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    status: Optional[str] = None
    platform: Optional[str] = None
    content_type: Optional[str] = None
    language: Optional[str] = None

    script_id: Optional[str] = None
    script_version_id: Optional[str] = None
    hook_id: Optional[str] = None
    video_analysis_id: Optional[str] = None

    content_pillar: Optional[str] = Field(None, max_length=100)
    content_goal: Optional[str] = Field(None, max_length=100)
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=3000)
    cta: Optional[str] = Field(None, max_length=255)

    @field_validator("scheduled_date")
    @classmethod
    def validate_scheduled_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                raise ValueError("scheduled_date must be in YYYY-MM-DD format")
            try:
                parts = [int(p) for p in v.split("-")]
                date(parts[0], parts[1], parts[2])
            except Exception:
                raise ValueError("scheduled_date is not a valid calendar date")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(VALID_STATUSES)}")
        return v

class ContentItemResponse(ContentItemBase):
    id: str
    created_at: datetime
    updated_at: datetime
    script_summary: Optional[LinkedScriptSummary] = None
    video_analysis_summary: Optional[LinkedVideoAnalysisSummary] = None

    class Config:
        from_attributes = True

class ContentPlanSuggestion(BaseModel):
    title: str
    description: str
    suggested_date: str
    platform: str = "Instagram Reels"
    content_type: str = "Educational"
    content_pillar: str = "General"
    language: str = "Tanglish"
    suggested_duration: str = "45 sec"
    cta: str = "Save this reel"
    rationale: str = "Designed for high viewer retention."

class GenerateContentPlanRequest(BaseModel):
    planning_period_days: int = Field(default=7, ge=1, le=30)
    posting_frequency: str = Field(default="3/week")
    content_goals: Optional[List[str]] = None
    start_date: Optional[str] = None

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
                raise ValueError("start_date must be in YYYY-MM-DD format")
        return v

class GenerateContentPlanResponse(BaseModel):
    suggestions: List[ContentPlanSuggestion]
    period_days: int
    frequency: str
    is_ai_generated: bool
    summary_note: str

class CalendarDashboardStats(BaseModel):
    total_items: int
    planned_count: int
    ready_to_publish_count: int
    published_count: int
    platform_breakdown: Dict[str, int]
    content_type_breakdown: Dict[str, int]
    pillar_coverage: Dict[str, int]
