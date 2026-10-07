from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Profile Completeness details
class CategoryCompleteness(BaseModel):
    category: str
    completed: bool
    weight: int
    details: str

class ProfileCompleteness(BaseModel):
    score: int = Field(ge=0, le=100)
    categories: List[CategoryCompleteness]
    recommendations: List[str]

# Core Creator Profile Base Schema
class CreatorProfileBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Profile Identity
    creator_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Creator name or legal moniker",
        examples=["Sai Panga"],
    )
    display_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Public display handle or stage name",
        examples=["Cineha"],
    )
    creator_type: str = Field(
        default="Filmmaker",
        max_length=50,
        description="Creator category archetype",
        examples=["Filmmaker", "Educator", "Storyteller"],
    )
    creator_bio: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Short creator bio or brand description",
        examples=["Cinematographer sharing lighting and camera breakdowns."],
    )
    location: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional regional or city affiliation",
        examples=["Hyderabad, India"],
    )

    # Content Identity
    niche: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Primary content domain or subject niche",
        examples=["Cinematography"],
    )
    secondary_niches: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Complementary or crossover niches",
        examples=[["Mobile Filmmaking", "Lighting", "Color Grading"]],
    )
    content_pillars: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Core strategic content topics or pillars",
        examples=[["Behind the Scenes", "Lighting Tips", "Camera Settings"]],
    )
    topics_to_avoid: List[str] = Field(
        default_factory=list,
        max_length=15,
        description="Topics or domains strictly off-brand",
        examples=[["Gear Drama", "Vague Motivation"]],
    )

    # Audience Persona
    target_audience: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Target viewer demographic narrative",
        examples=["Aspiring filmmakers and creators wanting cinematic quality on mobile."],
    )
    target_audience_age: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Audience age range bracket",
        examples=["18–24", "25–34", "Mixed"],
    )
    audience_interests: List[str] = Field(
        default_factory=list,
        max_length=15,
        description="Specific passions and interests of viewers",
        examples=[["Reels growth", "Camera gear", "Visual aesthetics"]],
    )
    audience_pain_points: List[str] = Field(
        default_factory=list,
        max_length=15,
        description="Key frustrations or challenges facing the audience",
        examples=[["Flat lighting", "Shaky footage", "Low retention"]],
    )
    audience_sophistication: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Knowledge level of audience",
        examples=["Beginner", "Intermediate", "Advanced", "Mixed"],
    )

    # Voice & Style
    content_tones: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Primary delivery tones",
        examples=[["Educational", "Cinematic", "Conversational"]],
    )
    energy: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Pacing and delivery energy level",
        examples=["Balanced", "Calm", "High-energy"],
    )
    humor: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Frequency of humor/wit",
        examples=["None", "Light", "Frequent"],
    )
    storytelling_style: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Narrative construction archetype",
        examples=["Direct", "Story-driven", "Example-driven", "Educational", "Mixed"],
    )
    vocabulary: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Linguistic complexity preference",
        examples=["Simple", "Balanced", "Technical"],
    )
    custom_tone_notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Specific voice instructions or creator nuances",
        examples=["Keep pacing brisk. Avoid overused influencer catchphrases."],
    )

    # Content & Platform Preferences
    primary_language: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Primary content language (English, Telugu, Tanglish)",
        examples=["Tanglish"],
    )
    secondary_languages: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="Secondary language proficiencies",
        examples=[["English", "Telugu"]],
    )
    script_preference: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Script typography preference (English script, Telugu native script, Tanglish)",
        examples=["Tanglish / Romanized Telugu"],
    )
    platforms: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Primary distribution platforms",
        examples=[["Instagram Reels", "YouTube Shorts"]],
    )
    preferred_aspect_ratio: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Default aspect ratio format",
        examples=["9:16", "1:1", "16:9"],
    )
    typical_duration: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Target duration sweet-spot",
        examples=["30 sec", "45 sec", "60 sec"],
    )
    cta_style: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Primary call-to-action preference",
        examples=["Save", "Follow", "Comment", "Share", "Soft CTA"],
    )
    secondary_cta_styles: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="Secondary call-to-action types",
        examples=[["Follow", "Comment"]],
    )
    content_goals: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Key strategic creator objectives",
        examples=[["Increase retention", "Build personal brand"]],
    )

    # Brand Guidance
    brand_positioning: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Unique value proposition / creator positioning",
        examples=["The practical filmmaking mentor who makes pro cinematography accessible."],
    )
    core_message: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Central philosophy or mission statement",
        examples=["Great storytelling comes from lighting and vision, not costly gear."],
    )
    words_to_use: List[str] = Field(
        default_factory=list,
        max_length=20,
        description="Signature phrases and branded vocabulary",
        examples=[["Cinematic", "Frame", "Lighting ratio", "Visual rhythm"]],
    )
    words_to_avoid: List[str] = Field(
        default_factory=list,
        max_length=20,
        description="Banned words, clichés, or filler phrases",
        examples=[["Smash that like button", "Secret hack", "Viral glitch"]],
    )
    style_rules: List[str] = Field(
        default_factory=list,
        max_length=15,
        description="Hard creator editorial constraints",
        examples=[["Always explain the 'why' before the 'how'", "Show B-roll within first 3s"]],
    )
    liked_examples: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Reference formats or creator styles admired",
        examples=[["Visual side-by-side lighting comparisons", "Quick gear-free camera angle tricks"]],
    )
    disliked_examples: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="Content styles to strictly avoid",
        examples=[["30-second intros without payoff", "Generic talking head without visual cuts"]],
    )

    @field_validator("creator_name", "niche", "primary_language")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or solely whitespace.")
        return stripped

    @field_validator(
        "platforms",
        "content_tones",
        "content_goals",
        "secondary_niches",
        "content_pillars",
        "topics_to_avoid",
        "audience_interests",
        "audience_pain_points",
        "secondary_languages",
        "secondary_cta_styles",
        "words_to_use",
        "words_to_avoid",
        "style_rules",
        "liked_examples",
        "disliked_examples",
        mode="before",
    )
    @classmethod
    def clean_and_deduplicate_lists(cls, v: Any) -> List[str]:
        if not isinstance(v, list):
            return []
        cleaned: List[str] = []
        seen = set()
        for item in v:
            if isinstance(item, str):
                s = item.strip()
                if s and s.lower() not in seen:
                    # Enforce reasonable per-item limit
                    trimmed = s[:150]
                    cleaned.append(trimmed)
                    seen.add(s.lower())
        return cleaned

    @field_validator("platforms", "content_tones")
    @classmethod
    def validate_required_lists(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Must specify at least one valid item.")
        return v

class CreatorProfileCreateOrUpdate(CreatorProfileBase):
    pass

class CreatorProfileResponse(CreatorProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime
    completeness: Optional[ProfileCompleteness] = None

    model_config = ConfigDict(from_attributes=True)

class ProfileContainerResponse(BaseModel):
    profile: Optional[CreatorProfileResponse] = None
    is_configured: bool = False

# Persona Context for AI Agents
class CreatorPersonaContext(BaseModel):
    creator_name: str
    display_name: Optional[str] = None
    creator_type: str = "Filmmaker"
    bio: str = ""
    location: Optional[str] = None
    primary_niche: str
    secondary_niches: List[str] = Field(default_factory=list)
    content_pillars: List[str] = Field(default_factory=list)
    topics_to_avoid: List[str] = Field(default_factory=list)
    target_audience: str = ""
    target_audience_age: Optional[str] = None
    audience_interests: List[str] = Field(default_factory=list)
    audience_pain_points: List[str] = Field(default_factory=list)
    audience_sophistication: Optional[str] = None
    tone: str = ""
    energy: Optional[str] = None
    humor: Optional[str] = None
    storytelling_style: Optional[str] = None
    vocabulary: Optional[str] = None
    custom_tone_notes: Optional[str] = None
    primary_language: str
    secondary_languages: List[str] = Field(default_factory=list)
    script_preference: Optional[str] = None
    platforms: List[str] = Field(default_factory=list)
    preferred_duration: Optional[str] = None
    preferred_aspect_ratio: Optional[str] = None
    cta_style: Optional[str] = None
    secondary_cta_styles: List[str] = Field(default_factory=list)
    content_goals: List[str] = Field(default_factory=list)
    brand_positioning: Optional[str] = None
    core_message: Optional[str] = None
    words_to_use: List[str] = Field(default_factory=list)
    words_to_avoid: List[str] = Field(default_factory=list)
    style_rules: List[str] = Field(default_factory=list)

class PersonaPreviewResponse(BaseModel):
    summary: str
    example_hook: str
    example_intro: str
    example_cta: str
    is_ai_generated: bool = False

def calculate_profile_completeness(profile_obj: Any) -> ProfileCompleteness:
    """
    Deterministic scoring and actionable suggestions across 7 core categories.
    """
    if profile_obj is None:
        return ProfileCompleteness(score=0, categories=[], recommendations=["Create your creator profile"])

    # Extract dictionary representation safely
    if hasattr(profile_obj, "model_dump"):
        data = profile_obj.model_dump()
    elif hasattr(profile_obj, "__dict__"):
        data = profile_obj.__dict__
    elif isinstance(profile_obj, dict):
        data = profile_obj
    else:
        data = {}

    categories: List[CategoryCompleteness] = []
    recommendations: List[str] = []

    # 1. Identity (Weight 15)
    has_name = bool((data.get("creator_name") or "").strip())
    has_type = bool((data.get("creator_type") or "").strip())
    has_bio = bool((data.get("creator_bio") or "").strip())
    cat_identity = has_name and (has_type or has_bio)
    categories.append(CategoryCompleteness(
        category="Identity",
        completed=cat_identity,
        weight=15,
        details="Creator name, archetype, and bio",
    ))
    if not has_bio:
        recommendations.append("Add a short creator bio to ground AI screenplays in your story.")

    # 2. Content Niche & Pillars (Weight 20)
    has_niche = bool((data.get("niche") or "").strip())
    has_pillars = bool(data.get("content_pillars") and len(data.get("content_pillars", [])) > 0)
    cat_niche = has_niche and has_pillars
    categories.append(CategoryCompleteness(
        category="Content Niche",
        completed=cat_niche,
        weight=20,
        details="Primary niche and content pillars",
    ))
    if not has_pillars:
        recommendations.append("Define 2-3 content pillars (e.g., 'Behind the scenes', 'Camera tips').")

    # 3. Target Audience (Weight 20)
    has_aud = bool((data.get("target_audience") or "").strip())
    has_pain = bool(
        (data.get("audience_pain_points") and len(data.get("audience_pain_points", [])) > 0)
        or (data.get("audience_interests") and len(data.get("audience_interests", [])) > 0)
        or bool((data.get("target_audience_age") or "").strip())
    )
    cat_audience = has_aud and has_pain
    categories.append(CategoryCompleteness(
        category="Audience Persona",
        completed=cat_audience,
        weight=20,
        details="Target viewer demographic, age bracket, and pain points",
    ))
    if not has_aud:
        recommendations.append("Specify your target audience description.")
    elif not has_pain:
        recommendations.append("Add key audience pain points so hooks target viewer frustrations.")

    # 4. Voice & Style (Weight 15)
    tones = data.get("content_tones", [])
    has_tones = bool(tones and len(tones) > 0)
    has_voice_depth = bool(
        data.get("energy") or data.get("storytelling_style") or data.get("vocabulary")
    )
    cat_voice = has_tones and has_voice_depth
    categories.append(CategoryCompleteness(
        category="Voice & Style",
        completed=cat_voice,
        weight=15,
        details="Tones, delivery energy, storytelling, and vocabulary",
    ))
    if not has_voice_depth:
        recommendations.append("Configure delivery energy or vocabulary style to refine script phrasing.")

    # 5. Language Profile (Weight 10)
    has_lang = bool((data.get("primary_language") or "").strip())
    categories.append(CategoryCompleteness(
        category="Language Profile",
        completed=has_lang,
        weight=10,
        details="Primary content language (English, Telugu, Tanglish)",
    ))

    # 6. Platforms & Duration (Weight 10)
    platforms = data.get("platforms", [])
    has_plat = bool(platforms and len(platforms) > 0)
    has_plat_pref = bool(data.get("preferred_aspect_ratio") or data.get("typical_duration"))
    cat_platform = has_plat and has_plat_pref
    categories.append(CategoryCompleteness(
        category="Platform Preferences",
        completed=cat_platform,
        weight=10,
        details="Target distribution channels, aspect ratio, and typical duration",
    ))
    if not has_plat_pref:
        recommendations.append("Set typical duration or aspect ratio preferences for one-click generation.")

    # 7. Brand Guidance & CTA (Weight 10)
    has_brand = bool(
        data.get("brand_positioning")
        or data.get("core_message")
        or data.get("cta_style")
        or (data.get("words_to_use") and len(data.get("words_to_use", [])) > 0)
    )
    categories.append(CategoryCompleteness(
        category="Brand & CTA",
        completed=has_brand,
        weight=10,
        details="Brand positioning, core message, signature words, and CTA style",
    ))
    if not has_brand:
        recommendations.append("Set your preferred CTA style (e.g. Save, Follow) or core message.")

    total_score = sum(cat.weight for cat in categories if cat.completed)
    return ProfileCompleteness(
        score=min(100, max(0, total_score)),
        categories=categories,
        recommendations=recommendations,
    )
