import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.creator_profile import CreatorProfile
from app.schemas.creator_profile import (
    CreatorProfileCreateOrUpdate,
    ProfileContainerResponse,
    CreatorProfileResponse,
    CreatorPersonaContext,
    PersonaPreviewResponse,
    calculate_profile_completeness,
)
from app.services.llm_provider import get_llm_provider, GeminiLLMProvider

logger = logging.getLogger(__name__)

router = APIRouter()


def profile_to_persona_context(profile: Optional[CreatorProfile]) -> CreatorPersonaContext:
    """Builds a centralized CreatorPersonaContext for downstream AI agents."""
    if profile is None:
        return CreatorPersonaContext(
            creator_name="Sai Panga",
            display_name="Cineha",
            creator_type="Filmmaker",
            bio="Short-form cinematography and mobile storytelling breakdowns.",
            location="Hyderabad, India",
            primary_niche="Cinematography",
            secondary_niches=["Mobile Filmmaking", "Lighting Techniques"],
            content_pillars=["Lighting Breakdowns", "Camera Angles", "Visual Rhythm"],
            topics_to_avoid=["Gear Drama", "Vague Motivation"],
            target_audience="Aspiring mobile filmmakers and content creators.",
            target_audience_age="18–34",
            audience_interests=["Reels cinematography", "Lighting hacks", "High retention"],
            audience_pain_points=["Flat lighting", "Shaky footage", "Low engagement"],
            audience_sophistication="Intermediate",
            tone="Cinematic, Educational, Conversational",
            energy="Balanced",
            humor="Light",
            storytelling_style="Example-driven",
            vocabulary="Balanced",
            custom_tone_notes="Keep pacing brisk and explain visual rationale before camera technicals.",
            primary_language="Tanglish",
            secondary_languages=["English", "Telugu"],
            script_preference="Tanglish / Romanized Telugu",
            platforms=["Instagram Reels", "YouTube Shorts"],
            preferred_duration="45 sec",
            preferred_aspect_ratio="9:16",
            cta_style="Save",
            secondary_cta_styles=["Follow", "Comment"],
            content_goals=["Increase retention", "Build personal brand"],
            brand_positioning="The practical filmmaking mentor who makes pro cinematography accessible.",
            core_message="Cinematic visual storytelling depends on lighting and deliberate camera placement, not expensive gear.",
            words_to_use=["Cinematic", "Frame", "Lighting ratio", "Visual depth"],
            words_to_avoid=["Smash that like button", "Secret hack", "Viral glitch"],
            style_rules=["Hook in first 3 seconds with visual proof", "Deliver practical breakdown without filler"],
        )

    tone_str = ", ".join(profile.content_tones) if profile.content_tones else "Conversational, Educational"
    return CreatorPersonaContext(
        creator_name=profile.creator_name,
        display_name=profile.display_name,
        creator_type=profile.creator_type or "Filmmaker",
        bio=profile.creator_bio or "",
        location=profile.location,
        primary_niche=profile.niche,
        secondary_niches=profile.secondary_niches or [],
        content_pillars=profile.content_pillars or [],
        topics_to_avoid=profile.topics_to_avoid or [],
        target_audience=profile.target_audience or "",
        target_audience_age=profile.target_audience_age,
        audience_interests=profile.audience_interests or [],
        audience_pain_points=profile.audience_pain_points or [],
        audience_sophistication=profile.audience_sophistication,
        tone=tone_str,
        energy=profile.energy,
        humor=profile.humor,
        storytelling_style=profile.storytelling_style,
        vocabulary=profile.vocabulary,
        custom_tone_notes=profile.custom_tone_notes,
        primary_language=profile.primary_language,
        secondary_languages=profile.secondary_languages or [],
        script_preference=profile.script_preference,
        platforms=profile.platforms or [],
        preferred_duration=profile.typical_duration,
        preferred_aspect_ratio=profile.preferred_aspect_ratio,
        cta_style=profile.cta_style,
        secondary_cta_styles=profile.secondary_cta_styles or [],
        content_goals=profile.content_goals or [],
        brand_positioning=profile.brand_positioning,
        core_message=profile.core_message,
        words_to_use=profile.words_to_use or [],
        words_to_avoid=profile.words_to_avoid or [],
        style_rules=profile.style_rules or [],
    )


