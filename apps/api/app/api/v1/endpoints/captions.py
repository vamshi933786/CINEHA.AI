import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.core.config import settings
from app.schemas.captions import (
    TranscriptionResponse,
    TranscriptionResult,
    LanguageProcessingRequest,
    LanguageProcessingResponse,
    LanguageProcessingResult,
    CaptionCueGenerationRequest,
    CaptionCueGenerationResponse,
)
from app.services.caption_service import CaptionService
from app.services.transcription_provider import (
    LANGUAGE_CONFIGS,
    is_production_transcription_configured,
)
from app.services.language_processor import (
    is_production_language_processor_configured,
    VALID_TRANSLATION_PAIRS,
    VALID_TRANSLITERATION_PAIRS,
)

logger = logging.getLogger(__name__)

router = APIRouter()
caption_service = CaptionService()


@router.get("/captions/languages", response_model=Dict[str, Any])
async def get_supported_caption_languages():
    """
    Return list of supported spoken languages and transliteration metadata.
    Exposes explicit details on Tanglish (Romanized Telugu) vs Native Telugu.
    """
    languages_list: List[Dict[str, Any]] = []
    for name, config in LANGUAGE_CONFIGS.items():
        languages_list.append({
            "name": name,
            "code": config["code"],
            "script": config["script"],
            "is_transliteration": config["is_transliteration"],
            "description": config["description"],
        })
    return {"languages": languages_list}


@router.get("/captions/language-pairs", response_model=Dict[str, Any])
async def get_supported_language_pairs():
    """
    Return supported language translation and transliteration pairs.
    Explicitly distinguishes translation from transliteration (Telugu -> Tanglish).
    """
    translation_pairs = [
        {"source": src, "target": tgt, "mode": "translation"}
        for src, tgt in sorted(VALID_TRANSLATION_PAIRS)
    ]
    transliteration_pairs = [
        {"source": src, "target": tgt, "mode": "transliteration"}
        for src, tgt in sorted(VALID_TRANSLITERATION_PAIRS)
    ]
    return {
        "translation_pairs": translation_pairs,
        "transliteration_pairs": transliteration_pairs,
        "supported_languages": list(LANGUAGE_CONFIGS.keys()),
    }


@router.get("/captions/providers", response_model=Dict[str, Any])
async def get_caption_providers():
    """
    Return available transcription and language processing providers and their configuration status.
    Exposes whether production credentials (Whisper/OpenAI) are configured.
    """
    is_transcription_configured = is_production_transcription_configured()
    is_language_configured = is_production_language_processor_configured()
    return {
        "default_provider": settings.TRANSCRIPTION_PROVIDER,
        "is_production_configured": is_transcription_configured,
        "is_production_language_configured": is_language_configured,
        "default_language_processor": settings.LANGUAGE_PROCESSOR_PROVIDER,
        "providers": [
            {
                "id": "mock",
                "name": "Development Mock",
                "is_production": False,
                "is_configured": True,
                "description": "Deterministic simulated screenplay cues for offline testing without cloud credentials",
            },
            {
                "id": "production",
                "name": "OpenAI Whisper",
                "is_production": True,
                "is_configured": is_transcription_configured,
                "description": "Production neural speech-to-text with word-level timestamps and multi-lingual audio extraction",
            },
        ],
        "language_processors": [
            {
                "id": "mock",
                "name": "Development Mock Language Processor",
                "is_production": False,
                "is_configured": True,
                "description": "Deterministic screenplay translation & phonetic Tanglish transliteration",
            },
            {
                "id": "production",
                "name": "OpenAI Language Engine (GPT-4o-mini)",
                "is_production": True,
                "is_configured": is_language_configured,
                "description": "Neural translation and Tanglish Romanized transliteration",
            },
        ],
    }


@router.post("/captions/transcribe", response_model=TranscriptionResponse)
async def transcribe_video(
    file: UploadFile = File(..., description="Video file (MP4, MOV, WebM up to 100MB)"),
    language: str = Form("English", description="Source spoken language (English, Telugu, Hindi, Tanglish)"),
    duration_seconds: Optional[float] = Form(None, description="Optional hinted duration in seconds"),
    provider: Optional[str] = Form(None, description="Optional provider override: 'mock' or 'production' / 'whisper'"),
):
    """
    Ingest and transcribe an uploaded video file.
    Validates container header, format, and 100MB size limit.
    Extracts audio stream and invokes selected provider (development mock or production Whisper).
    Returns normalized timed segments, word timings, and truthful provider status.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video file was uploaded.",
        )

    try:
        video_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded video stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded video file: {str(e)}",
        )

    return await caption_service.transcribe_video(
        video_bytes=video_bytes,
        filename=file.filename,
        mime_type=file.content_type,
        language=language,
        duration_seconds=duration_seconds,
        provider_type=provider,
    )


@router.post("/captions/process-language", response_model=LanguageProcessingResponse)
async def process_caption_language(payload: LanguageProcessingRequest):
    """
    Translate or transliterate timed transcript segments.
    Preserves exact segment start and end timestamps.
    Explicitly distinguishes translation from transliteration.
    """
    return await caption_service.process_language(payload)


@router.post("/captions/translate", response_model=LanguageProcessingResponse)
async def translate_captions(payload: LanguageProcessingRequest):
    """
    Translate timed transcript segments between supported languages.
    Ensures processing_mode is set to 'translation'.
    """
    payload.processing_mode = "translation"
    return await caption_service.process_language(payload)


@router.post("/captions/transliterate", response_model=LanguageProcessingResponse)
async def transliterate_captions(payload: LanguageProcessingRequest):
    """
    Transliterate timed transcript segments (e.g. Telugu script -> Tanglish Romanized script).
    Ensures processing_mode is set to 'transliteration'.
    """
    payload.processing_mode = "transliteration"
    return await caption_service.process_language(payload)


@router.post("/captions/generate-cues", response_model=CaptionCueGenerationResponse)
async def generate_caption_cues(payload: CaptionCueGenerationRequest):
    """
    Generate display-ready, synchronized caption cues from active transcript segments.
    Uses deterministic layout, word boundary, and timing rules without LLM.
    """
    return caption_service.generate_cues(payload)


