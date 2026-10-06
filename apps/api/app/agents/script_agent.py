import logging
from typing import Optional, Dict, Any
from app.schemas.script import ScriptGenerationRequest
from app.schemas.extraction import GenerateScriptFromURLRequest
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

        # Resolve CTA: user override takes precedence, otherwise profile CTA style
        cta = request.cta
        if not cta and db_profile and getattr(db_profile, "cta_style", None):
            cta = f"Call to action style: {db_profile.cta_style}"

        # Resolve extended context
        extra_context_parts = []
        if request.context:
            extra_context_parts.append(request.context)
        if db_profile:
            if getattr(db_profile, "storytelling_style", None):
                extra_context_parts.append(f"Storytelling style: {db_profile.storytelling_style}")
            if getattr(db_profile, "words_to_use", None) and db_profile.words_to_use:
                extra_context_parts.append(f"Signature vocabulary: {', '.join(db_profile.words_to_use)}")
            if getattr(db_profile, "words_to_avoid", None) and db_profile.words_to_avoid:
                extra_context_parts.append(f"Words to strictly avoid: {', '.join(db_profile.words_to_avoid)}")
            if getattr(db_profile, "custom_tone_notes", None):
                extra_context_parts.append(f"Voice guidance: {db_profile.custom_tone_notes}")
        enriched_context = " | ".join(extra_context_parts) if extra_context_parts else None

        try:
            result = await self.provider.generate_script(
                topic=request.topic,
                platform=request.platform,
                language=language,
                duration_seconds=request.duration_seconds,
                tone=tone,
                hook=request.hook,
                cta=cta,
                creator_name=creator_name,
                niche=niche,
                audience=audience,
                context=enriched_context,
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

    async def generate_from_extracted_video(
        self,
        request: GenerateScriptFromURLRequest,
        db_profile: Optional[CreatorProfile] = None,
    ) -> Dict[str, Any]:
        """
        Adapts an extracted video transcript into a brand-new structured screenplay
        based on the user's selected adaptation goal, custom instructions, and creator persona.
        """
        creator_name = db_profile.creator_name if db_profile else None
        niche = db_profile.niche if db_profile else "Cinematography & Short-Form Content"
        audience = db_profile.target_audience if db_profile else "Short-form video creators"
        language = request.language or (db_profile.primary_language if db_profile else "English")

        extra_context_parts = []
        if request.instructions:
            extra_context_parts.append(f"Instructions: {request.instructions}")
        if db_profile:
            if getattr(db_profile, "storytelling_style", None):
                extra_context_parts.append(f"Storytelling style: {db_profile.storytelling_style}")
            if getattr(db_profile, "words_to_use", None) and db_profile.words_to_use:
                extra_context_parts.append(f"Signature vocabulary: {', '.join(db_profile.words_to_use)}")
            if getattr(db_profile, "words_to_avoid", None) and db_profile.words_to_avoid:
                extra_context_parts.append(f"Words to strictly avoid: {', '.join(db_profile.words_to_avoid)}")
            if getattr(db_profile, "custom_tone_notes", None):
                extra_context_parts.append(f"Voice guidance: {db_profile.custom_tone_notes}")
        enriched_context = " | ".join(extra_context_parts) if extra_context_parts else None

        try:
            result = await self.provider.generate_script_from_video_content(
                extracted_text=request.extracted_text,
                original_video_title=request.original_video_title,
                source_url=request.url,
                platform=request.platform or "Instagram Reels",
                language=language,
                duration_seconds=request.duration_seconds or 30,
                goal=request.goal or "Rewrite",
                instructions=request.instructions,
                creator_name=creator_name,
                niche=niche,
                audience=audience,
                context=enriched_context,
            )
        except Exception as e:
            logger.error(f"Error in ScriptAgent generate_from_extracted_video: {e}. Falling back to mock.")
            fallback = OfflineHeuristicMockProvider()
            result = await fallback.generate_script_from_video_content(
                extracted_text=request.extracted_text,
                original_video_title=request.original_video_title,
                source_url=request.url,
                platform=request.platform or "Instagram Reels",
                language=language,
                duration_seconds=request.duration_seconds or 30,
                goal=request.goal or "Rewrite",
                instructions=request.instructions,
                creator_name=creator_name,
                niche=niche,
                audience=audience,
                context=enriched_context,
            )

        return result


def get_script_agent() -> ScriptAgent:
    return ScriptAgent()
