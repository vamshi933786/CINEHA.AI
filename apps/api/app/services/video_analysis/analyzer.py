import os
import uuid
import shutil
import tempfile
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.video_validator import validate_video_upload, VideoValidationResult
from app.services.caption_service import CaptionService
from app.services.audio_extractor import NoAudioTrackError, AudioExtractionError
from app.schemas.captions import TranscriptSegment
from app.schemas.video_analysis import (
    VideoMetadata,
    VideoAnalysisMetric,
    VideoAnalysisSegment,
    VideoTranscriptInfo,
    VideoAnalysisResponse,
)
from app.models.video_analysis import VideoAnalysis
from app.services.video_analysis.metadata_extractor import VideoMetadataExtractor
from app.services.video_analysis.metrics import VideoMetricsCalculator
from app.services.video_analysis.semantic_analyzer import GeminiVideoSemanticAnalyzer

logger = logging.getLogger(__name__)


class VideoAnalysisService:
    """Core orchestration service for short-form video retention analysis."""

    def __init__(self, caption_service: Optional[CaptionService] = None):
        self.caption_service = caption_service or CaptionService()
        self.semantic_analyzer = GeminiVideoSemanticAnalyzer()

    async def analyze_video(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        language: str = "English",
        provider_type: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> VideoAnalysisResponse:
        """
        Executes end-to-end video analysis:
        1. Validates upload container (100MB limit, container magic bytes, extension).
        2. Probes video properties (width, height, duration, fps, audio presence) via FFmpeg.
        3. Transcribes speech using Local Whisper + Telugu restoration / Tanglish pipeline.
        4. Calculates 10 standardized retention metrics and structural segment mapping.
        5. Enriches qualitative feedback via Gemini semantic analysis (with graceful local fallback).
        6. Persists analysis record in database.
        7. Cleans up all temporary disk artifacts immediately.
        """
        # 1. Video validation (strict <= 100MB, allowed extensions, container magic bytes)
        validation: VideoValidationResult = validate_video_upload(
            file_bytes=video_bytes,
            filename=filename,
            declared_mime_type=mime_type,
        )

        session_id = uuid.uuid4().hex
        session_dir = os.path.join(tempfile.gettempdir(), f"cinehai_analysis_{session_id}")
        os.makedirs(session_dir, exist_ok=True)
        video_temp_path = os.path.join(session_dir, f"temp_{validation.filename}")

        limitations: List[str] = []
        transcript_available = False
        transcript_text = ""
        transcript_segments: List[TranscriptSegment] = []
        transcript_provider = "none"
        transcript_notice: Optional[str] = None

        try:
            # 2. Write temp video for FFmpeg probing
            with open(video_temp_path, "wb") as f:
                f.write(video_bytes)

            probe_info = await VideoMetadataExtractor.probe_video_file(video_temp_path)

            video_meta = VideoMetadata(
                filename=validation.filename,
                file_size_bytes=validation.file_size_bytes,
                file_size_mb=validation.file_size_mb,
                duration_seconds=probe_info["duration_seconds"],
                width=probe_info["width"],
                height=probe_info["height"],
                fps=probe_info["fps"],
                has_audio=probe_info["has_audio"],
                format=validation.detected_format,
            )

            # 3. Audio Extraction & Transcription (Local Whisper / Production / Mock)
            if not video_meta.has_audio:
                limitations.append("Video file has no audio stream. Spoken retention metrics evaluated as absent.")
            else:
                try:
                    transcription_resp = await self.caption_service.transcribe_video(
                        video_bytes=video_bytes,
                        filename=validation.filename,
                        mime_type=validation.mime_type,
                        language=language,
                        duration_seconds=video_meta.duration_seconds,
                        provider_type=provider_type,
                    )
                    transcription = transcription_resp.transcription
                    transcript_segments = transcription.segments
                    transcript_text = transcription.full_text
                    transcript_provider = transcription.provider_name
                    transcript_notice = transcription_resp.notice
                    transcript_available = bool(transcript_segments or transcript_text)

                    # Update probed duration if transcription returned a more precise timing
                    if transcription.duration_seconds and transcription.duration_seconds > 0:
                        video_meta.duration_seconds = max(video_meta.duration_seconds, transcription.duration_seconds)

                except NoAudioTrackError:
                    video_meta.has_audio = False
                    limitations.append("No audio track detected in video file.")
                except AudioExtractionError as e:
                    logger.warning(f"Audio extraction failure for {validation.filename}: {e}")
                    limitations.append(f"Audio extraction was unsuccessful: {str(e)}")
                except Exception as e:
                    logger.warning(f"Transcription failure for {validation.filename}: {e}")
                    limitations.append("Speech transcription could not be completed. Structural metrics computed with metadata heuristics.")

            # 4. Signal Extraction
            signals = VideoMetricsCalculator.extract_signals(
                duration_seconds=video_meta.duration_seconds,
                has_audio=video_meta.has_audio,
                segments=transcript_segments,
            )

            # 5. Metric Calculation
            metrics, overall_score, overall_rating, summary, findings, recommendations = (
                VideoMetricsCalculator.calculate_metrics(
                    video=video_meta,
                    segments=transcript_segments,
                    signals=signals,
                )
            )

            # 6. Structural Timeline Mapping
            mapped_segments = VideoMetricsCalculator.map_segments(
                segments=transcript_segments,
                duration_seconds=video_meta.duration_seconds,
            )

            # 7. Gemini Semantic Analysis (Qualitative enrichment)
            provider_used = f"{transcript_provider} + deterministic_metrics"
            if transcript_available and transcript_text.strip():
                gemini_feedback = await self.semantic_analyzer.analyze_semantics(
                    transcript_text=transcript_text,
                    duration_seconds=video_meta.duration_seconds,
                    language=language,
                    signals=signals,
                )
                if gemini_feedback:
                    provider_used = f"{transcript_provider} + gemini_semantics"
                    if gemini_feedback.summary:
                        summary = gemini_feedback.summary
                    for w in gemini_feedback.weaknesses:
                        if w and w not in findings:
                            findings.append(f"Critique: {w}")
                    for r in gemini_feedback.recommendations:
                        if r and r not in recommendations:
                            recommendations.insert(0, r)

            transcript_info = VideoTranscriptInfo(
                available=transcript_available,
                language=language,
                text=transcript_text,
                segment_count=len(transcript_segments),
                word_count=signals.get("word_count", 0),
                words_per_second=signals.get("words_per_second", 0.0),
                silence_gaps_count=signals.get("silence_gaps_count", 0),
                provider=transcript_provider,
                notice=transcript_notice,
            )

            analysis_id = f"vanalysis_{uuid.uuid4().hex[:12]}"

            # 8. Persistence to Database if session provided
            if db is not None:
                try:
                    db_record = VideoAnalysis(
                        id=analysis_id,
                        filename=video_meta.filename,
                        file_size_bytes=video_meta.file_size_bytes,
                        duration_seconds=video_meta.duration_seconds,
                        width=video_meta.width,
                        height=video_meta.height,
                        fps=video_meta.fps,
                        has_audio=video_meta.has_audio,
                        overall_score=overall_score,
                        overall_rating=overall_rating,
                        summary=summary,
                        metrics=[m.model_dump() for m in metrics],
                        segments=[s.model_dump() for s in mapped_segments],
                        findings=findings,
                        recommendations=recommendations,
                        transcript_text=transcript_text,
                        transcript_metadata=transcript_info.model_dump(),
                        limitations=limitations,
                        provider_used=provider_used,
                    )
                    db.add(db_record)
                    await db.commit()
                    await db.refresh(db_record)
                except Exception as e:
                    logger.error(f"Failed to persist video analysis record: {e}")
                    # Non-fatal: continue returning result even if DB write fails

            return VideoAnalysisResponse(
                id=analysis_id,
                video=video_meta,
                overall_score=overall_score,
                overall_rating=overall_rating,
                summary=summary,
                metrics=metrics,
                segments=mapped_segments,
                findings=findings,
                recommendations=recommendations,
                transcript=transcript_info,
                limitations=limitations,
                analyzed_at=datetime.now(timezone.utc),
                provider_used=provider_used,
            )

        finally:
            # Guaranteed cleanup of isolated temp directory
            shutil.rmtree(session_dir, ignore_errors=True)
