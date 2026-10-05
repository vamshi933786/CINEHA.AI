from typing import Optional, List, Dict, Any, Literal, Union
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


class CaptionCueWord(BaseModel):
    """Word-level timing token embedded within a caption cue."""
    model_config = ConfigDict(extra="ignore")

    text: str = Field(..., description="Word text")
    start_time: float = Field(..., ge=0.0, description="Start timestamp in seconds")
    end_time: float = Field(..., ge=0.0, description="End timestamp in seconds")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Confidence score")


class CaptionCueSettings(BaseModel):
    """Configurable layout and timing constraints for deterministic caption cue generation."""
    model_config = ConfigDict(extra="ignore")

    max_characters_per_line: int = Field(default=36, ge=10, le=80, description="Maximum characters per visual line")
    max_lines: int = Field(default=2, ge=1, le=4, description="Maximum lines per caption cue")
    minimum_cue_duration: float = Field(default=0.8, ge=0.1, le=10.0, description="Minimum duration in seconds")
    maximum_cue_duration: float = Field(default=4.0, ge=0.5, le=30.0, description="Maximum duration in seconds")
    preferred_words_per_cue: int = Field(default=6, ge=1, le=25, description="Target word count per cue")
    gap_threshold: float = Field(default=0.5, ge=0.0, le=5.0, description="Speech pause threshold in seconds to break cue")


