from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.creator_profile import CreatorProfile
from app.schemas.trend_research import (
    TrendResearchRequest,
    TrendResearchSessionResponse,
    TrendResearchHistoryResponse,
)
from app.agents.trend_research_agent import get_trend_research_agent, TrendResearchAgent

router = APIRouter()


@router.post(
    "/trend-research",
    response_model=TrendResearchSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run Trend Research & Content Opportunity Analysis",
    description="Generates personalized, high-retention short-form content opportunities grounded in the creator persona, content pillars, and selected language.",
)
async def create_trend_research(
    payload: TrendResearchRequest,
    db: AsyncSession = Depends(get_db),
    agent: TrendResearchAgent = Depends(get_trend_research_agent),
) -> TrendResearchSessionResponse:
    # Fetch active creator profile if not provided in payload
    db_profile = None
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    db_profile = result.scalar_one_or_none()

    response = await agent.execute(request=payload, db=db, db_profile=db_profile)
    return response


@router.get(
    "/trend-research",
    response_model=TrendResearchHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="List Trend Research History",
    description="Returns a chronological list of previously generated research sessions with opportunity counts and scores.",
)
async def list_trend_research_history(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    agent: TrendResearchAgent = Depends(get_trend_research_agent),
) -> TrendResearchHistoryResponse:
    return await agent.list_history(db=db, limit=limit)


@router.get(
    "/trend-research/{session_id}",
    response_model=TrendResearchSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Trend Research Session by ID",
    description="Retrieves a specific trend research session and its full list of scored content opportunities.",
)
async def get_trend_research_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    agent: TrendResearchAgent = Depends(get_trend_research_agent),
) -> TrendResearchSessionResponse:
    session = await agent.get_session(session_id=session_id, db=db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trend research session with ID '{session_id}' not found.",
        )
    return session


@router.post(
    "/trend-research/{session_id}/refresh",
    response_model=TrendResearchSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Trend Research Session",
    description="Re-runs opportunity research using the stored parameters of an existing session.",
)
async def refresh_trend_research_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    agent: TrendResearchAgent = Depends(get_trend_research_agent),
) -> TrendResearchSessionResponse:
    # Fetch active creator profile
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    db_profile = result.scalar_one_or_none()

    session = await agent.refresh_session(session_id=session_id, db=db, db_profile=db_profile)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trend research session with ID '{session_id}' not found.",
        )
    return session


@router.delete(
    "/trend-research/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Trend Research Session",
    description="Deletes a trend research session from history.",
)
async def delete_trend_research_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    agent: TrendResearchAgent = Depends(get_trend_research_agent),
):
    deleted = await agent.delete_session(session_id=session_id, db=db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trend research session with ID '{session_id}' not found.",
        )
    return None
