import uuid
import logging
from typing import Optional
from app.schemas.captions import (
    CaptionSource,
    TranscriptionResponse,
    TranscriptionResult,
)
from app.services.video_validator import validate_video_upload
from app.services.transcription_provider import get_transcription_provider

logger = logging.getLogger(__name__)


class CaptionService:
    """
    Core service orchestrating video validation, ingestion, and transcription.
    Keeps business logic decoupled from FastAPI route handlers.
    """

    def __init__(self, provider=None):
        self.provider = provider or get_transcription_provider()

    async def transcribe_video(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
        provider_type: Optional[str] = None,
    ) -> TranscriptionResponse:
        """
        Validate video file and transcribe audio into timed segments.
        Supports explicit provider selection ('mock' or 'production' / 'whisper').
        """
        # 1. Validate video container, extension, and file size (<= 100 MB)
        validation = validate_video_upload(
            file_bytes=video_bytes,
            filename=filename,
            declared_mime_type=mime_type,
        )

        # 2. Select requested provider (or default)
        active_provider = self.provider
        if provider_type:
            active_provider = get_transcription_provider(provider_type)

        # 3. Transcribe via active provider
        transcription: TranscriptionResult = await active_provider.transcribe(
            video_bytes=video_bytes,
            filename=validation.filename,
            language=language,
            duration_seconds=duration_seconds,
        )

        # 4. Create CaptionSource metadata (never exposing server internal file paths)
        caption_source = CaptionSource(
            source_type="video_upload",
            filename=validation.filename,
            file_size_bytes=validation.file_size_bytes,
            mime_type=validation.mime_type,
            duration_seconds=transcription.duration_seconds,
            metadata=validation.metadata,
        )

        project_id = f"proj_{uuid.uuid4().hex[:12]}"

        # Truthful notice behavior: only present in development/mock mode
        notice = None
        if not transcription.is_production_provider:
            notice = (
                "Development Transcription Mode — production speech-to-text provider is not configured. "
                "Transcription is simulated based on screenplay heuristics."
            )

        return TranscriptionResponse(
            project_id=project_id,
            caption_source=caption_source,
            transcription=transcription,
            notice=notice,
        )