class CaptionCue(BaseModel):
    """Timed, display-ready caption cue with layout lines and optional word timings."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., description="Unique cue ID (e.g. cue_0, cue_1)")
    text: str = Field(..., description="Complete caption text for this cue")
    start_time: float = Field(..., ge=0.0, description="Cue start timestamp in seconds")
    end_time: float = Field(..., ge=0.0, description="Cue end timestamp in seconds")
    duration: float = Field(..., ge=0.0, description="Cue duration in seconds")
    language: str = Field(default="English", description="Language name")
    language_code: str = Field(default="en", description="Language code")
    lines: List[str] = Field(default_factory=list, description="Visual line breaks for screen rendering")
    source_segment_ids: List[str] = Field(default_factory=list, description="IDs of source segments composing this cue")
    segment_id: Optional[str] = Field(default=None, description="Primary parent segment ID for backward compatibility")
    words: List[CaptionCueWord] = Field(default_factory=list, description="Word timings when valid timing exists")
    manually_edited: bool = Field(default=False, description="Whether this cue text/timing was manually edited by creator")
    position: Optional[Dict[str, Any]] = Field(default=None, description="Spatial position/alignment on screen")
    style: Optional[Dict[str, Any]] = Field(default=None, description="Visual typography attributes")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic and generator metadata")


class CaptionCueGenerationRequest(BaseModel):
    """Payload to generate synchronized caption cues from active transcript segments."""
    model_config = ConfigDict(extra="ignore")

    segments: List[TranscriptSegment] = Field(..., description="Active transcript segments to convert into cues")
    language: str = Field(default="English", description="Language name of active transcript")
    language_code: Optional[str] = Field(default="en", description="Language code of active transcript")
    is_transliteration: bool = Field(default=False, description="Whether active transcript is Romanized transliteration")
    script_type: str = Field(default="Latin", description="Writing script (Latin, Telugu, Devanagari)")
    caption_source_type: Literal["original", "translated", "transliterated"] = Field(
        default="original", description="Source nature of active transcript"
    )
    settings: Optional[CaptionCueSettings] = Field(
        default=None, description="Custom cue settings (defaults used if omitted)"
    )


class CaptionCueGenerationResult(BaseModel):
    """Result of deterministic caption cue generation."""
    model_config = ConfigDict(extra="ignore")

    cues: List[CaptionCue] = Field(default_factory=list, description="Ordered caption cues")
    cue_count: int = Field(default=0, ge=0, description="Total number of cues generated")
    total_caption_duration: float = Field(default=0.0, ge=0.0, description="Total active duration of cues")
    timing_granularity: Literal["word", "segment"] = Field(
        default="segment", description="Whether cues are synchronized at word or segment level"
    )
    settings_used: CaptionCueSettings = Field(..., description="Settings applied during generation")
    caption_source_type: str = Field(default="original", description="Origin of active transcript")
    warnings: List[str] = Field(default_factory=list, description="Advisory warnings")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata and diagnostics")


class CaptionCueGenerationResponse(BaseModel):
    """HTTP response contract for caption cue generation endpoint."""
    model_config = ConfigDict(extra="ignore")

    result: CaptionCueGenerationResult = Field(..., description="Generated caption cues and metadata")
    notice: Optional[str] = Field(default=None, description="Advisory message if applicable")


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


class CaptionRenderOptions(BaseModel):
    """Visual style, typography, and layout options for video caption rendering."""
    model_config = ConfigDict(extra="ignore")

    preset: Literal[
        "clean_pop",
        "karaoke",
        "bold_bounce",
        "minimal_fade",
        "punchy",
        "hormozi",
        "neon_pulse",
        "editorial",
    ] = Field(
        default="clean_pop", description="Motion caption styling preset"
    )
    font_size: Literal["small", "medium", "large"] = Field(
        default="medium", description="Relative caption font size"
    )
    alignment: Literal["left", "center", "right"] = Field(
        default="center", description="Horizontal text alignment"
    )
    vertical_position: Literal["top", "center", "bottom", "custom"] = Field(
        default="bottom", description="Vertical placement on video frame"
    )
    position_x: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Normalized horizontal center (0.0=left, 1.0=right)"
    )
    position_y: Optional[float] = Field(
        default=None, ge=0.0, le=1.0, description="Normalized vertical center (0.0=top, 1.0=bottom)"
    )
    background: Literal["none", "box", "outline"] = Field(
        default="box", description="Caption background box or outline style"
    )
    primary_color: str = Field(default="#FFFFFF", description="Main caption text hex color")
    active_color: str = Field(default="#00F0FF", description="Active word or highlight hex color")
    active_bg_color: str = Field(default="#33000000", description="Background box fill color")
    font_weight: Literal["normal", "bold", "black"] = Field(default="bold", description="Font weight")


class CaptionRenderResult(BaseModel):
    """Normalized metadata describing the completed video rendering output."""
    model_config = ConfigDict(extra="ignore")

    render_id: str = Field(..., description="Unique UUID identifier for this render output")
    status: Literal["completed", "failed"] = Field(default="completed", description="Render status")
    output_filename: str = Field(..., description="Safe filename for the output video")
    mime_type: str = Field(default="video/mp4", description="Video MIME type")
    file_size: int = Field(..., ge=0, description="Rendered file size in bytes")
    duration: float = Field(..., ge=0.0, description="Video duration in seconds")
    caption_language: str = Field(..., description="Language of burned-in captions")
    caption_count: int = Field(..., ge=0, description="Total caption cues rendered")
    download_url: str = Field(..., description="Secure API URL to download the rendered MP4")
    video_width: Optional[int] = Field(default=None, description="Probed video width in pixels")
    video_height: Optional[int] = Field(default=None, description="Probed video height in pixels")
    preset_used: str = Field(default="clean_pop", description="Motion preset applied during rendering")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic and font metadata")


class CaptionRenderResponse(BaseModel):
    """HTTP response contract for video caption rendering endpoint."""
    model_config = ConfigDict(extra="ignore")

    result: CaptionRenderResult = Field(..., description="Rendered video result metadata")
    notice: Optional[str] = Field(default=None, description="Advisory message if applicable")


class CaptionPipelineResponse(BaseModel):
    """Unified response contract for end-to-end caption generation pipeline."""
    model_config = ConfigDict(extra="ignore")

    project_id: str = Field(..., description="Assigned caption project UUID")
    caption_source: CaptionSource = Field(..., description="Validated video upload source metadata")
    transcription: TranscriptionResult = Field(..., description="Source speech transcription")
    processed_transcription: Optional[Union[LanguageProcessingResult, TranscriptionResult]] = Field(
        default=None, description="Translated or transliterated transcript if requested"
    )
    cues: List[CaptionCue] = Field(default_factory=list, description="Synchronized caption cues")
    selected_language: str = Field(..., description="Active caption language (English, Telugu, Tanglish)")
    cue_count: int = Field(default=0, ge=0, description="Total cues generated")
    total_caption_duration: float = Field(default=0.0, ge=0.0, description="Total duration of cues")
    timing_granularity: Literal["word", "segment"] = Field(
        default="segment", description="Timing precision of caption cues"
    )
    is_production_provider: bool = Field(default=False, description="Whether production STT was used")
    notice: Optional[str] = Field(default=None, description="Advisory or development notice")

