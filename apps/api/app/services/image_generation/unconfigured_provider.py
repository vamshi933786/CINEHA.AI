from typing import Dict, Any, Optional
from app.services.image_generation.base import (
    BaseImageGenerationProvider,
    ImageGenerationResult,
    ProviderNotConfiguredError,
)


class UnconfiguredImageGenerationProvider(BaseImageGenerationProvider):
    """Fallback provider when no production image generation provider is configured."""

    def __init__(self, provider_name: str = "unconfigured", model_name: str = "none"):
        self.provider_name = provider_name
        self.model_name = model_name

    def is_configured(self) -> bool:
        return False

    def get_provider_name(self) -> str:
        return self.provider_name

    def get_model_name(self) -> str:
        return self.model_name

    async def generate_image(
        self, prompt: str, settings: Optional[Dict[str, Any]] = None
    ) -> ImageGenerationResult:
        raise ProviderNotConfiguredError("Image generation provider is not configured.")