def generate_deterministic_persona_preview(context: CreatorPersonaContext) -> PersonaPreviewResponse:
    """Fast, deterministic persona preview without network latency or external LLM billing."""
    niche = context.primary_niche
    aud = context.target_audience if context.target_audience else "creators & viewers"
    tone = context.tone if context.tone else "authentic"
    lang = context.primary_language

    summary = (
        f"You are a {context.creator_type} focused on {niche}, speaking directly to {aud} "
        f"with a {tone} voice in {lang}."
    )

    if lang.lower() in ("telugu", "te"):
        example_hook = f"{niche} లో ఈ తప్పు చేస్తున్నారా? 90% మంది చేసే మిస్టేక్ ఇది!"
        example_intro = f"సినిమాటిక్ {niche} కోసం లక్షలు ఖర్చు పెట్టక్కర్లేదు. ఈ సింపుల్ ట్రిక్ చూడండి."
        cta_word = context.cta_style or "సేవ్ చేసుకోండి"
        example_cta = f"మీ తర్వాతి షూట్ కోసం ఈ రీల్ ని ఇప్పుడే {cta_word}!"
    elif lang.lower() in ("tanglish", "tenglish"):
        example_hook = f"{niche} lo ee common mistake meeru kuda chesthunnara?"
        example_intro = f"Cinematic {niche} kosam expensive gear akkarledu. Ee simple technique try cheyandi."
        cta_action = context.cta_style or "Save"
        example_cta = f"Next time shoot chesinappudu try cheyadaniki ee reel ni {cta_action} cheyandi!"
    else:
        example_hook = f"Stop making this common {niche} mistake if you want high retention."
        example_intro = f"You don't need expensive equipment to master {niche}. Watch this practical breakdown."
        cta_action = context.cta_style or "Save"
        example_cta = f"{cta_action} this breakdown so you can refer back before your next shoot."

    return PersonaPreviewResponse(
        summary=summary,
        example_hook=example_hook,
        example_intro=example_intro,
        example_cta=example_cta,
        is_ai_generated=False,
    )


