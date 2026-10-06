import uuid
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.config import settings
from app.models.trend_research import TrendResearchSession
from app.models.creator_profile import CreatorProfile
from app.schemas.trend_research import (
    TrendResearchRequest,
    TrendResearchSessionResponse,
    TrendOpportunityItem,
    TrendScoreBreakdown,
    TrendSourceInfo,
    TrendResearchHistoryItem,
    TrendResearchHistoryResponse,
    calculate_overall_score,
)
from app.schemas.creator_profile import CreatorProfileBase
from app.services.llm_provider import get_llm_provider, BaseLLMProvider
from app.services.script_language_detector import normalize_language_contract

logger = logging.getLogger(__name__)


class TrendResearchAgent:
    """
    Trend & Content Opportunity Research Agent.
    Uncovers personalized, high-retention short-form content opportunities
    tailored to the creator's persona, niche, pillars, audience, and preferred language.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()

    async def execute(
        self,
        request: TrendResearchRequest,
        db: AsyncSession,
        db_profile: Optional[CreatorProfile] = None,
    ) -> TrendResearchSessionResponse:
        # Resolve active persona
        active_persona = request.creator_profile or db_profile
        profile_id = db_profile.id if db_profile else None

        # Build persona context dict for LLM provider
        persona_dict: Dict[str, Any] = {}
        if active_persona:
            persona_dict = {
                "creator_name": getattr(active_persona, "creator_name", "Creator"),
                "primary_niche": getattr(active_persona, "niche", "Cinematography"),
                "secondary_niches": getattr(active_persona, "secondary_niches", []) or [],
                "content_pillars": getattr(active_persona, "content_pillars", []) or [],
                "target_audience": getattr(active_persona, "target_audience", "") or "",
                "audience_pain_points": getattr(active_persona, "audience_pain_points", []) or [],
                "audience_interests": getattr(active_persona, "audience_interests", []) or [],
                "content_tones": getattr(active_persona, "content_tones", []) or [],
                "words_to_use": getattr(active_persona, "words_to_use", []) or [],
                "style_rules": getattr(active_persona, "style_rules", []) or [],
            }

        # Resolve request parameters (explicit overrides take precedence over profile)
        niche = request.niche or (active_persona.niche if active_persona else "Cinematography")
        target_audience = (
            request.target_audience
            or (active_persona.target_audience if active_persona else "Short-form creators and visual storytellers")
            or "Short-form creators and visual storytellers"
        )
        platform = request.platform or (
            active_persona.platforms[0] if (active_persona and active_persona.platforms) else "Instagram Reels"
        )
        language = normalize_language_contract(
            request.language or (active_persona.primary_language if active_persona else "English")
        )
        research_depth = request.research_depth or "Deep Dive"
        time_horizon = request.time_horizon or "Current Momentum"
        count = request.count or 5

        # Call provider
        try:
            result = await self.provider.generate_trend_research(
                topic=request.topic,
                niche=niche,
                target_audience=target_audience,
                platform=platform,
                language=language,
                research_depth=research_depth,
                time_horizon=time_horizon,
                count=count,
                creator_persona=persona_dict,
            )
        except Exception as e:
            logger.warning(f"Trend research generation failed: {e}. Falling back to heuristic mock.")
            from app.services.llm_provider import OfflineHeuristicMockProvider
            fallback = OfflineHeuristicMockProvider()
            result = await fallback.generate_trend_research(
                topic=request.topic,
                niche=niche,
                target_audience=target_audience,
                platform=platform,
                language=language,
                research_depth=research_depth,
                time_horizon=time_horizon,
                count=count,
                creator_persona=persona_dict,
            )

        # Parse & validate opportunity items
        opportunities_data = result.get("opportunities", [])
        validated_opportunities: List[TrendOpportunityItem] = []

        for item in opportunities_data:
            scores_data = item.get("scores", {})
            m = int(scores_data.get("momentum", 85))
            a = int(scores_data.get("audience_fit", 88))
            c = int(scores_data.get("creator_fit", 90))
            o = int(scores_data.get("content_opportunity", 85))
            u = int(scores_data.get("urgency", 82))
            overall = calculate_overall_score(m, a, c, o, u)

            score_breakdown = TrendScoreBreakdown(
                momentum=m,
                audience_fit=a,
                creator_fit=c,
                content_opportunity=o,
                urgency=u,
                overall_score=overall,
            )

            source_raw = item.get("source", {})
            source_info = TrendSourceInfo(
                type=source_raw.get("type", "ai_opportunity_research"),
                label=source_raw.get("label", "AI Opportunity Analysis"),
                verified=bool(source_raw.get("verified", False)),
                citation=source_raw.get(
                    "citation",
                    "Synthesized from Creator Persona, Content Pillars & Short-Form Pattern Engine",
                ),
            )

            opp_id = item.get("id") or f"trend_opp_{uuid.uuid4().hex[:10]}"

            validated_opportunities.append(
                TrendOpportunityItem(
                    id=opp_id,
                    topic=item.get("topic", "Creative Concept"),
                    primary_niche=item.get("primary_niche", niche),
                    target_audience=item.get("target_audience", target_audience),
                    platform=item.get("platform", platform),
                    language=language,
                    content_pillar=item.get("content_pillar"),
                    recommended_format=item.get("recommended_format", "Visual Breakdown"),
                    recommended_duration=item.get("recommended_duration", "30–45s"),
                    recommended_cta=item.get("recommended_cta", "Save this video for later."),
                    scores=score_breakdown,
                    why_it_matters=item.get("why_it_matters", ""),
                    angle_ideas=item.get("angle_ideas", []),
                    recommended_hooks=item.get("recommended_hooks", []),
                    talking_points=item.get("talking_points", []),
                    source=source_info,
                )
            )

        # Persist session to database
        session_id = str(uuid.uuid4())
        session_record = TrendResearchSession(
            id=session_id,
            profile_id=profile_id,
            query_topic=request.topic,
            niche=niche,
            target_audience=target_audience,
            platform=platform,
            language=language,
            research_depth=research_depth,
            time_horizon=time_horizon,
            summary=result.get("summary", ""),
            opportunities=[opp.model_dump() for opp in validated_opportunities],
            provider_used=result.get("provider_used", "heuristic_mock"),
        )
        db.add(session_record)
        await db.commit()
        await db.refresh(session_record)

        return TrendResearchSessionResponse(
            id=session_record.id,
            profile_id=session_record.profile_id,
            query_topic=session_record.query_topic,
            niche=session_record.niche,
            target_audience=session_record.target_audience,
            platform=session_record.platform,
            language=session_record.language,
            research_depth=session_record.research_depth,
            time_horizon=session_record.time_horizon,
            summary=session_record.summary,
            opportunities=validated_opportunities,
            provider_used=session_record.provider_used,
            created_at=session_record.created_at,
            updated_at=session_record.updated_at,
        )

    async def get_session(self, session_id: str, db: AsyncSession) -> Optional[TrendResearchSessionResponse]:
        query = select(TrendResearchSession).where(TrendResearchSession.id == session_id)
        result = await db.execute(query)
        session_record = result.scalar_one_or_none()
        if not session_record:
            return None

        # Reconstruct opportunities
        opps: List[TrendOpportunityItem] = []
        for opp_dict in (session_record.opportunities or []):
            try:
                opps.append(TrendOpportunityItem.model_validate(opp_dict))
            except Exception:
                continue

        return TrendResearchSessionResponse(
            id=session_record.id,
            profile_id=session_record.profile_id,
            query_topic=session_record.query_topic,
            niche=session_record.niche,
            target_audience=session_record.target_audience,
            platform=session_record.platform,
            language=session_record.language,
            research_depth=session_record.research_depth,
            time_horizon=session_record.time_horizon,
            summary=session_record.summary,
            opportunities=opps,
            provider_used=session_record.provider_used,
            created_at=session_record.created_at,
            updated_at=session_record.updated_at,
        )

    async def list_history(
        self,
        db: AsyncSession,
        limit: int = 20,
    ) -> TrendResearchHistoryResponse:
        query = (
            select(TrendResearchSession)
            .order_by(desc(TrendResearchSession.created_at))
            .limit(limit)
        )
        result = await db.execute(query)
        sessions = result.scalars().all()

        history_items: List[TrendResearchHistoryItem] = []
        for s in sessions:
            opp_count = len(s.opportunities) if s.opportunities else 0
            top_title = None
            top_score = None
            if s.opportunities and len(s.opportunities) > 0:
                first = s.opportunities[0]
                top_title = first.get("topic")
                scores = first.get("scores", {})
                top_score = scores.get("overall_score")

            history_items.append(
                TrendResearchHistoryItem(
                    id=s.id,
                    query_topic=s.query_topic,
                    niche=s.niche,
                    platform=s.platform,
                    language=s.language,
                    opportunity_count=opp_count,
                    top_opportunity_title=top_title,
                    top_score=top_score,
                    created_at=s.created_at,
                )
            )

        return TrendResearchHistoryResponse(
            sessions=history_items,
            total=len(history_items),
        )

    async def refresh_session(
        self,
        session_id: str,
        db: AsyncSession,
        db_profile: Optional[CreatorProfile] = None,
    ) -> Optional[TrendResearchSessionResponse]:
        query = select(TrendResearchSession).where(TrendResearchSession.id == session_id)
        result = await db.execute(query)
        session_record = result.scalar_one_or_none()
        if not session_record:
            return None

        # Rerun research with same parameters
        req = TrendResearchRequest(
            topic=session_record.query_topic,
            niche=session_record.niche,
            target_audience=session_record.target_audience,
            platform=session_record.platform,
            language=session_record.language,
            research_depth=session_record.research_depth,
            time_horizon=session_record.time_horizon,
            count=len(session_record.opportunities) if session_record.opportunities else 5,
        )
        return await self.execute(request=req, db=db, db_profile=db_profile)

    async def delete_session(self, session_id: str, db: AsyncSession) -> bool:
        query = select(TrendResearchSession).where(TrendResearchSession.id == session_id)
        result = await db.execute(query)
        session_record = result.scalar_one_or_none()
        if not session_record:
            return False

        await db.delete(session_record)
        await db.commit()
        return True


def get_trend_research_agent() -> TrendResearchAgent:
    return TrendResearchAgent()
