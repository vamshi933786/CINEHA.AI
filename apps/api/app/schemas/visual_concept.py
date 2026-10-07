from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator

VALID_VISUAL_TYPES = [
    "Concept Illustration",
    "Diagram",
    "Process",
    "Comparison",
    "Before / After",
    "Educational",
    "Story Scene",
    "Product Context",
    "Metaphor",
    "Data Explanation",
]

VALID_IMPORTANCE_LEVELS = ["Essential", "Recommended", "Optional"]

VALID_ASPECT_RATIOS = ["9:16", "1:1", "16:9"]

VALID_VISUAL_STYLES = [
    "Clean Educational",
    "Cinematic",
    "Modern 3D",
    "Minimal Illustration",
    "Editorial",
    "Realistic",
    "Infographic-style",
]

VALID_VISUAL_STATUSES = ["suggested", "generating", "ready", "failed"]


class VisualConceptItem(BaseModel):
    """A single visual concept analyzed from a script segment."""
    visual_id: Optional[str] = None
    script_segment_id: str = Field(..., description="ID of the related script beat/segment")
    concept_title: str = Field(..., max_length=200, description="Title of the visual concept in script language")
    explanation: str = Field(..., description="Why this visual helps audience understand the concept")
    visual_type: str = Field(default="Concept Illustration", description="Type of visual")
    importance: str = Field(default="Recommended", description="Essential, Recommended, or Optional")
    related_script_text: str = Field(..., description="Excerpt of the script dialogue this visual explains")
    suggested_prompt: str = Field(..., description="Detailed AI image generation prompt")
    placement: Optional[str] = Field(default=None, description="Where in the video this visual appears")
    aspect_ratio: str = Field(default="9:16", description="Aspect ratio: 9:16, 1:1, or 16:9")
    style: str = Field(default="Clean Educational", description="Visual aesthetic style")
    language: str = Field(default="English", description="Language of concept title and explanation")
    status: str = Field(default="suggested", description="Status of the concept: suggested, generating, ready, failed")

    @field_validator("visual_type")
    def validate_type(cls, v: str) -> str:
        for t in VALID_VISUAL_TYPES:
            if v.strip().lower() == t.lower():
                return t
        return "Concept Illustration"

    @field_validator("importance")
    def validate_importance(cls, v: str) -> str:
        for imp in VALID_IMPORTANCE_LEVELS:
            if v.strip().lower() == imp.lower():
                return imp
        return "Recommended"

    @field_validator("aspect_ratio")
    def validate_aspect_ratio(cls, v: str) -> str:
        if v in VALID_ASPECT_RATIOS:
            return v
        return "9:16"


class VisualConceptAnalysisRequest(BaseModel):
    """Request to analyze a script and discover visual opportunities."""
    script_id: Optional[str] = None
    script_version_id: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    platform: Optional[str] = "Instagram Reels"
    language: Optional[str] = "English"
    segments: Optional[List[Dict[str, Any]]] = None
    preferred_aspect_ratio: Optional[str] = "9:16"
    preferred_style: Optional[str] = "Clean Educational"
    profile_id: Optional[str] = None


class GenerateImageRequest(BaseModel):
    """Request to generate or regenerate an image for a visual concept."""
    prompt: Optional[str] = Field(default=None, max_length=2000, description="Optional custom prompt override")
    style: Optional[str] = Field(default=None, description="Optional style override")
    aspect_ratio: Optional[str] = Field(default=None, description="Optional aspect ratio override")


class VisualUpdateRequest(BaseModel):
    """Request to update an existing visual concept record."""
    prompt: Optional[str] = Field(default=None, max_length=2000)
    style: Optional[str] = None
    aspect_ratio: Optional[str] = None
    is_attached: Optional[bool] = None


class VisualConceptResponse(BaseModel):
    """Full visual concept representation returned to frontend."""
    id: str
    script_id: str
    script_version_id: Optional[str] = None
    segment_id: str
    concept_title: str
    explanation: str
    visual_type: str
    importance: str
    related_script_text: str
    suggested_prompt: str
    prompt: str
    aspect_ratio: str
    style: str
    language: str
    status: str
    image_asset_reference: Optional[str] = None
    image_url: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    placement: Optional[str] = None
    is_attached: bool = False
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VisualProviderStatusResponse(BaseModel):
    """Information on whether image generation provider is configured."""
    configured: bool
    provider: str
    model: str
    message: str
