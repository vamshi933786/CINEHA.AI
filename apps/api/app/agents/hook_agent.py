import logging
from typing import List, Optional
from app.schemas.hook import (
    HookGenerationRequest,
    HookGenerationResponse,
    HookItem,
    VALID_TAXONOMIES,
)
from app.schemas.creator_profile import CreatorProfileBase
from app.services.llm_provider import get_llm_provider, BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class HookAgent:
    """
    Hook Analyst Agent.
    Specialized agent engineering high-retention 0–3 second opening hooks
    categorized across the 9 validated short-form psychological taxonomies.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()

    async def execute(
        self,
        request: HookGenerationRequest,
        db_profile: Optional[CreatorProfileBase] = None,
    ) -> HookGenerationResponse:
        # Resolve creator persona: explicit request override takes precedence over DB profile
        active_persona = request.creator_profile or db_profile

        # Fallback defaults if no profile exists
        niche = active_persona.niche if active_persona else "Short-Form Content"
        audience = (
            active_persona.target_audience
            if active_persona and active_persona.target_audience
            else "General audience interested in short-form videos"
        )
        tones = active_persona.content_tones if active_persona else ["Conversational", "Educational"]
        goals = active_persona.content_goals if active_persona else ["Increase retention"]
        language = request.language or (active_persona.primary_language if active_persona else "English")
        persona_name = active_persona.creator_name if active_persona else None

        # Enrich context with creator persona voice & brand guidance
        extra_context_parts = []
        if request.context:
            extra_context_parts.append(request.context)
        if active_persona:
            if getattr(active_persona, "energy", None):
                extra_context_parts.append(f"Energy: {active_persona.energy}")
            if getattr(active_persona, "vocabulary", None):
                extra_context_parts.append(f"Vocabulary: {active_persona.vocabulary}")
            if getattr(active_persona, "words_to_use", None) and active_persona.words_to_use:
                extra_context_parts.append(f"Signature words to use: {', '.join(active_persona.words_to_use)}")
            if getattr(active_persona, "words_to_avoid", None) and active_persona.words_to_avoid:
                extra_context_parts.append(f"Words to strictly avoid: {', '.join(active_persona.words_to_avoid)}")
            if getattr(active_persona, "topics_to_avoid", None) and active_persona.topics_to_avoid:
                extra_context_parts.append(f"Topics to avoid: {', '.join(active_persona.topics_to_avoid)}")
        enriched_context = " | ".join(extra_context_parts)

        # Desired categories (defaults to all 9 if not specified)
        categories = request.categories or VALID_TAXONOMIES

        try:
            hooks: List[HookItem] = await self.provider.generate_hooks(
                topic=request.topic,
                niche=niche,
                platform=request.platform,
                language=language,
                tones=tones,
                goals=goals,
                audience=audience,
                categories=categories,
                count=request.count,
                context=enriched_context,
            )
        except Exception as e:
            logger.error(f"Error in HookAgent provider execution: {e}")
            # Fall back to heuristic provider to guarantee user never receives a raw crash
            from app.services.llm_provider import OfflineHeuristicMockProvider
            fallback = OfflineHeuristicMockProvider()
            hooks = await fallback.generate_hooks(
                topic=request.topic,
                niche=niche,
                platform=request.platform,
                language=language,
                tones=tones,
                goals=goals,
                audience=audience,
                categories=categories,
                count=request.count,
                context=request.context or "",
            )

        provider_name = (
            "gemini_pro"
            if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY
            else "heuristic_mock"
        )

        return HookGenerationResponse(
            success=True,
            hooks=hooks,
            count=len(hooks),
            provider_used=provider_name,
            persona_used=persona_name,
        )

# Factory helper
def get_hook_agent() -> HookAgent:
    return HookAgent()
