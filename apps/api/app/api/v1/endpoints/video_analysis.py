import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.video_analysis import VideoAnalysis
from app.schemas.video_analysis import VideoAnalysisResponse, VideoMetadata, VideoTranscriptInfo
from app.services.video_analysis.analyzer import VideoAnalysisService

logger = logging.getLogger(__name__)

router = APIRouter()
analysis_service = VideoAnalysisService()


@router.post(
    "/video-analysis/analyze",
    response_model=VideoAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Video Retention and Structure",
    description="Validates video asset, probes metadata, extracts speech via Whisper, and audits 10 short-form retention criteria.",
)
async def analyze_video(
    file: UploadFile = File(..., description="Video file (MP4, MOV, WebM up to 100MB)"),
    language: str = Form("English", description="Spoken language in the video (English, Telugu, Tanglish, Hindi)"),
    provider: Optional[str] = Form(None, description="Optional transcription provider override"),
    db: AsyncSession = Depends(get_db),
) -> VideoAnalysisResponse:
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video file was uploaded.",
        )

    try:
        video_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded video stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded video file: {str(e)}",
        )

    return await analysis_service.analyze_video(
        video_bytes=video_bytes,
        filename=file.filename,
        mime_type=file.content_type,
        language=language,
        provider_type=provider,
        db=db,
    )


@router.get(
    "/video-analysis/{analysis_id}",
    response_model=VideoAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Video Analysis by ID",
    description="Retrieves a previously computed video retention audit from the database.",
)
async def get_video_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
) -> VideoAnalysisResponse:
    result = await db.execute(select(VideoAnalysis).where(VideoAnalysis.id == analysis_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video analysis record with ID '{analysis_id}' was not found.",
        )

    # Reconstruct VideoMetadata
    video_meta = VideoMetadata(
        filename=record.filename,
        file_size_bytes=record.file_size_bytes,
        file_size_mb=round(record.file_size_bytes / (1024 * 1024), 2),
        duration_seconds=record.duration_seconds,
        width=record.width,
        height=record.height,
        fps=record.fps,
        has_audio=record.has_audio,
        format=record.filename.split(".")[-1].lower() if "." in record.filename else "mp4",
    )

    # Reconstruct VideoTranscriptInfo
    t_meta = record.transcript_metadata or {}
    transcript_info = VideoTranscriptInfo(
        available=bool(record.transcript_text),
        language=t_meta.get("language", "English"),
        text=record.transcript_text or "",
        segment_count=t_meta.get("segment_count", len(record.segments or [])),
        word_count=t_meta.get("word_count", 0),
        words_per_second=t_meta.get("words_per_second", 0.0),
        silence_gaps_count=t_meta.get("silence_gaps_count", 0),
        provider=t_meta.get("provider", record.provider_used),
        notice=t_meta.get("notice"),
    )

    return VideoAnalysisResponse(
        id=record.id,
        video=video_meta,
        overall_score=record.overall_score,
        overall_rating=record.overall_rating,
        summary=record.summary,
        metrics=record.metrics,
        segments=record.segments,
        findings=record.findings,
        recommendations=record.recommendations,
        transcript=transcript_info,
        limitations=record.limitations,
        analyzed_at=record.created_at,
        provider_used=record.provider_used,
    )


@router.get(
    "/video-analysis",
    response_model=list[VideoAnalysisResponse],
    status_code=status.HTTP_200_OK,
    summary="List Recent Video Analyses",
    description="Retrieves a list of recent video retention audit records.",
)
async def list_video_analyses(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list[VideoAnalysisResponse]:
    result = await db.execute(
        select(VideoAnalysis)
        .order_by(VideoAnalysis.created_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    responses = []
    for record in records:
        video_meta = VideoMetadata(
            filename=record.filename,
            file_size_bytes=record.file_size_bytes,
            file_size_mb=round(record.file_size_bytes / (1024 * 1024), 2),
            duration_seconds=record.duration_seconds,
            width=record.width,
            height=record.height,
            fps=record.fps,
            has_audio=record.has_audio,
            format=record.filename.split(".")[-1].lower() if "." in record.filename else "mp4",
        )
        t_meta = record.transcript_metadata or {}
        transcript_info = VideoTranscriptInfo(
            available=bool(record.transcript_text),
            language=t_meta.get("language", "English"),
            text=record.transcript_text or "",
            segment_count=t_meta.get("segment_count", len(record.segments or [])),
            word_count=t_meta.get("word_count", 0),
            words_per_second=t_meta.get("words_per_second", 0.0),
            silence_gaps_count=t_meta.get("silence_gaps_count", 0),
            provider=t_meta.get("provider", record.provider_used),
            notice=t_meta.get("notice"),
        )
        responses.append(
            VideoAnalysisResponse(
                id=record.id,
                video=video_meta,
                overall_score=record.overall_score,
                overall_rating=record.overall_rating,
                summary=record.summary,
                metrics=record.metrics,
                segments=record.segments,
                findings=record.findings,
                recommendations=record.recommendations,
                transcript=transcript_info,
                limitations=record.limitations,
                analyzed_at=record.created_at,
                provider_used=record.provider_used,
            )
        )
    return responses
