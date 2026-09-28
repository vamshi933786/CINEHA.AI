from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.creator_profile import CreatorProfile
from app.schemas.creator_profile import (
    CreatorProfileCreateOrUpdate,
    ProfileContainerResponse,
    CreatorProfileResponse,
)

router = APIRouter()

@router.get(
    "/profile",
    response_model=ProfileContainerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Creator Profile",
    description="Returns the active creator persona profile or an empty/not-created state if none has been configured.",
)
async def get_profile(db: AsyncSession = Depends(get_db)) -> ProfileContainerResponse:
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if profile is None:
        return ProfileContainerResponse(profile=None, is_configured=False)

    return ProfileContainerResponse(
        profile=CreatorProfileResponse.model_validate(profile),
        is_configured=True,
    )

@router.put(
    "/profile",
    response_model=ProfileContainerResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or Update Creator Profile",
    description="Saves and persists the creator persona preferences for use across generation pipelines.",
)
async def update_profile(
    payload: CreatorProfileCreateOrUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProfileContainerResponse:
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if profile is None:
        # Create new profile
        profile = CreatorProfile(
            creator_name=payload.creator_name,
            niche=payload.niche,
            target_audience=payload.target_audience or "",
            platforms=payload.platforms,
            primary_language=payload.primary_language,
            content_tones=payload.content_tones,
            creator_bio=payload.creator_bio or "",
            content_goals=payload.content_goals,
        )
        db.add(profile)
    else:
        # Update existing profile
        profile.creator_name = payload.creator_name
        profile.niche = payload.niche
        profile.target_audience = payload.target_audience or ""
        profile.platforms = payload.platforms
        profile.primary_language = payload.primary_language
        profile.content_tones = payload.content_tones
        profile.creator_bio = payload.creator_bio or ""
        profile.content_goals = payload.content_goals

    await db.commit()
    await db.refresh(profile)

    return ProfileContainerResponse(
        profile=CreatorProfileResponse.model_validate(profile),
        is_configured=True,
    )
