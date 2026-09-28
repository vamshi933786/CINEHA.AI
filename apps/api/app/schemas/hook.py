from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.schemas.creator_profile import CreatorProfileBase

class HookTaxonomyEnum(str, Enum):
    CURIOSITY = "Curiosity"
    CONTRARIAN = "Contrarian"
    PROBLEM_SOLUTION = "Problem-Solution"
    STORYTELLING = "Storytelling"
    QUESTION = "Question"
    BOLD_STATEMENT = "Bold Statement"
    LIST_NUMBER = "List / Number"
    FEAR_MISTAKE = "Fear / Mistake"
    TRANSFORMATION = "Transformation"

VALID_TAXONOMIES = [t.value for t in HookTaxonomyEnum]

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

class HookItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., description="Unique hook identifier")
    hook_text: str = Field(..., description="Spoken hook dialogue / script line")
    category: str = Field(..., description="One of the 9 hook taxonomies")
    language: str = Field(..., description="Language of the hook")
    platform: str = Field(..., description="Target distribution channel")
    delivery_style: str = Field(..., description="Suggested vocal delivery style")
    visual_framing: str = Field(..., description="Camera angle and visual choreography cue")
    retention_intent: str = Field(..., description="Qualitative explanation of psychological retention mechanism")

class HookGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Core subject or premise for hook generation",
        examples=["Cinematic lighting using a bedside lamp"],
    )
    context: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Optional creator context, equipment details, or angle",
    )
    platform: str = Field(
        default="Instagram Reels",
        description="Target short-form platform",
    )
    language: Optional[str] = Field(
        default="English",
        description="Language for generation (English, Telugu, Tanglish)",
    )
    count: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Number of hooks to generate (between 1 and 20)",
    )
    categories: Optional[List[str]] = Field(
        default=None,
        description="Selected categories (defaults to all 9 if empty or None)",
    )
    creator_profile: Optional[CreatorProfileBase] = Field(
        default=None,
        description="Optional creator persona override; defaults to DB profile if omitted",
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
    def validate_language(cls, v: Optional[str]) -> str:
        if not v:
            return "English"
        if v not in VALID_LANGUAGES:
            raise ValueError(f"Language '{v}' is invalid. Allowed: {VALID_LANGUAGES}")
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned = [item.strip() for item in v if item and item.strip()]
        for cat in cleaned:
            if cat not in VALID_TAXONOMIES:
                raise ValueError(f"Category '{cat}' is not one of the 9 taxonomies: {VALID_TAXONOMIES}")
        return cleaned or None

class HookGenerationResponse(BaseModel):
    success: bool = True
    hooks: List[HookItem]
    count: int
    provider_used: str
    persona_used: Optional[str] = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
