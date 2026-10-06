from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from app.schemas.extraction import VideoURLScriptExtraction


class BaseVideoURLProvider(ABC):
    """Abstract interface defining platform-specific video URL extraction."""

    @abstractmethod
    def can_handle(self, platform: str) -> bool:
        """Return True if this adapter supports the given platform."""
        pass

    @abstractmethod
    async def extract_script(
        self,
        url: str,
        video_id: str,
        target_language: str,
        temp_dir: str,
    ) -> VideoURLScriptExtraction:
        """
        Extracts transcript/script from video URL.
        Guarantees isolation to temp_dir and returns normalized VideoURLScriptExtraction.
        """
        pass
