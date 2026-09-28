from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

class CreatorProfileBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    creator_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Creator name or pseudonym",
        examples=["Sai Panga"],
    )
    niche: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Content domain or primary niche",
        examples=["Cinematography"],
    )
    target_audience: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Target viewer demographic and persona",
        examples=["College students interested in mobile filmmaking."],
    )
    platforms: List[str] = Field(
        ...,
        min_length=1,
        description="Selected target distribution channels",
        examples=[["Instagram Reels", "YouTube Shorts"]],
    )
    primary_language: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Primary script language (English, Telugu, Tanglish)",
        examples=["Tanglish"],
    )
    content_tones: List[str] = Field(
        ...,
        min_length=1,
        description="Primary content delivery tones",
        examples=[["Educational", "Cinematic", "Conversational"]],
    )
    creator_bio: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Short creator bio or brand description",
        examples=["Filmmaker creating daily camera & lighting tutorials."],
    )
    content_goals: List[str] = Field(
        ...,
        min_length=1,
        description="Primary content creation goals",
        examples=[["Increase retention", "Grow followers"]],
    )

    @field_validator("creator_name", "niche", "primary_language")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or solely whitespace.")
        return stripped

    @field_validator("platforms", "content_tones", "content_goals")
    @classmethod
    def validate_lists(cls, v: List[str]) -> List[str]:
        cleaned = [item.strip() for item in v if item and item.strip()]
        if not cleaned:
            raise ValueError("Must specify at least one valid item.")
        return cleaned

class CreatorProfileCreateOrUpdate(CreatorProfileBase):
    pass

class CreatorProfileResponse(CreatorProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfileContainerResponse(BaseModel):
    profile: Optional[CreatorProfileResponse] = None
    is_configured: bool = False
