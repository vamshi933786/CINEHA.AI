from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class CaptionSource(BaseModel):
    """Represents the origin video/audio file ingested into Caption Studio."""
    model_config = ConfigDict(extra="ignore")

    source_type: Literal["video_upload", "audio_upload", "youtube_url", "custom_storage"] = Field(
        default="video_upload", description="Type of source asset"
    )
    filename: Optional[str] = Field(default=None, description="Original filename")
    file_size_bytes: Optional[int] = Field(default=None, ge=0, description="Size in bytes")
    mime_type: Optional[str] = Field(default=None, description="Detected or declared MIME type")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Duration in seconds if probed")
    storage_path: Optional[str] = Field(default=None, description="Internal storage identifier (redacted)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Video container/probe metadata")


class TranscriptWord(BaseModel):
    """Individual word with precise micro-timestamps."""
    model_config = ConfigDict(extra="ignore")

    text: str = Field(..., description="Single word token")
    start_time: float = Field(..., ge=0.0, description="Word start time in seconds")
    end_time: float = Field(..., ge=0.0, description="Word end time in seconds")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Word confidence score")


class TranscriptSegment(BaseModel):
    """Timed speech segment containing sentence/phrase and optional word-level timings."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique segment identifier (e.g. seg_0, seg_1)")
    text: str = Field(..., description="Segment transcript text")
    start_time: float = Field(..., ge=0.0, description="Segment start timestamp in seconds")
    end_time: float = Field(..., ge=0.0, description="Segment end timestamp in seconds")
    words: List[TranscriptWord] = Field(default_factory=list, description="Word-level timestamps if available")
    speaker: Optional[str] = Field(default=None, description="Identified speaker token if diarized")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Segment confidence score")


class TranscriptionResult(BaseModel):
    """Normalized speech-to-text transcript contract across all providers."""
    model_config = ConfigDict(extra="ignore")

    language: str = Field(default="English", description="Source spoken language (English, Telugu, Hindi, Tanglish)")
    language_code: Optional[str] = Field(default="en", description="Standard language tag (e.g. en, te, hi, te-Latn)")
    is_transliteration: bool = Field(default=False, description="True if script is Romanized/transliterated (e.g. Tanglish)")
    script_type: str = Field(default="Latin", description="Writing script (Latin, Telugu, Devanagari)")
    segments: List[TranscriptSegment] = Field(default_factory=list, description="Ordered timed segments")
    full_text: str = Field(..., description="Complete combined transcript text")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Total audio/video duration")
    provider_name: str = Field(..., description="Transcription provider identifier")
    is_production_provider: bool = Field(default=False, description="Whether a live production speech engine was used")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Overall transcript confidence")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic and provider metadata")


class CaptionCue(BaseModel):
    """Downstream caption cue consumed by styling and motion graphic rendering engines."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique cue ID")
    segment_id: str = Field(..., description="Parent segment ID")
    start_time: float = Field(..., ge=0.0, description="Cue start timestamp")
    end_time: float = Field(..., ge=0.0, description="Cue end timestamp")
    text: str = Field(..., description="Visible caption phrase or word")
    words: List[TranscriptWord] = Field(default_factory=list, description="Word-level timings within cue")
    position: Optional[Dict[str, Any]] = Field(default=None, description="Spatial position/alignment on screen")
    style: Optional[Dict[str, Any]] = Field(default=None, description="Visual typography & animation attributes")


