from typing import Dict, Any, Optional
from pydantic import BaseModel


class ImageGenerationResult(BaseModel):
    """Result returned by an image generation provider."""
    image_bytes: bytes
    mime_type: str = "image/png"
    provider: str
    model: str
    width: int
    height: int
    revised_prompt: Optional[str] = None


class ProviderNotConfiguredError(Exception):
    """Raised when attempting image generation without a configured provider."""
    pass


class ImageGenerationError(Exception):
    """Raised when image generation fails."""
    pass


class BaseImageGenerationProvider:
    """Abstract base class for AI image generation providers."""

    def is_configured(self) -> bool:
        """Return True if this provider is properly configured and ready to generate."""
        raise NotImplementedError

    def get_provider_name(self) -> str:
        """Return provider identifier."""
        raise NotImplementedError

    def get_model_name(self) -> str:
        """Return model identifier."""
        raise NotImplementedError

    async def generate_image(
        self, prompt: str, settings: Optional[Dict[str, Any]] = None
    ) -> ImageGenerationResult:
        """Generate an image from the text prompt and settings."""
        raise NotImplementedError
