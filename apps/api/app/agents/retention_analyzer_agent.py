import logging
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.script import Script
from app.models.creator_profile import CreatorProfile
from app.schemas.analyzer import ScriptAnalysisRequest, ScriptAnalysisResponse
from app.services.llm_provider import get_llm_provider, BaseLLMProvider, OfflineHeuristicMockProvider
from app.services.script_language_detector import resolve_script_language, normalize_language_contract

logger = logging.getLogger(__name__)


class RetentionAnalyzerAgent:
    """
    Retention Analyst Agent.
    Performs comprehensive diagnostic audits across 9 core short-form psychological dimensions:
    Hook clarity, Hook strength, Story pacing, Information density, Filler repetition,
    Segment timing, Curiosity open loops, CTA punch, and Overall retention viability.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()

    async def analyze(
        self,
        request: ScriptAnalysisRequest,
        db: AsyncSession,
    ) -> ScriptAnalysisResponse:
        resolved_script_id: Optional[str] = None
        title = request.title or "Untitled Screenplay"
        topic = request.topic or ""
        platform = request.platform or "Instagram Reels"
        language = request.language or "English"
        duration_seconds = request.duration_seconds or 30
        hook = request.hook or ""
        segments: List[Dict[str, Any]] = []
        cta = request.cta or ""

        # 1. If script_id is provided, resolve from database
        if request.script_id:
            stmt = select(Script).where(Script.id == request.script_id)
            result = await db.execute(stmt)
            db_script = result.scalar_one_or_none()
            if db_script is None and not request.segments:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Script with ID '{request.script_id}' not found.",
                )
            if db_script:
                resolved_script_id = db_script.id
                title = db_script.title
                topic = db_script.topic
                platform = db_script.platform
                language = db_script.language
                duration_seconds = db_script.duration_seconds
                hook = db_script.hook
                segments = db_script.segments if isinstance(db_script.segments, list) else []
                cta = db_script.cta

        # 2. If raw segments provided in request, override or populate
        if request.segments:
            segments = [s.model_dump() for s in request.segments]
            if request.title:
                title = request.title
            if request.topic:
                topic = request.topic
            if request.hook:
                hook = request.hook
            if request.cta:
                cta = request.cta
            if request.duration_seconds:
                duration_seconds = request.duration_seconds
            if request.platform:
                platform = request.platform
            if request.language:
                language = request.language

        # 3. If normalized script_text provided, parse into structured segments
        elif request.script_text and request.script_text.strip():
            from app.services.script_parser import parse_script_text_to_segments
            parsed_hook, parsed_cta, parsed_segments = parse_script_text_to_segments(
                request.script_text, duration_seconds=duration_seconds
            )
            segments = parsed_segments
            hook = request.hook or parsed_hook
            cta = request.cta or parsed_cta
            if request.title:
                title = request.title
            else:
                first_line = request.script_text.strip().split("\n")[0][:60].strip()
                title = first_line if first_line else "Imported Script"
            if request.topic:
                topic = request.topic
            if request.platform:
                platform = request.platform
            if request.language:
                language = request.language

        if not segments:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No screenplay beats or segments provided to analyze.",
            )

        if not hook and segments:
            hook = segments[0].get("voiceover", "")

        if not cta and segments:
            cta = segments[-1].get("voiceover", "")

        # 3. Retrieve creator profile context if available
        profile_stmt = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        profile_res = await db.execute(profile_stmt)
        creator_profile = profile_res.scalar_one_or_none()

        niche = creator_profile.niche if creator_profile else "Creator Content"
        target_audience = creator_profile.target_audience if creator_profile else "General short-form viewers"
        creator_profile_lang = creator_profile.primary_language if creator_profile else None

        # Resolve explicit language > creator profile preference > safe fallback detection
        script_full_text = request.script_text or f"{hook} " + " ".join(s.get("voiceover", "") for s in segments)
        language = resolve_script_language(
            explicit_lang=language if request.language or (resolved_script_id and language) else None,
            script_text=script_full_text,
            creator_profile_lang=creator_profile_lang,
        )

        try:
            analysis_data = await self.provider.analyze_script_retention(
                title=title,
                topic=topic,
                platform=platform,
                language=language,
                duration_seconds=duration_seconds,
                hook=hook,
                segments=segments,
                cta=cta,
                niche=niche,
                target_audience=target_audience,
            )
        except Exception as e:
            logger.error(f"Error in RetentionAnalyzerAgent provider: {e}. Falling back to heuristic mock.")
            fallback = OfflineHeuristicMockProvider()
            analysis_data = await fallback.analyze_script_retention(
                title=title,
                topic=topic,
                platform=platform,
                language=language,
                duration_seconds=duration_seconds,
                hook=hook,
                segments=segments,
                cta=cta,
                niche=niche,
                target_audience=target_audience,
            )

        analysis_data["script_id"] = resolved_script_id
        analysis_data["title"] = title
        analysis_data["language"] = language

        return ScriptAnalysisResponse.model_validate(analysis_data)


def get_retention_analyzer_agent() -> RetentionAnalyzerAgent:
    return RetentionAnalyzerAgent()
