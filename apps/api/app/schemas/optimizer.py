from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.schemas.script import ScriptSegmentSchema, ScriptResponse
from app.schemas.analyzer import ScriptAnalysisResponse

VALID_OPTIMIZATION_GOALS = [
    "improve_hook",
    "improve_pacing",
    "remove_filler",
    "strengthen_curiosity",
    "improve_cta",
    "general_retention",
]

GOAL_ALIASES = {
    "improve hook": "improve_hook",
    "improve pacing": "improve_pacing",
    "remove filler": "remove_filler",
    "strengthen curiosity": "strengthen_curiosity",
    "strengthen curiosity / open loops": "strengthen_curiosity",
    "improve cta": "improve_cta",
    "general retention": "general_retention",
    "general retention optimization": "general_retention",
}


def normalize_goal(goal: str) -> str:
    cleaned = goal.strip().lower()
    if cleaned in GOAL_ALIASES:
        return GOAL_ALIASES[cleaned]
    if cleaned in VALID_OPTIMIZATION_GOALS:
        return cleaned
    # Check if underscores vs spaces
    cleaned_dash = cleaned.replace(" ", "_").replace("-", "_")
    if cleaned_dash in VALID_OPTIMIZATION_GOALS:
        return cleaned_dash
    return cleaned


class ScriptChangeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section: str = Field(..., description="Section of the script, e.g. HOOK, PROBLEM, SOLUTION, CTA, or GLOBAL")
    field: str = Field(..., description="Field changed: voiceover, hook, cta, visual_direction, on_screen_text, timing")
    before: str = Field(..., description="Original content before optimization")
    after: str = Field(..., description="Optimized content after change")
    reason: str = Field(..., description="Speech-science or retention rationale for the change")


class ScriptOptimizationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    goals: List[str] = Field(
        ...,
        min_length=1,
        description="One or more optimization goals e.g. ['improve_hook', 'remove_filler']",
    )
    instructions: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional creator guidance or artistic constraints",
    )
    target_retention_areas: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific retention dimensions from Phase 7A to prioritize",
    )
    script_text: Optional[str] = Field(
        default=None,
        description="Optional raw screenplay text to optimize (for custom/unsaved scripts)",
    )
    title: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Optional title for custom or unsaved script",
    )
    topic: Optional[str] = Field(default=None, max_length=100)
    platform: Optional[str] = Field(default=None, max_length=50)
    language: Optional[str] = Field(default=None, max_length=50)
    duration_seconds: Optional[int] = Field(default=None, ge=5, le=300)
    tone: Optional[str] = Field(default=None, max_length=50)
    hook: Optional[str] = Field(default=None)
    segments: Optional[List[ScriptSegmentSchema]] = Field(default=None)
    cta: Optional[str] = Field(default=None)

    @field_validator("goals")
    @classmethod
    def validate_goals(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one optimization goal must be selected.")
        normalized = []
        for g in v:
            norm = normalize_goal(g)
            if norm not in VALID_OPTIMIZATION_GOALS:
                valid_str = ", ".join(VALID_OPTIMIZATION_GOALS)
                raise ValueError(f"Invalid optimization goal: '{g}'. Valid options: {valid_str}")
            if norm not in normalized:
                normalized.append(norm)
        return normalized


class OptimizedScriptData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    topic: str
    platform: str
    language: str
    duration_seconds: int
    tone: str
    hook: str
    segments: List[ScriptSegmentSchema]
    cta: str


class ScriptOptimizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    script_id: str
    original_script: ScriptResponse
    optimized_script: OptimizedScriptData
    analysis_before: ScriptAnalysisResponse
    analysis_after: ScriptAnalysisResponse
    changes_made: List[ScriptChangeItem]
    optimization_goals: List[str]
    provider_used: str
    is_saved: bool = False


class SaveOptimizedScriptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(default=None, max_length=200)
    hook: Optional[str] = Field(default=None)
    segments: List[ScriptSegmentSchema] = Field(..., min_length=1)
    cta: Optional[str] = Field(default=None)
    change_summary: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Summary of changes saved into the new ScriptVersion",
    )
