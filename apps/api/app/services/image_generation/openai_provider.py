import base64
import httpx
from typing import Dict, Any, Optional
from app.services.image_generation.base import (
    BaseImageGenerationProvider,
    ImageGenerationResult,
    ImageGenerationError,
)


class OpenAIImageGenerationProvider(BaseImageGenerationProvider):
    """
    OpenAI DALL-E image generation provider (DALL-E 3 / DALL-E 2).
    """

    def __init__(self, api_key: str, model_name: str = "dall-e-3"):
        self.api_key = api_key.strip()
        self.model_name = model_name or "dall-e-3"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_provider_name(self) -> str:
        return "openai"

    def get_model_name(self) -> str:
        return self.model_name

    def _map_dimensions(self, aspect_ratio: str) -> tuple[str, int, int]:
        """Maps aspect ratio to supported DALL-E 3 dimensions."""
        if aspect_ratio == "1:1":
            return "1024x1024", 1024, 1024
        elif aspect_ratio == "16:9":
            return "1792x1024", 1792, 1024
        else:
            # 9:16
            return "1024x1792", 1024, 1792

    async def generate_image(
        self, prompt: str, settings: Optional[Dict[str, Any]] = None
    ) -> ImageGenerationResult:
        if not self.is_configured():
            raise ImageGenerationError("OpenAI API key is missing or not configured.")

        settings = settings or {}
        aspect_ratio = settings.get("aspect_ratio", "9:16")
        size_str, width, height = self._map_dimensions(aspect_ratio)

        url = "https://api.openai.com/v1/images/generations"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        body: Dict[str, Any] = {
            "model": self.model_name,
            "prompt": prompt[:1000],  # safety length bound
            "n": 1,
            "size": size_str,
            "response_format": "b64_json",
        }

        if self.model_name == "dall-e-3":
            # DALL-E 3 quality setting
            body["quality"] = "standard"

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                if resp.status_code != 200:
                    err_msg = f"OpenAI image generation returned {resp.status_code}"
                    try:
                        err_json = resp.json()
                        if "error" in err_json and "message" in err_json["error"]:
                            err_msg = err_json["error"]["message"]
                    except Exception:
                        pass
                    raise ImageGenerationError(err_msg)

                data = resp.json()
                image_data = data["data"][0]
                revised_prompt = image_data.get("revised_prompt", prompt)

                if "b64_json" in image_data:
                    image_bytes = base64.b64decode(image_data["b64_json"])
                elif "url" in image_data:
                    img_resp = await client.get(image_data["url"])
                    if img_resp.status_code != 200:
                        raise ImageGenerationError("Failed to download generated image from provider URL.")
                    image_bytes = img_resp.content
                else:
                    raise ImageGenerationError("No image data found in provider response.")

                return ImageGenerationResult(
                    image_bytes=image_bytes,
                    mime_type="image/png",
                    provider="openai",
                    model=self.model_name,
                    width=width,
                    height=height,
                    revised_prompt=revised_prompt,
                )
        except ImageGenerationError:
            raise
        except Exception as e:
            raise ImageGenerationError(f"Image generation request failed: {str(e)}")
