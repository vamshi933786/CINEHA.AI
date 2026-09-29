from abc import ABC, abstractmethod
import io
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from PIL import Image

logger = logging.getLogger(__name__)


class OCRResult(BaseModel):
    """Normalized OCR output contract."""
    extracted_text: str
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    lines: List[str] = Field(default_factory=list)
    words: List[Dict[str, Any]] = Field(default_factory=list)
    provider_name: str
    is_production: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class BaseOCRProvider(ABC):
    """Abstract OCR Provider boundary."""

    @abstractmethod
    async def extract_text(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
    ) -> OCRResult:
        """Extract text from image bytes."""
        pass


class MockDevelopmentOCRProvider(BaseOCRProvider):
    """
    Offline/Development OCR Provider.
    Inspects image properties via Pillow and produces high-quality simulated
    extracted screenplay text tailored to the selected language.
    Clearly marks that this is a development mock and not production cloud vision.
    """

    MOCK_SCRIPTS = {
        "English": (
            "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.\n\n"
            "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.\n\n"
            "Switch to 24fps, lock your shutter angle to 180 degrees, and add gentle directional lighting.\n\n"
            "Save this script before your next shoot!"
        ),
        "Telugu": (
            "మీరు 60fps లో షూట్ చేయడం ఆపేయండి! మీ మొబైల్ వీడియోలు సినిమాటిక్ గా రావాలంటే ఈ ఒక్క సెట్టింగ్ మార్చండి.\n\n"
            "60fps వల్ల మోషన్ బ్లర్ పోయి వీడియో ఆర్టిఫిషియల్ గా కనిపిస్తుంది.\n\n"
            "24fps కి మారి 180 డిగ్రీల షట్టర్ రూల్ ఫాలో అవ్వండి. బ్యాక్‌గ్రౌండ్ లో వార్మ్ లైట్ వేయండి.\n\n"
            "మీ తర్వాతి షూట్ కోసం ఈ టిప్ ఇప్పుడే సేవ్ చేసుకోండి!"
        ),
        "Tanglish": (
            "Stop shooting at 60fps! Phone footage lo cinema feel kavali ante ee 1-second setting marchandi.\n\n"
            "60fps valla artificial soap-opera look vastundi, zero motion blur.\n\n"
            "Switch to 24fps and 180 degree shutter angle lock cheyandi. Diffused key light add cheyandi.\n\n"
            "Mee next video shoot kosam ee secret ni save cheskondi!"
        ),
    }

    async def extract_text(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
    ) -> OCRResult:
        if not image_bytes or len(image_bytes) == 0:
            return OCRResult(
                extracted_text="",
                confidence=0.0,
                provider_name="heuristic_dev_ocr",
                is_production=False,
                error="Image bytes are empty.",
            )

        # Validate with Pillow
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            # Reopen to read dimensions since verify() closes/invalidates the image stream
            img_probe = Image.open(io.BytesIO(image_bytes))
            width, height = img_probe.size
            img_format = img_probe.format or "UNKNOWN"
        except Exception as e:
            logger.warning(f"Invalid image file provided to OCR: {e}")
            return OCRResult(
                extracted_text="",
                confidence=0.0,
                provider_name="heuristic_dev_ocr",
                is_production=False,
                error=f"Unreadable or corrupted image file: {str(e)}",
            )

        selected_text = self.MOCK_SCRIPTS.get(language, self.MOCK_SCRIPTS["English"])
        lines = [line.strip() for line in selected_text.split("\n") if line.strip()]
        words = []
        for line in lines:
            for w in line.split():
                words.append({"word": w, "confidence": 0.94})

        return OCRResult(
            extracted_text=selected_text,
            confidence=0.92,
            lines=lines,
            words=words,
            provider_name="heuristic_dev_ocr",
            is_production=False,
            metadata={
                "image_width": width,
                "image_height": height,
                "image_format": img_format,
                "filename": filename or "unknown",
                "language_hint": language,
                "note": "Development OCR Mode (mock/heuristic) — No production cloud vision API is configured.",
            },
        )


class TesseractOCRProvider(BaseOCRProvider):
    """
    Local Tesseract OCR Provider.
    Attempts to use pytesseract if installed, falling back cleanly to MockDevelopmentOCRProvider.
    """

    def __init__(self):
        self._fallback = MockDevelopmentOCRProvider()

    async def extract_text(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
    ) -> OCRResult:
        try:
            import pytesseract  # type: ignore
            image = Image.open(io.BytesIO(image_bytes))
            lang_code = "tel" if language == "Telugu" else "eng"
            text = pytesseract.image_to_string(image, lang=lang_code)
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            return OCRResult(
                extracted_text=text.strip(),
                confidence=0.88,
                lines=lines,
                provider_name="tesseract_local",
                is_production=True,
                metadata={"filename": filename, "language": language},
            )
        except Exception as e:
            logger.info(f"Tesseract unavailable ({e}), using mock development provider.")
            res = await self._fallback.extract_text(image_bytes, filename, language)
            res.metadata["tesseract_fallback_reason"] = str(e)
            return res


def get_ocr_provider() -> BaseOCRProvider:
    """Factory to retrieve configured OCR provider."""
    # Production cloud vision or local tesseract can be configured here via settings
    return MockDevelopmentOCRProvider()
