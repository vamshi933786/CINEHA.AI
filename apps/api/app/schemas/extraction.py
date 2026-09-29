from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class NormalizedScriptResponse(BaseModel):
    """Normalized Script representation contract across all input formats."""
    model_config = ConfigDict(extra="forbid")

    source_type: Literal["text", "pdf", "docx", "image"] = Field(
        ..., description="Format origin: text, pdf, docx, or image"
    )
    text: str = Field(..., min_length=1, description="Normalized script text")
    original_file_name: Optional[str] = Field(default=None, description="Original filename if uploaded")
    language: str = Field(default="English", description="Script language: English, Telugu, or Tanglish")
    extraction_method: str = Field(..., description="Method: direct_input, pypdf, openxml, ocr")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Extraction confidence score")
    provider_name: str = Field(default="native", description="Provider used for extraction or OCR")
    is_production_ocr: bool = Field(default=False, description="Whether production OCR was utilized")
    character_count: int = Field(..., ge=0, description="Total characters in extracted text")
    word_count: int = Field(..., ge=0, description="Total words in extracted text")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional extraction metadata")


class TextExtractionRequest(BaseModel):
    """Payload for text normalization without file upload."""
    model_config = ConfigDict(extra="forbid")

    text: str = Field(..., min_length=1, description="Raw script text to normalize")
    language: Optional[str] = Field(default="English", description="Target language: English, Telugu, or Tanglish")


class SaveImportedScriptRequest(BaseModel):
    """Payload for saving an imported normalized script into Script Studio."""
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=1, max_length=200, description="Script title")
    text: str = Field(..., min_length=1, description="Normalized script text")
    topic: Optional[str] = Field(default=None, max_length=500, description="Optional topic or concept")
    platform: Optional[str] = Field(default="Instagram Reels", description="Target platform")
    language: Optional[str] = Field(default="English", description="Script language")
    duration_seconds: Optional[int] = Field(default=30, ge=5, le=180, description="Duration in seconds")