@router.get(
    "/profile",
    response_model=ProfileContainerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Creator Profile",
    description="Returns the active creator persona profile, extended fields, and completeness score.",
)
async def get_profile(db: AsyncSession = Depends(get_db)) -> ProfileContainerResponse:
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if profile is None:
        return ProfileContainerResponse(profile=None, is_configured=False)

    completeness = calculate_profile_completeness(profile)
    res = CreatorProfileResponse.model_validate(profile)
    res.completeness = completeness

    return ProfileContainerResponse(
        profile=res,
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
        profile = CreatorProfile(
            creator_name=payload.creator_name,
            display_name=payload.display_name,
            creator_type=payload.creator_type,
            creator_bio=payload.creator_bio or "",
            location=payload.location,
            niche=payload.niche,
            secondary_niches=payload.secondary_niches,
            content_pillars=payload.content_pillars,
            topics_to_avoid=payload.topics_to_avoid,
            target_audience=payload.target_audience or "",
            target_audience_age=payload.target_audience_age,
            audience_interests=payload.audience_interests,
            audience_pain_points=payload.audience_pain_points,
            audience_sophistication=payload.audience_sophistication,
            content_tones=payload.content_tones,
            energy=payload.energy,
            humor=payload.humor,
            storytelling_style=payload.storytelling_style,
            vocabulary=payload.vocabulary,
            custom_tone_notes=payload.custom_tone_notes,
            primary_language=payload.primary_language,
            secondary_languages=payload.secondary_languages,
            script_preference=payload.script_preference,
            platforms=payload.platforms,
            preferred_aspect_ratio=payload.preferred_aspect_ratio,
            typical_duration=payload.typical_duration,
            cta_style=payload.cta_style,
            secondary_cta_styles=payload.secondary_cta_styles,
            content_goals=payload.content_goals,
            brand_positioning=payload.brand_positioning,
            core_message=payload.core_message,
            words_to_use=payload.words_to_use,
            words_to_avoid=payload.words_to_avoid,
            style_rules=payload.style_rules,
            liked_examples=payload.liked_examples,
            disliked_examples=payload.disliked_examples,
        )
        db.add(profile)
    else:
        profile.creator_name = payload.creator_name
        profile.display_name = payload.display_name
        profile.creator_type = payload.creator_type
        profile.creator_bio = payload.creator_bio or ""
        profile.location = payload.location
        profile.niche = payload.niche
        profile.secondary_niches = payload.secondary_niches
        profile.content_pillars = payload.content_pillars
        profile.topics_to_avoid = payload.topics_to_avoid
        profile.target_audience = payload.target_audience or ""
        profile.target_audience_age = payload.target_audience_age
        profile.audience_interests = payload.audience_interests
        profile.audience_pain_points = payload.audience_pain_points
        profile.audience_sophistication = payload.audience_sophistication
        profile.content_tones = payload.content_tones
        profile.energy = payload.energy
        profile.humor = payload.humor
        profile.storytelling_style = payload.storytelling_style
        profile.vocabulary = payload.vocabulary
        profile.custom_tone_notes = payload.custom_tone_notes
        profile.primary_language = payload.primary_language
        profile.secondary_languages = payload.secondary_languages
        profile.script_preference = payload.script_preference
        profile.platforms = payload.platforms
        profile.preferred_aspect_ratio = payload.preferred_aspect_ratio
        profile.typical_duration = payload.typical_duration
        profile.cta_style = payload.cta_style
        profile.secondary_cta_styles = payload.secondary_cta_styles
        profile.content_goals = payload.content_goals
        profile.brand_positioning = payload.brand_positioning
        profile.core_message = payload.core_message
        profile.words_to_use = payload.words_to_use
        profile.words_to_avoid = payload.words_to_avoid
        profile.style_rules = payload.style_rules
        profile.liked_examples = payload.liked_examples
        profile.disliked_examples = payload.disliked_examples

    await db.commit()
    await db.refresh(profile)

    completeness = calculate_profile_completeness(profile)
    res = CreatorProfileResponse.model_validate(profile)
    res.completeness = completeness

    return ProfileContainerResponse(
        profile=res,
        is_configured=True,
    )


@router.get(
    "/profile/persona",
    response_model=CreatorPersonaContext,
    status_code=status.HTTP_200_OK,
    summary="Get Creator Persona Context",
    description="Returns the structured persona context ready for consumption by AI agents.",
)
async def get_persona_context(db: AsyncSession = Depends(get_db)) -> CreatorPersonaContext:
    query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()
    return profile_to_persona_context(profile)


@router.post(
    "/profile/generate-summary",
    response_model=PersonaPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI Persona Summary & Examples",
    description="Generates an AI persona summary and sample hook/intro/CTA using Gemini (with deterministic fallback).",
)
async def generate_persona_summary(
    payload: Optional[CreatorProfileCreateOrUpdate] = None,
    db: AsyncSession = Depends(get_db),
) -> PersonaPreviewResponse:
    # Resolve context: payload if provided, otherwise latest DB profile
    if payload is not None:
        # Convert schema to temporary profile-like context
        temp_dict = payload.model_dump()
        context = CreatorPersonaContext(
            creator_name=temp_dict["creator_name"],
            display_name=temp_dict.get("display_name"),
            creator_type=temp_dict.get("creator_type", "Filmmaker"),
            bio=temp_dict.get("creator_bio", ""),
            location=temp_dict.get("location"),
            primary_niche=temp_dict["niche"],
            secondary_niches=temp_dict.get("secondary_niches", []),
            content_pillars=temp_dict.get("content_pillars", []),
            topics_to_avoid=temp_dict.get("topics_to_avoid", []),
            target_audience=temp_dict.get("target_audience", ""),
            target_audience_age=temp_dict.get("target_audience_age"),
            audience_interests=temp_dict.get("audience_interests", []),
            audience_pain_points=temp_dict.get("audience_pain_points", []),
            audience_sophistication=temp_dict.get("audience_sophistication"),
            tone=", ".join(temp_dict.get("content_tones", [])) if temp_dict.get("content_tones") else "Conversational",
            energy=temp_dict.get("energy"),
            humor=temp_dict.get("humor"),
            storytelling_style=temp_dict.get("storytelling_style"),
            vocabulary=temp_dict.get("vocabulary"),
            custom_tone_notes=temp_dict.get("custom_tone_notes"),
            primary_language=temp_dict["primary_language"],
            secondary_languages=temp_dict.get("secondary_languages", []),
            script_preference=temp_dict.get("script_preference"),
            platforms=temp_dict.get("platforms", []),
            preferred_duration=temp_dict.get("typical_duration"),
            preferred_aspect_ratio=temp_dict.get("preferred_aspect_ratio"),
            cta_style=temp_dict.get("cta_style"),
            secondary_cta_styles=temp_dict.get("secondary_cta_styles", []),
            content_goals=temp_dict.get("content_goals", []),
            brand_positioning=temp_dict.get("brand_positioning"),
            core_message=temp_dict.get("core_message"),
            words_to_use=temp_dict.get("words_to_use", []),
            words_to_avoid=temp_dict.get("words_to_avoid", []),
            style_rules=temp_dict.get("style_rules", []),
        )
    else:
        query = select(CreatorProfile).order_by(CreatorProfile.created_at.desc()).limit(1)
        result = await db.execute(query)
        profile = result.scalar_one_or_none()
        context = profile_to_persona_context(profile)

    provider = get_llm_provider()
    if isinstance(provider, GeminiLLMProvider):
        try:
            prompt = (
                f"You are the persona strategist for CINEHAI AI.\n"
                f"Creator Profile:\n"
                f"- Name: {context.creator_name} ({context.creator_type})\n"
                f"- Primary Niche: {context.primary_niche}\n"
                f"- Content Pillars: {', '.join(context.content_pillars) if context.content_pillars else 'General'}\n"
                f"- Target Audience: {context.target_audience} (Age: {context.target_audience_age or 'Mixed'})\n"
                f"- Tone & Energy: {context.tone} ({context.energy or 'Balanced'})\n"
                f"- Language: {context.primary_language}\n"
                f"- CTA Preference: {context.cta_style or 'Save'}\n"
                f"- Core Message: {context.core_message or 'Practical filmmaking'}\n\n"
                f"Respond ONLY with a valid JSON object matching this schema:\n"
                f"{{\n"
                f'  "summary": "2-sentence synthesis of who the creator is and their storytelling posture",\n'
                f'  "example_hook": "1 high-retention opening hook tailored strictly to their niche and language",\n'
                f'  "example_intro": "1 concise opening delivery establishing authority without filler",\n'
                f'  "example_cta": "1 authentic closing call to action matching their preferred style"\n'
                f"}}"
            )
            raw = await provider._generate_content(prompt)
            clean_json = raw.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            parsed = json.loads(clean_json.strip())

            return PersonaPreviewResponse(
                summary=parsed.get("summary", ""),
                example_hook=parsed.get("example_hook", ""),
                example_intro=parsed.get("example_intro", ""),
                example_cta=parsed.get("example_cta", ""),
                is_ai_generated=True,
            )
        except Exception as e:
            logger.warning(f"Gemini persona summary generation failed ({e}); using deterministic fallback.")

    return generate_deterministic_persona_preview(context)
