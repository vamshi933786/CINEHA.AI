import os
import shutil
import tempfile
import logging
from typing import Optional, List
from fastapi import HTTPException, status

from app.schemas.extraction import VideoURLScriptExtraction
from app.services.video_url_validator import validate_and_normalize_video_url
from app.services.video_url.base_provider import BaseVideoURLProvider
from app.services.video_url.youtube_provider import YouTubeVideoURLProvider
from app.services.video_url.instagram_provider import InstagramVideoURLProvider

logger = logging.getLogger(__name__)


class VideoURLExtractionService:
    """Unified service coordinating video URL validation and transcript extraction."""

    def __init__(self, providers: Optional[List[BaseVideoURLProvider]] = None):
        self.providers = providers or [
            YouTubeVideoURLProvider(),
            InstagramVideoURLProvider(),
        ]

    async def extract_from_url(
        self,
        url: str,
        language: Optional[str] = "English",
    ) -> VideoURLScriptExtraction:
        """
        Validates URL, prevents SSRF, and delegates to the appropriate platform provider.
        Raw media is strictly contained within an ephemeral TemporaryDirectory.
        """
        # 1. SSRF check & normalization
        normalized_url, platform, video_id = validate_and_normalize_video_url(url)

        # 2. Find provider
        provider = next((p for p in self.providers if p.can_handle(platform)), None)
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Platform '{platform}' is not supported. Supported platforms: YouTube, Instagram.",
            )

        # 3. Isolated temp directory for ephemeral extraction
        temp_dir = tempfile.mkdtemp(prefix=f"cineha_url_{platform.lower()}_")
        try:
            target_lang = language or "English"
            result = await provider.extract_script(
                url=normalized_url,
                video_id=video_id,
                target_language=target_lang,
                temp_dir=temp_dir,
            )
            return result
        finally:
            # Complete cleanup of temporary storage
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory {temp_dir}: {e}")


# Singleton instance
_extraction_service: Optional[VideoURLExtractionService] = None


def get_video_url_extraction_service() -> VideoURLExtractionService:
    global _extraction_service
    if _extraction_service is None:
        _extraction_service = VideoURLExtractionService()
    return _extraction_service
