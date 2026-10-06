import uuid
import logging
from datetime import datetime, timezone
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
from app.services.script_parser import parse_script_text_to_segments
from app.services.script_language_detector import resolve_script_language

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
        # If script_id is 'custom', optimize directly without requiring pre-persistence in DB
        if script_id == "custom":
            return await self.optimize_custom(request=request, db=db)

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
        creator_profile_lang = creator_profile.primary_language if creator_profile else None

        original_segments = db_script.segments if isinstance(db_script.segments, list) else []

        # Resolve explicit language > creator profile preference > safe fallback detection
        script_full_text = f"{db_script.hook} " + " ".join(s.get("voiceover", "") for s in original_segments)
        resolved_language = resolve_script_language(
            explicit_lang=request.language if request.language else db_script.language,
            script_text=script_full_text,
            creator_profile_lang=creator_profile_lang,
        )

        # 3. Analyze BEFORE optimization
        analysis_before_dict = await self.provider.analyze_script_retention(
            title=db_script.title,
            topic=db_script.topic,
            platform=db_script.platform,
            language=resolved_language,
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
                language=resolved_language,
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
                language=resolved_language,
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
            language=resolved_language,
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
                language=resolved_language,
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

    async def optimize_custom(
        self,
        request: ScriptOptimizationRequest,
        db: Optional[AsyncSession] = None,
    ) -> ScriptOptimizationResponse:
        """
        Optimizes an unsaved or custom script directly without requiring pre-persistence in DB.
        Preserves original script text in memory and runs non-mutating before/after retention diagnostics.
        """
        duration_seconds = request.duration_seconds or 30
        title = request.title or "Custom Screenplay"
        topic = request.topic or "Short-form Content"
        platform = request.platform or "Instagram Reels"
        language = request.language or "English"
        tone = request.tone or "Cinematic"

        # Determine original hook, cta, segments
        if request.segments and len(request.segments) > 0:
            original_segments = [s.model_dump() for s in request.segments]
            original_hook = request.hook or (original_segments[0].get("voiceover", "") if original_segments else "")
            original_cta = request.cta or (original_segments[-1].get("voiceover", "") if original_segments else "")
        elif request.script_text and request.script_text.strip():
            parsed_hook, parsed_cta, parsed_segments = parse_script_text_to_segments(
                request.script_text, duration_seconds=duration_seconds
            )
            original_hook = request.hook or parsed_hook or "Stop scrolling! Here is the retention secret."
            original_cta = request.cta or parsed_cta or "Save this for your next shoot!"
            original_segments = parsed_segments
        else:
            original_hook = request.hook or "Stop scrolling! Here is the retention secret."
            original_cta = request.cta or "Save this for your next shoot!"
            original_segments = [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:03",
                    "section": "HOOK",
                    "voiceover": original_hook,
                    "visual_direction": "Dramatic crash zoom onto creator.",
                    "b_roll": "",
                    "on_screen_text": "HOOK",
                    "audio_direction": "Sub-drop hit",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:03",
                    "end_time": "0:25",
                    "section": "BODY",
                    "voiceover": "This core technique changes everything about your content delivery.",
                    "visual_direction": "Creator explaining concept clearly.",
                    "b_roll": "",
                    "on_screen_text": "VALUE",
                    "audio_direction": "Rhythmic beat",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:25",
                    "end_time": f"0:{duration_seconds:02d}",
                    "section": "CTA",
                    "voiceover": original_cta,
                    "visual_direction": "Creator pointing to bookmark icon.",
                    "b_roll": "",
                    "on_screen_text": "SAVE NOW",
                    "audio_direction": "Clean resolution",
                },
            ]

        # Retrieve creator profile if db available
        creator_name = None
        niche = "Creator Content"
        target_audience = "General short-form audience"
        creator_profile = None
        creator_profile_lang = None
        if db is not None:
            try:
                profile_stmt = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
                profile_res = await db.execute(profile_stmt)
                creator_profile = profile_res.scalar_one_or_none()
                if creator_profile:
                    niche = creator_profile.niche or niche
                    target_audience = creator_profile.target_audience or target_audience
                    creator_name = creator_profile.creator_name
                    creator_profile_lang = creator_profile.primary_language
            except Exception:
                pass

        # Resolve explicit language > creator profile preference > safe fallback detection
        script_full_text = request.script_text or f"{original_hook} " + " ".join(s.get("voiceover", "") for s in original_segments)
        resolved_language = resolve_script_language(
            explicit_lang=request.language,
            script_text=script_full_text,
            creator_profile_lang=creator_profile_lang,
        )

        # 1. Analyze BEFORE optimization
        analysis_before_dict = await self.provider.analyze_script_retention(
            title=title,
            topic=topic,
            platform=platform,
            language=resolved_language,
            duration_seconds=duration_seconds,
            hook=original_hook,
            segments=original_segments,
            cta=original_cta,
            niche=niche,
            target_audience=target_audience,
        )
        analysis_before_dict["script_id"] = "custom"
        analysis_before = ScriptAnalysisResponse.model_validate(analysis_before_dict)

        # 2. Run Optimization via Provider (with fallback)
        try:
            opt_data = await self.provider.optimize_script(
                title=title,
                topic=topic,
                platform=platform,
                language=resolved_language,
                duration_seconds=duration_seconds,
                tone=tone,
                hook=original_hook,
                segments=original_segments,
                cta=original_cta,
                goals=request.goals,
                instructions=request.instructions,
                target_retention_areas=request.target_retention_areas,
                creator_name=creator_name,
                niche=niche,
                audience=target_audience,
            )
        except Exception as e:
            logger.error(f"Error in ScriptOptimizerAgent optimize_custom provider: {e}. Falling back to heuristic mock.")
            fallback = OfflineHeuristicMockProvider()
            opt_data = await fallback.optimize_script(
                title=title,
                topic=topic,
                platform=platform,
                language=resolved_language,
                duration_seconds=duration_seconds,
                tone=tone,
                hook=original_hook,
                segments=original_segments,
                cta=original_cta,
                goals=request.goals,
                instructions=request.instructions,
                target_retention_areas=request.target_retention_areas,
                creator_name=creator_name,
                niche=niche,
                audience=target_audience,
            )

        optimized_segments = opt_data.get("segments", original_segments)
        optimized_hook = opt_data.get("hook", original_hook)
        optimized_cta = opt_data.get("cta", original_cta)
        optimized_title = opt_data.get("title", f"{title} (Optimized)")
        changes_list = opt_data.get("changes_made", [])
        provider_used = opt_data.get("provider_used", "heuristic_mock")

        # 3. Analyze AFTER optimization
        analysis_after_dict = await self.provider.analyze_script_retention(
            title=optimized_title,
            topic=topic,
            platform=platform,
            language=resolved_language,
            duration_seconds=duration_seconds,
            hook=optimized_hook,
            segments=optimized_segments,
            cta=optimized_cta,
            niche=niche,
            target_audience=target_audience,
        )
        analysis_after_dict["script_id"] = "custom"
        analysis_after = ScriptAnalysisResponse.model_validate(analysis_after_dict)

        now = datetime.now(timezone.utc)
        original_script_response = ScriptResponse(
            id="custom",
            title=title,
            topic=topic,
            platform=platform,
            language=resolved_language,
            duration_seconds=duration_seconds,
            tone=tone,
            hook=original_hook,
            segments=original_segments,
            cta=original_cta,
            provider_used="custom_input",
            current_version=1,
            created_at=now,
            updated_at=now,
            versions=[],
        )

        return ScriptOptimizationResponse(
            script_id="custom",
            original_script=original_script_response,
            optimized_script=OptimizedScriptData(
                title=optimized_title,
                topic=topic,
                platform=platform,
                language=resolved_language,
                duration_seconds=duration_seconds,
                tone=tone,
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
