import json
import re
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from app.core.config import settings
from app.schemas.captions import (
    TranscriptionResponse,
    TranscriptionResult,
    LanguageProcessingRequest,
    LanguageProcessingResponse,
    LanguageProcessingResult,
    CaptionCue,
    CaptionCueGenerationRequest,
    CaptionCueGenerationResponse,
    CaptionRenderOptions,
    CaptionRenderResult,
    CaptionRenderResponse,
    CaptionPipelineResponse,
)
from app.services.caption_service import CaptionService
from app.services.caption_renderer import (
    UnicodeFontNotFoundError,
    InvalidCaptionTimingError,
    CaptionRenderError,
)
from app.services.audio_extractor import (
    FFmpegNotFoundError,
    NoAudioTrackError,
    AudioExtractionError,
)
from app.services.transcription_provider import (
    LANGUAGE_CONFIGS,
    is_production_transcription_configured,
    is_local_whisper_available,
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
    Exposes Local Whisper, OpenAI Whisper, and Development Mock statuses.
    """
    is_transcription_configured = is_production_transcription_configured()
    is_local_configured = is_local_whisper_available()
    is_language_configured = is_production_language_processor_configured()
    return {
        "default_provider": settings.TRANSCRIPTION_PROVIDER,
        "is_production_configured": is_transcription_configured,
        "is_local_whisper_configured": is_local_configured,
        "is_production_language_configured": is_language_configured,
        "default_language_processor": settings.LANGUAGE_PROCESSOR_PROVIDER,
        "providers": [
            {
                "id": "local_whisper",
                "name": "Local Whisper",
                "is_production": True,
                "is_configured": is_local_configured,
                "description": "Free on-device neural speech-to-text with word-level timestamps and Apple Silicon acceleration",
            },
            {
                "id": "production",
                "name": "OpenAI Whisper",
                "is_production": True,
                "is_configured": is_transcription_configured,
                "description": "Cloud neural speech-to-text with word-level timestamps and multi-lingual audio extraction",
            },
            {
                "id": "mock",
                "name": "Development Mock",
                "is_production": False,
                "is_configured": True,
                "description": "Deterministic simulated screenplay cues for offline testing without local models or cloud credentials",
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
    provider: Optional[str] = Form(None, description="Optional provider override: 'local_whisper', 'production', or 'mock'"),
):
    """
    Ingest and transcribe an uploaded video file.
    Validates container header, format, and 100MB size limit.
    Extracts audio stream and invokes selected provider (Local Whisper, production OpenAI Whisper, or development mock).
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

    try:
        return await caption_service.transcribe_video(
            video_bytes=video_bytes,
            filename=file.filename,
            mime_type=file.content_type,
            language=language,
            duration_seconds=duration_seconds,
            provider_type=provider,
        )
    except NoAudioTrackError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except AudioExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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


@router.post("/captions/generate", response_model=CaptionPipelineResponse)
async def generate_captions(
    file: UploadFile = File(..., description="Video file (MP4, MOV, WebM up to 100MB)"),
    language: str = Form("English", description="Target caption language: English, Telugu, or Tanglish"),
    duration_seconds: Optional[float] = Form(None, description="Optional hinted duration in seconds"),
    provider: Optional[str] = Form(None, description="Optional provider override: 'mock' or 'production'"),
):
    """
    Unified end-to-end caption generation pipeline:
    Upload Video -> Transcribe Speech -> Language Processing -> Synchronized Cues directly over video.
    Supports English, Telugu (తెలుగు), and Tanglish.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video file was uploaded.",
        )

    valid_languages = {"English", "Telugu", "Tanglish"}
    if language not in valid_languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported caption language: '{language}'. Supported options: English, Telugu, Tanglish.",
        )

    try:
        video_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded video stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded video file: {str(e)}",
        )

    try:
        return await caption_service.generate_captions_pipeline(
            video_bytes=video_bytes,
            filename=file.filename,
            mime_type=file.content_type,
            language=language,
            duration_seconds=duration_seconds,
            provider_type=provider,
        )
    except NoAudioTrackError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except AudioExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/captions/render", response_model=CaptionRenderResponse)
async def render_captioned_video(
    file: UploadFile = File(..., description="Source video file to burn captions into"),
    cues: str = Form(..., description="JSON-serialized array of CaptionCue objects"),
    language: str = Form("English", description="Caption language: English, Telugu, or Tanglish"),
    preset: str = Form("clean_pop", description="Caption styling preset: clean_pop, karaoke, bold_bounce, minimal_fade, punchy"),
    options: Optional[str] = Form(None, description="Optional JSON-serialized CaptionRenderOptions"),
):
    """
    Burn captions permanently into the uploaded video using FFmpeg.
    Supports Unicode fonts for Telugu and Latin fonts for English/Tanglish.
    Returns render metadata and secure download URL.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video file was uploaded for rendering.",
        )

    # 1. Parse and validate caption cues JSON
    try:
        raw_cues = json.loads(cues)
        if not isinstance(raw_cues, list) or len(raw_cues) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one caption cue is required for video rendering.",
            )
        parsed_cues = [CaptionCue(**item) for item in raw_cues]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Invalid caption cues payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid caption cues data format: {str(e)}",
        )

    # 2. Parse optional rendering options JSON
    render_options = None
    if options:
        try:
            raw_options = json.loads(options)
            render_options = CaptionRenderOptions(**raw_options)
        except Exception as e:
            logger.warning(f"Could not parse custom render options ({e}), falling back to preset defaults.")
            render_options = CaptionRenderOptions(preset=preset)
    else:
        render_options = CaptionRenderOptions(preset=preset)

    # 3. Read video file bytes
    try:
        video_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded video stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded video file: {str(e)}",
        )

    # 4. Execute rendering via service
    try:
        result = await caption_service.render_captions(
            video_bytes=video_bytes,
            cues=parsed_cues,
            language=language,
            options=render_options,
            filename=file.filename,
        )
        return CaptionRenderResponse(
            result=result,
            notice="Captioned video ready for download.",
        )
    except UnicodeFontNotFoundError as e:
        logger.error(f"Unicode font error during caption rendering: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except InvalidCaptionTimingError as e:
        logger.error(f"Invalid caption timing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FFmpegNotFoundError as e:
        logger.error(f"FFmpeg not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except CaptionRenderError as e:
        logger.error(f"Caption rendering failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected rendering error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Caption rendering encountered an unexpected failure: {str(e)}",
        )


@router.get("/captions/render/{render_id}/download")
async def download_rendered_video(render_id: str):
    """
    Securely download rendered MP4 video with burned-in captions.
    Validates UUID format to protect against path traversal attacks.
    """
    # UUID validation
    if not re.match(r"^[0-9a-fA-F\-]{32,40}$", render_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid render identifier format.",
        )

    file_info = caption_service.get_rendered_video_path(render_id)
    if not file_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested captioned video was not found or has expired.",
        )

    filepath, filename = file_info
    return FileResponse(
        path=filepath,
        media_type="video/mp4",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


