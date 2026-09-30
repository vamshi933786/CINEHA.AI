import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.core.config import settings
from app.schemas.captions import (
    TranscriptionResponse,
    TranscriptionResult,
)
from app.services.caption_service import CaptionService
from app.services.transcription_provider import (
    LANGUAGE_CONFIGS,
    is_production_transcription_configured,
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


@router.get("/captions/providers", response_model=Dict[str, Any])
async def get_caption_providers():
    """
    Return available transcription providers and their configuration status.
    Exposes whether production credentials (Whisper/OpenAI) are configured.
    """
    is_configured = is_production_transcription_configured()
    return {
        "default_provider": settings.TRANSCRIPTION_PROVIDER,
        "is_production_configured": is_configured,
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
                "is_configured": is_configured,
                "description": "Production neural speech-to-text with word-level timestamps and multi-lingual audio extraction",
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
