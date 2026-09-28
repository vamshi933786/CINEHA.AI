from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.creator_profile import CreatorProfile
from app.schemas.creator_profile import CreatorProfileBase
from app.schemas.hook import HookGenerationRequest, HookGenerationResponse
from app.agents.hook_agent import get_hook_agent, HookAgent

router = APIRouter()

@router.post(
    "/hooks/generate",
    response_model=HookGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 9-Taxonomy Hooks",
    description="Generates short-form video hooks across 9 psychological taxonomies using active creator persona context.",
)
async def generate_hooks(
    payload: HookGenerationRequest,
    db: AsyncSession = Depends(get_db),
    agent: HookAgent = Depends(get_hook_agent),
) -> HookGenerationResponse:
    # If no profile passed in payload, fetch from DB
    db_profile = None
    if not payload.creator_profile:
        query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        result = await db.execute(query)
        profile_row = result.scalar_one_or_none()
        if profile_row:
            db_profile = CreatorProfileBase(
                creator_name=profile_row.creator_name,
                niche=profile_row.niche,
                target_audience=profile_row.target_audience or "",
                platforms=profile_row.platforms,
                primary_language=profile_row.primary_language,
                content_tones=profile_row.content_tones,
                creator_bio=profile_row.creator_bio or "",
                content_goals=profile_row.content_goals,
            )

    response = await agent.execute(request=payload, db_profile=db_profile)
    return response
