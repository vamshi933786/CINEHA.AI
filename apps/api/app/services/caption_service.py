import os
import uuid
import logging
from typing import Optional
from app.schemas.captions import (
    CaptionSource,
    TranscriptionResponse,
    TranscriptionResult,
    LanguageProcessingRequest,
    LanguageProcessingResponse,
    CaptionCueGenerationRequest,
    CaptionCueGenerationResponse,
)
from app.services.video_validator import validate_video_upload
from app.services.transcription_provider import get_transcription_provider

logger = logging.getLogger(__name__)


class CaptionService:
    """
    Core service orchestrating video validation, ingestion, and transcription.
    Keeps business logic decoupled from FastAPI route handlers.
    """

    def __init__(self, provider=None):
        self.provider = provider or get_transcription_provider()

    async def transcribe_video(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
        provider_type: Optional[str] = None,
    ) -> TranscriptionResponse:
        """
        Validate video file and transcribe audio into timed segments.
        Supports explicit provider selection ('mock' or 'production' / 'whisper').
        """
        # 1. Validate video container, extension, and file size (<= 100 MB)
        validation = validate_video_upload(
            file_bytes=video_bytes,
            filename=filename,
            declared_mime_type=mime_type,
        )

        # 2. Select requested provider (or default)
        active_provider = self.provider
        if provider_type:
            active_provider = get_transcription_provider(provider_type)

        # 3. Transcribe via active provider
        transcription: TranscriptionResult = await active_provider.transcribe(
            video_bytes=video_bytes,
            filename=validation.filename,
            language=language,
            duration_seconds=duration_seconds,
        )

        # 4. Create CaptionSource metadata (never exposing server internal file paths)
        caption_source = CaptionSource(
            source_type="video_upload",
            filename=validation.filename,
            file_size_bytes=validation.file_size_bytes,
            mime_type=validation.mime_type,
            duration_seconds=transcription.duration_seconds,
            metadata=validation.metadata,
        )

        project_id = f"proj_{uuid.uuid4().hex[:12]}"

        # Truthful notice behavior: only present in development/mock mode
        notice = None
        if not transcription.is_production_provider:
            notice = (
                "Development Transcription Mode — production speech-to-text provider is not configured. "
                "Transcription is simulated based on screenplay heuristics."
            )

        return TranscriptionResponse(
            project_id=project_id,
            caption_source=caption_source,
            transcription=transcription,
            notice=notice,
        )

    async def process_language(
        self,
        request: LanguageProcessingRequest,
    ) -> LanguageProcessingResponse:
        """
        Execute language translation or transliteration on timed segments.
        Preserves original transcript and segment timing bounds.
        """
        from app.services.language_processor import get_language_processor

        processor = get_language_processor(request.provider)
        result = await processor.process(request)
        return LanguageProcessingResponse(
            result=result,
            notice=result.notice,
        )

    def generate_cues(
        self,
        request: CaptionCueGenerationRequest,
    ) -> CaptionCueGenerationResponse:
        """
        Generate display-ready, synchronized caption cues from active transcript segments.
        Applies deterministic layout, punctuation and duration rules without LLM.
        """
        from app.services.caption_cue_generator import CaptionCueGeneratorService

        result = CaptionCueGeneratorService.generate_cues(request)
        notice = None
        if result.warnings:
            notice = "; ".join(result.warnings)

        return CaptionCueGenerationResponse(
            result=result,
            notice=notice,
        )

    async def generate_captions_pipeline(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
        provider_type: Optional[str] = None,
    ):
        """
        Unified end-to-end caption generation pipeline:
        Video Ingestion -> Speech Transcription -> Language Processing (if needed) -> Timed Cues.
        Returns synchronized caption cues display-ready for direct-on-video overlay.
        """
        from app.schemas.captions import (
            CaptionPipelineResponse,
            CaptionCueSettings,
            LanguageProcessingRequest,
        )
        from app.services.caption_cue_generator import CaptionCueGeneratorService

        # 1. Transcribe video audio
        transcribe_resp = await self.transcribe_video(
            video_bytes=video_bytes,
            filename=filename,
            mime_type=mime_type,
            language=language,
            duration_seconds=duration_seconds,
            provider_type=provider_type,
        )

        source_transcription = transcribe_resp.transcription
        active_segments = source_transcription.segments
        processed_result = None
        caption_source_type = "original"

        # 2. Apply language processing if requested language differs from transcribed language
        if source_transcription.language != language:
            from app.services.language_processor import get_language_processor

            processor = get_language_processor()

            # Case A: Transcribed English -> User wants Telugu
            if source_transcription.language == "English" and language == "Telugu":
                proc_req = LanguageProcessingRequest(
                    source_language="English",
                    target_language="Telugu",
                    processing_mode="translation",
                    segments=active_segments,
                )
                proc_res = await processor.process(proc_req)
                processed_result = proc_res
                caption_source_type = "translated"
                # Map to TranscriptSegments for cue generator
                active_segments = [
                    s for s in proc_res.segments
                ]  # ProcessedTranscriptSegment is compatible in text, start_time, end_time

            # Case B: Transcribed Telugu -> User wants Tanglish
            elif source_transcription.language == "Telugu" and language == "Tanglish":
                proc_req = LanguageProcessingRequest(
                    source_language="Telugu",
                    target_language="Tanglish",
                    processing_mode="transliteration",
                    segments=active_segments,
                )
                proc_res = await processor.process(proc_req)
                processed_result = proc_res
                caption_source_type = "transliterated"
                active_segments = proc_res.segments

            # Case C: Transcribed English -> User wants Tanglish
            elif source_transcription.language == "English" and language == "Tanglish":
                # Translate English to Telugu first
                proc_req1 = LanguageProcessingRequest(
                    source_language="English",
                    target_language="Telugu",
                    processing_mode="translation",
                    segments=active_segments,
                )
                proc_res1 = await processor.process(proc_req1)
                # Then transliterate Telugu to Tanglish
                from app.schemas.captions import TranscriptSegment
                intermediate_segments = [
                    TranscriptSegment(
                        id=s.id,
                        text=s.text,
                        start_time=s.start_time,
                        end_time=s.end_time,
                        words=s.words,
                    )
                    for s in proc_res1.segments
                ]
                proc_req2 = LanguageProcessingRequest(
                    source_language="Telugu",
                    target_language="Tanglish",
                    processing_mode="transliteration",
                    segments=intermediate_segments,
                )
                proc_res2 = await processor.process(proc_req2)
                processed_result = proc_res2
                caption_source_type = "transliterated"
                active_segments = proc_res2.segments

        # Convert processed segments to TranscriptSegment if needed for cue generator
        from app.schemas.captions import TranscriptSegment
        cue_input_segments = []
        for s in active_segments:
            if isinstance(s, TranscriptSegment):
                cue_input_segments.append(s)
            else:
                cue_input_segments.append(
                    TranscriptSegment(
                        id=s.id,
                        text=s.text,
                        start_time=s.start_time,
                        end_time=s.end_time,
                        words=getattr(s, "words", []),
                        confidence=getattr(s, "confidence", None),
                    )
                )

        # 3. Generate display-ready synchronized caption cues
        script_type = "Telugu" if language == "Telugu" else "Latin"
        lang_code = "te" if language == "Telugu" else ("te-Latn" if language == "Tanglish" else "en")

        cue_req = CaptionCueGenerationRequest(
            segments=cue_input_segments,
            language=language,
            language_code=lang_code,
            is_transliteration=(language == "Tanglish"),
            script_type=script_type,
            caption_source_type=caption_source_type,
            settings=CaptionCueSettings(),
        )

        cue_gen_res = CaptionCueGeneratorService.generate_cues(cue_req)

        return CaptionPipelineResponse(
            project_id=transcribe_resp.project_id,
            caption_source=transcribe_resp.caption_source,
            transcription=source_transcription,
            processed_transcription=processed_result,
            cues=cue_gen_res.cues,
            selected_language=language,
            cue_count=cue_gen_res.cue_count,
            total_caption_duration=cue_gen_res.total_caption_duration,
            timing_granularity=cue_gen_res.timing_granularity,
            is_production_provider=source_transcription.is_production_provider,
            notice=transcribe_resp.notice,
        )

    async def render_captions(
        self,
        video_bytes: bytes,
        cues: list,
        language: str = "English",
        options=None,
        filename: Optional[str] = None,
    ):
        """
        Burn caption cues permanently into the video using FFmpegCaptionRenderer.
        Returns CaptionRenderResult with secure download URL.
        """
        from app.services.caption_renderer import get_caption_renderer

        renderer = get_caption_renderer()
        return await renderer.render(
            video_bytes=video_bytes,
            cues=cues,
            language=language,
            options=options,
            filename=filename,
        )

    def get_rendered_video_path(self, render_id: str) -> Optional[Tuple[str, str]]:
        """
        Securely retrieve local filesystem path for a completed render output.
        Returns (filepath, filename) or None.
        """
        from app.services.caption_renderer import RENDER_REGISTRY

        meta = RENDER_REGISTRY.get(render_id)
        if not meta:
            return None
        filepath = meta.get("filepath")
        filename = meta.get("filename", f"{render_id}.mp4")
        if filepath and os.path.isfile(filepath):
            return (filepath, filename)
        return None