class CaptionProject(BaseModel):
    """Comprehensive domain project contract for Caption Studio."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique caption project ID")
    title: str = Field(..., description="User-facing project title")
    source_video: Optional[CaptionSource] = Field(default=None, description="Ingested video source metadata")
    transcription: Optional[TranscriptionResult] = Field(default=None, description="Active transcription result")
    source_language: str = Field(default="English", description="Primary spoken language")
    target_languages: List[str] = Field(default_factory=list, description="Future multi-language targets")
    caption_style: Optional[str] = Field(default=None, description="Selected visual caption style preset")
    caption_mode: Optional[str] = Field(default="standard", description="Caption mode: standard, kinetic, burned_in")
    export_state: Optional[Dict[str, Any]] = Field(default=None, description="Rendering/export status tracking")
    created_at: Optional[str] = Field(default=None, description="ISO timestamp of creation")
    updated_at: Optional[str] = Field(default=None, description="ISO timestamp of last update")


class TranscriptionResponse(BaseModel):
    """HTTP response contract for video transcription API."""
    model_config = ConfigDict(extra="ignore")

    project_id: str = Field(..., description="Assigned caption project UUID")
    caption_source: CaptionSource = Field(..., description="Validated video upload source metadata")
    transcription: TranscriptionResult = Field(..., description="Normalized timed transcript")
    notice: Optional[str] = Field(
        default=None,
        description="Explicit advisory message if in development mock mode",
    )


class ProcessedTranscriptSegment(BaseModel):
    """Timed speech segment with original and translated/transliterated text."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique segment identifier matching original segment")
    original_text: str = Field(..., description="Original transcript text before processing")
    text: str = Field(..., description="Processed translated or transliterated text")
    start_time: float = Field(..., ge=0.0, description="Immutable start timestamp in seconds")
    end_time: float = Field(..., ge=0.0, description="Immutable end timestamp in seconds")
    words: List[TranscriptWord] = Field(default_factory=list, description="Word timings (empty if unavailable)")
    speaker: Optional[str] = Field(default=None, description="Speaker token if preserved")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Confidence score")


class LanguageProcessingRequest(BaseModel):
    """Payload to translate or transliterate timed transcript segments."""
    model_config = ConfigDict(extra="ignore")

    source_language: str = Field(..., description="Source language (English, Telugu, Hindi, Tanglish)")
    target_language: str = Field(..., description="Target language (English, Telugu, Hindi, Tanglish)")
    processing_mode: Literal["translation", "transliteration", "none"] = Field(
        ..., description="Operation mode: 'translation', 'transliteration', or 'none'"
    )
    segments: List[TranscriptSegment] = Field(..., min_length=1, description="Transcript segments to process")
    full_text: Optional[str] = Field(default=None, description="Optional full transcript text")
    provider: Optional[str] = Field(default=None, description="Optional provider override ('mock' or 'production')")


class LanguageProcessingResult(BaseModel):
    """Normalized output contract of translation/transliteration operations."""
    model_config = ConfigDict(extra="ignore")

    source_language: str = Field(..., description="Source language name")
    target_language: str = Field(..., description="Target language name")
    target_language_code: str = Field(..., description="Target language code (e.g. en, te, hi, te-Latn)")
    is_transliteration: bool = Field(default=False, description="True if script is Romanized/transliterated")
    script_type: str = Field(default="Latin", description="Target writing script")
    processing_mode: Literal["translation", "transliteration", "none"] = Field(
        ..., description="Operation mode performed"
    )
    segments: List[ProcessedTranscriptSegment] = Field(default_factory=list, description="Ordered processed segments")
    full_text: str = Field(..., description="Complete combined processed text")
    original_full_text: str = Field(..., description="Original full text preserved for comparison")
    provider_name: str = Field(..., description="Language processor identifier")
    is_production_provider: bool = Field(default=False, description="Whether live production engine was used")
    word_timings_available: bool = Field(default=False, description="Whether word-level timings are valid for processed text")
    notice: Optional[str] = Field(default=None, description="Truthful advisory notice for development mode")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata and diagnostics")


class LanguageVariant(BaseModel):
    """Represents a language variant associated with a caption project."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Variant identifier (e.g. 'original', 'variant_te', 'variant_tanglish')")
    label: str = Field(..., description="Human-readable label")
    language: str = Field(..., description="Language name")
    language_code: str = Field(..., description="Language code")
    is_transliteration: bool = Field(default=False)
    script_type: str = Field(default="Latin")
    processing_mode: str = Field(default="none")
    full_text: str = Field(...)
    segments: List[TranscriptSegment] = Field(default_factory=list)
    is_active: bool = Field(default=False)


class LanguageProcessingResponse(BaseModel):
    """HTTP response contract for language processing API."""
    model_config = ConfigDict(extra="ignore")

    result: LanguageProcessingResult = Field(..., description="Processed language result")
    notice: Optional[str] = Field(default=None, description="Explicit development/advisory notice")

