from app.core.config import settings
from app.services.image_generation.base import (
    BaseImageGenerationProvider,
    ImageGenerationResult,
    ProviderNotConfiguredError,
    ImageGenerationError,
)
from app.services.image_generation.mock_provider import MockImageGenerationProvider
from app.services.image_generation.unconfigured_provider import UnconfiguredImageGenerationProvider
from app.services.image_generation.openai_provider import OpenAIImageGenerationProvider


def get_image_generation_provider() -> BaseImageGenerationProvider:
    """Factory to retrieve the active image generation provider based on settings."""
    provider_type = (settings.IMAGE_PROVIDER or "unconfigured").strip().lower()

    if provider_type == "mock":
        return MockImageGenerationProvider(model_name=settings.IMAGE_MODEL or "mock-image-v1")

    if provider_type in ("openai", "dall-e", "dall-e-3"):
        api_key = (settings.IMAGE_GENERATION_API_KEY or settings.OPENAI_API_KEY or "").strip()
        if api_key:
            return OpenAIImageGenerationProvider(
                api_key=api_key,
                model_name=settings.IMAGE_MODEL or "dall-e-3",
            )
        return UnconfiguredImageGenerationProvider(
            provider_name="openai",
            model_name=settings.IMAGE_MODEL or "dall-e-3",
        )

    return UnconfiguredImageGenerationProvider(
        provider_name=provider_type,
        model_name=settings.IMAGE_MODEL or "none",
    )


__all__ = [
    "BaseImageGenerationProvider",
    "ImageGenerationResult",
    "ProviderNotConfiguredError",
    "ImageGenerationError",
    "MockImageGenerationProvider",
    "UnconfiguredImageGenerationProvider",
    "OpenAIImageGenerationProvider",
    "get_image_generation_provider",
]
