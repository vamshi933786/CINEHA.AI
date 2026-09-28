import uuid
import logging
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.script import Script, ScriptVersion
from app.models.creator_profile import CreatorProfile
from app.schemas.script import ScriptResponse
from app.schemas.analyzer import ScriptAnalysisResponse
from app.schemas.optimizer import (
    ScriptOptimizationRequest,
    ScriptOptimizationResponse,
    OptimizedScriptData,
    ScriptChangeItem,
    SaveOptimizedScriptRequest,
)
from app.services.llm_provider import get_llm_provider, BaseLLMProvider, OfflineHeuristicMockProvider

logger = logging.getLogger(__name__)


class ScriptOptimizerAgent:
    """
    Script Optimizer Agent.
    Transforms an existing screenplay according to specified retention goals (hook, pacing,
    filler removal, curiosity, CTA), performs before/after analytical retention comparison,
    and supports saving optimized versions immutably.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()

    async def optimize(
        self,
        script_id: str,
        request: ScriptOptimizationRequest,
        db: AsyncSession,
    ) -> ScriptOptimizationResponse:
        # 1. Fetch original script from DB
        stmt = (
            select(Script)
            .options(selectinload(Script.versions))
            .where(Script.id == script_id)
        )
        res = await db.execute(stmt)
        db_script = res.scalar_one_or_none()

        if db_script is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Script with ID '{script_id}' not found.",
            )

        # 2. Retrieve creator profile if available
        profile_stmt = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        profile_res = await db.execute(profile_stmt)
        creator_profile = profile_res.scalar_one_or_none()

        niche = creator_profile.niche if creator_profile else "Creator Content"
        target_audience = creator_profile.target_audience if creator_profile else "General short-form audience"
        creator_name = creator_profile.creator_name if creator_profile else None

        original_segments = db_script.segments if isinstance(db_script.segments, list) else []

        # 3. Analyze BEFORE optimization
        analysis_before_dict = await self.provider.analyze_script_retention(
            title=db_script.title,
            topic=db_script.topic,
            platform=db_script.platform,
            language=db_script.language,
            duration_seconds=db_script.duration_seconds,
            hook=db_script.hook,
            segments=original_segments,
            cta=db_script.cta,
            niche=niche,
            target_audience=target_audience,
        )
        analysis_before_dict["script_id"] = db_script.id
        analysis_before = ScriptAnalysisResponse.model_validate(analysis_before_dict)

        # 4. Run Optimization via Provider (with graceful heuristic fallback)
        try:
            opt_data = await self.provider.optimize_script(
                title=db_script.title,
                topic=db_script.topic,
                platform=db_script.platform,
                language=db_script.language,
                duration_seconds=db_script.duration_seconds,
                tone=db_script.tone,
                hook=db_script.hook,
                segments=original_segments,
                cta=db_script.cta,
                goals=request.goals,
                instructions=request.instructions,
                target_retention_areas=request.target_retention_areas,
                creator_name=creator_name,
                niche=niche,
                audience=target_audience,
            )
        except Exception as e:
            logger.error(f"Error in ScriptOptimizerAgent provider: {e}. Falling back to heuristic mock.")
            fallback = OfflineHeuristicMockProvider()
            opt_data = await fallback.optimize_script(
                title=db_script.title,
                topic=db_script.topic,
                platform=db_script.platform,
                language=db_script.language,
                duration_seconds=db_script.duration_seconds,
                tone=db_script.tone,
                hook=db_script.hook,
                segments=original_segments,
                cta=db_script.cta,
                goals=request.goals,
                instructions=request.instructions,
                target_retention_areas=request.target_retention_areas,
                creator_name=creator_name,
                niche=niche,
                audience=target_audience,
            )

        optimized_segments = opt_data.get("segments", original_segments)
        optimized_hook = opt_data.get("hook", db_script.hook)
        optimized_cta = opt_data.get("cta", db_script.cta)
        optimized_title = opt_data.get("title", f"{db_script.title} (Optimized)")
        changes_list = opt_data.get("changes_made", [])
        provider_used = opt_data.get("provider_used", "heuristic_mock")

        # 5. Analyze AFTER optimization
        analysis_after_dict = await self.provider.analyze_script_retention(
            title=optimized_title,
            topic=db_script.topic,
            platform=db_script.platform,
            language=db_script.language,
            duration_seconds=db_script.duration_seconds,
            hook=optimized_hook,
            segments=optimized_segments,
            cta=optimized_cta,
            niche=niche,
            target_audience=target_audience,
        )
        analysis_after_dict["script_id"] = db_script.id
        analysis_after = ScriptAnalysisResponse.model_validate(analysis_after_dict)

        # Structure response
        return ScriptOptimizationResponse(
            script_id=db_script.id,
            original_script=ScriptResponse.model_validate(db_script),
            optimized_script=OptimizedScriptData(
                title=optimized_title,
                topic=db_script.topic,
                platform=db_script.platform,
                language=db_script.language,
                duration_seconds=db_script.duration_seconds,
                tone=db_script.tone,
                hook=optimized_hook,
                segments=optimized_segments,
                cta=optimized_cta,
            ),
            analysis_before=analysis_before,
            analysis_after=analysis_after,
            changes_made=[ScriptChangeItem.model_validate(c) for c in changes_list],
            optimization_goals=request.goals,
            provider_used=provider_used,
            is_saved=False,
        )

    async def save_optimized(
        self,
        script_id: str,
        payload: SaveOptimizedScriptRequest,
        db: AsyncSession,
    ) -> ScriptResponse:
        stmt = (
            select(Script)
            .options(selectinload(Script.versions))
            .where(Script.id == script_id)
        )
        res = await db.execute(stmt)
        script = res.scalar_one_or_none()

        if script is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Script with ID '{script_id}' not found.",
            )

        # Increment version number
        next_version_num = script.current_version + 1
        script.current_version = next_version_num

        if payload.title:
            script.title = payload.title
        if payload.hook:
            script.hook = payload.hook
        if payload.cta:
            script.cta = payload.cta
        if payload.segments:
            script.segments = [s.model_dump() for s in payload.segments]

        # Create new immutable ScriptVersion
        version_id = str(uuid.uuid4())
        new_version = ScriptVersion(
            id=version_id,
            script_id=script.id,
            version_number=next_version_num,
            title=script.title,
            segments=script.segments,
            hook=script.hook,
            cta=script.cta,
            change_summary=payload.change_summary,
            provider_used=script.provider_used,
        )
        db.add(new_version)
        await db.commit()

        # Reload script with updated versions
        stmt_reload = (
            select(Script)
            .options(selectinload(Script.versions))
            .where(Script.id == script_id)
        )
        reload_res = await db.execute(stmt_reload)
        updated_script = reload_res.scalar_one()

        return ScriptResponse.model_validate(updated_script)


def get_script_optimizer_agent() -> ScriptOptimizerAgent:
    return ScriptOptimizerAgent()
