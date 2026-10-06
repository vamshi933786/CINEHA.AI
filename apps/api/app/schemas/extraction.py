from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class NormalizedScriptResponse(BaseModel):
    """Normalized Script representation contract across all input formats."""
    model_config = ConfigDict(extra="ignore")

    source_type: Literal["text", "pdf", "docx", "image", "video_url"] = Field(
        ..., description="Format origin: text, pdf, docx, image, or video_url"
    )
    text: str = Field(..., min_length=1, description="Normalized script text")
    original_file_name: Optional[str] = Field(default=None, description="Original filename or title")
    language: str = Field(default="English", description="Script language: English, Telugu, or Tanglish")
    extraction_method: str = Field(..., description="Method: direct_input, pypdf, openxml, ocr, official_transcript, local_whisper, hybrid_restoration")
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


class VideoURLExtractionRequest(BaseModel):
    """Payload for video URL script extraction."""
    model_config = ConfigDict(extra="forbid")

    url: str = Field(..., min_length=1, description="YouTube or Instagram video URL")
    language: Optional[str] = Field(default="English", description="Target language: English, Telugu, or Tanglish")


class VideoURLScriptExtraction(BaseModel):
    """Normalized output contract for YouTube and Instagram video URL script extraction."""
    model_config = ConfigDict(extra="ignore")

    source_url: str = Field(..., description="Original video URL")
    platform: Literal["YouTube", "Instagram"] = Field(..., description="Detected video platform")
    video_id: Optional[str] = Field(default=None, description="Extracted video ID or shortcode")
    title: Optional[str] = Field(default=None, description="Original video title")
    creator_name: Optional[str] = Field(default=None, description="Creator handle or channel name")
    description: Optional[str] = Field(default=None, description="Original video description")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Video duration in seconds")
    language: str = Field(default="English", description="Language of transcript: English, Telugu, Tanglish")
    transcript: str = Field(..., description="Full spoken script text")
    segments: List[Dict[str, Any]] = Field(default_factory=list, description="Time-coded script segments with timestamps")
    extraction_method: Literal["official_transcript", "public_caption", "local_whisper", "hybrid_restoration"] = Field(
        ..., description="Method used to obtain transcript"
    )
    transcription_provider: str = Field(..., description="Underlying provider: youtube_transcript_api, local_whisper, etc.")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Transcription confidence")
    source_type: Literal["video_url"] = Field(default="video_url", description="Origin source type")
    warnings: List[str] = Field(default_factory=list, description="Any warnings or caveats during extraction")


class GenerateScriptFromURLRequest(BaseModel):
    """Payload to generate a brand new CINEHAI screenplay from an extracted video script."""
    model_config = ConfigDict(extra="forbid")

    url: str = Field(..., min_length=1, description="Original source video URL")
    extracted_text: str = Field(..., min_length=1, description="Original spoken transcript text")
    original_video_title: Optional[str] = Field(default=None, max_length=255, description="Original video title")
    platform: Optional[str] = Field(default="Instagram Reels", description="Target distribution platform")
    language: Optional[str] = Field(default="English", description="Target language: English, Telugu, Tanglish")
    duration_seconds: Optional[int] = Field(default=30, ge=15, le=120, description="Target duration in seconds")
    goal: str = Field(
        default="Rewrite",
        description="Rewrite goal: Rewrite, Improve Hook, Improve Retention, Shorter Version, Longer Version, New Angle, Educational Version, Storytelling Version, Creator-Style Rewrite"
    )
    instructions: Optional[str] = Field(default=None, max_length=1000, description="Custom creative directives")
    profile_id: Optional[str] = Field(default=None, description="Creator profile UUID")


class SaveImportedScriptRequest(BaseModel):
    """Payload for saving an imported normalized script into Script Studio."""
    model_config = ConfigDict(extra="ignore")

    title: str = Field(..., min_length=1, max_length=200, description="Script title")
    text: str = Field(..., min_length=1, description="Normalized script text")
    topic: Optional[str] = Field(default=None, max_length=500, description="Optional topic or concept")
    platform: Optional[str] = Field(default="Instagram Reels", description="Target platform")
    language: Optional[str] = Field(default="English", description="Script language")
    duration_seconds: Optional[int] = Field(default=30, ge=5, le=180, description="Duration in seconds")
    source_type: Optional[str] = Field(default="text", description="Origin format: text, pdf, docx, image, video_url")
    source_url: Optional[str] = Field(default=None, description="Original URL if source was video_url")
    source_platform: Optional[str] = Field(default=None, description="Platform if source was video_url (YouTube, Instagram)")
    original_video_title: Optional[str] = Field(default=None, description="Original video title")
    extraction_method: Optional[str] = Field(default=None, description="Extraction method used")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata dictionary")
