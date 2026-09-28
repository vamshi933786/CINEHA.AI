import logging
from typing import Optional, Dict, Any
from app.schemas.script import ScriptGenerationRequest
from app.models.creator_profile import CreatorProfile
from app.services.llm_provider import get_llm_provider, BaseLLMProvider, OfflineHeuristicMockProvider

logger = logging.getLogger(__name__)


class ScriptAgent:
    """
    Script Architect Agent.
    Transforms creator topics and hooks into structured, time-coded screenplays
    optimized for Instagram Reels, TikTok, and YouTube Shorts.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or get_llm_provider()

    async def generate(
        self,
        request: ScriptGenerationRequest,
        db_profile: Optional[CreatorProfile] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates persona extraction, hook integration, screenplay timing,
        and multi-segment visual/audio direction generation.
        """
        # Resolve creator persona
        creator_name = db_profile.creator_name if db_profile else None
        niche = db_profile.niche if db_profile else "Cinematography & Short-Form Content"
        audience = db_profile.target_audience if db_profile else "Short-form video creators"

        # Resolve tone: user override takes precedence, otherwise use profile tones
        if request.tone and request.tone.strip():
            tone = request.tone.strip()
        elif db_profile and db_profile.content_tones:
            tone = ", ".join(db_profile.content_tones)
        else:
            tone = "Cinematic, Engaging"

        # Resolve language
        language = request.language or (db_profile.primary_language if db_profile else "English")

        try:
            result = await self.provider.generate_script(
                topic=request.topic,
                platform=request.platform,
                language=language,
                duration_seconds=request.duration_seconds,
                tone=tone,
                hook=request.hook,
                cta=request.cta,
                creator_name=creator_name,
                niche=niche,
                audience=audience,
                context=request.context,
            )
        except Exception as e:
            logger.error(f"Error in ScriptAgent provider execution: {e}. Falling back to heuristic mock.")
            fallback = OfflineHeuristicMockProvider()
            result = await fallback.generate_script(
                topic=request.topic,
                platform=request.platform,
                language=language,
                duration_seconds=request.duration_seconds,
                tone=tone,
                hook=request.hook,
                cta=request.cta,
                creator_name=creator_name,
                niche=niche,
                audience=audience,
                context=request.context,
            )

        return result


def get_script_agent() -> ScriptAgent:
    return ScriptAgent()
