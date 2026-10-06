from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthResponse

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="API Health Check",
    description="Returns API status, database connectivity, and configuration parameters.",
)
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    # Verify database connectivity
    db_status = "connected"
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
    except Exception as e:
        logger.warning(f"Database health check connection failure: {e}")
        db_status = "unavailable"

    gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
        active_provider=settings.AI_PROVIDER,
        max_video_size_mb=settings.MAX_VIDEO_SIZE_MB,
        timestamp=datetime.now(timezone.utc),
        gemini_configured=gemini_configured,
        gemini_model=settings.GEMINI_MODEL if gemini_configured else "",
    )


from app.services.transcription_provider import is_local_whisper_available

@router.get(
    "/health/providers",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Safe AI Provider Diagnostics",
    description="Returns non-sensitive configuration and capability diagnostics for AI providers without exposing keys.",
)
async def check_providers_diagnostic() -> Dict[str, Any]:
    gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    selected_llm = (
        "GeminiLLMProvider"
        if settings.AI_PROVIDER == "gemini" and gemini_configured
        else "OfflineHeuristicMockProvider"
    )
    return {
        "active_provider": settings.AI_PROVIDER,
        "selected_llm_provider": selected_llm,
        "gemini": {
            "configured": gemini_configured,
            "model": settings.GEMINI_MODEL,
            "provider_class": "GeminiLLMProvider",
            "supported_features": [
                "hook_generator",
                "script_generator",
                "retention_analyzer",
                "script_optimizer",
            ],
            "fallback_provider": "OfflineHeuristicMockProvider",
        },
        "local_whisper": {
            "available": is_local_whisper_available(),
            "model": settings.LOCAL_WHISPER_MODEL,
            "provider_class": "LocalWhisperTranscriptionProvider",
        },
        "caption_transcription": {
            "active_provider": settings.TRANSCRIPTION_PROVIDER,
            "model": settings.WHISPER_MODEL,
            "configured": bool(settings.WHISPER_API_KEY or settings.OPENAI_API_KEY),
            "engine": "OpenAI Whisper (speech-to-text + genuine acoustic timestamps)",
        },
    }
