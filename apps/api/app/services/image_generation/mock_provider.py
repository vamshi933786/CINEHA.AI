import io
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw
from app.services.image_generation.base import (
    BaseImageGenerationProvider,
    ImageGenerationResult,
)


class MockImageGenerationProvider(BaseImageGenerationProvider):
    """
    Mock image generation provider for unit tests and local mock mode.
    Generates deterministic, valid PNG images locally without external network calls.
    """

    def __init__(self, model_name: str = "mock-image-v1"):
        self.model_name = model_name

    def is_configured(self) -> bool:
        return True

    def get_provider_name(self) -> str:
        return "mock"

    def get_model_name(self) -> str:
        return self.model_name

    async def generate_image(
        self, prompt: str, settings: Optional[Dict[str, Any]] = None
    ) -> ImageGenerationResult:
        settings = settings or {}
        aspect_ratio = settings.get("aspect_ratio", "9:16")
        style = settings.get("style", "Clean Educational")

        if aspect_ratio == "1:1":
            width, height = 1024, 1024
        elif aspect_ratio == "16:9":
            width, height = 1280, 720
        else:
            # 9:16 default
            width, height = 720, 1280

        # Generate sleek slate visual canvas with subtle gradient accents
        img = Image.new("RGB", (width, height), color=(15, 23, 42))  # slate-900
        draw = ImageDraw.Draw(img)

        # Draw framing accent borders and central illustration box
        pad = int(min(width, height) * 0.08)
        draw.rectangle(
            [(pad, pad), (width - pad, height - pad)],
            outline=(56, 189, 248),  # sky-400
            width=3,
        )

        inner_pad = pad + 20
        draw.rectangle(
            [(inner_pad, inner_pad), (width - inner_pad, height - inner_pad)],
            outline=(99, 102, 241),  # indigo-500
            width=2,
        )

        # Draw a modern circular lens / infographic graphic in the center
        center_x = width // 2
        center_y = height // 2
        radius = int(min(width, height) * 0.22)
        draw.ellipse(
            [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
            outline=(236, 72, 153),  # pink-500
            width=4,
        )

        # Draw cross lines / grid
        draw.line([(center_x - radius, center_y), (center_x + radius, center_y)], fill=(71, 85, 105), width=2)
        draw.line([(center_x, center_y - radius), (center_x, center_y + radius)], fill=(71, 85, 105), width=2)

        # Watermark/Label text
        label_text = f"CINEHA.AI • {style.upper()} • {aspect_ratio}"
        draw.text((pad + 25, pad + 25), label_text, fill=(248, 250, 252))

        # Save to PNG buffer
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        image_bytes = buffer.getvalue()

        return ImageGenerationResult(
            image_bytes=image_bytes,
            mime_type="image/png",
            provider="mock",
            model=self.model_name,
            width=width,
            height=height,
            revised_prompt=prompt,
        )
