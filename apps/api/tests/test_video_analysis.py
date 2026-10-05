import os
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.captions import (
    TranscriptionResponse,
    TranscriptionResult,
    TranscriptSegment,
    CaptionSource,
)
from app.services.video_analysis.metrics import VideoMetricsCalculator
from app.services.video_analysis.metadata_extractor import VideoMetadataExtractor
from app.services.video_analysis.semantic_analyzer import (
    GeminiVideoSemanticAnalyzer,
    GeminiSemanticAnalysisResponse,
)
from app.services.video_analysis.analyzer import VideoAnalysisService
from app.services.audio_extractor import NoAudioTrackError


def create_dummy_mp4_bytes(size: int = 1024) -> bytes:
    header = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08mdat"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


def create_dummy_mov_bytes(size: int = 1024) -> bytes:
    header = b"\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00qt  \x00\x00\x00\x08mdat"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


def create_mock_transcription_response() -> TranscriptionResponse:
    segments = [
        TranscriptSegment(id="seg_1", start_time=0.2, end_time=3.2, text="Stop shooting at 60fps right now."),
        TranscriptSegment(id="seg_2", start_time=3.5, end_time=7.8, text="Here is why that frame rate is ruining your video blur."),
        TranscriptSegment(id="seg_3", start_time=8.0, end_time=12.5, text="Switch to 24fps with a 1/50 shutter speed."),
        TranscriptSegment(id="seg_4", start_time=12.8, end_time=15.0, text="Save this tip for your next shoot."),
    ]
    return TranscriptionResponse(
        project_id="proj_test_123",
        caption_source=CaptionSource(
            source_type="video_upload",
            filename="test.mp4",
            file_size_bytes=1024,
            mime_type="video/mp4",
            duration_seconds=15.0,
        ),
        transcription=TranscriptionResult(
            provider_name="local_whisper",
            is_production_provider=True,
            language="English",
            duration_seconds=15.0,
            full_text="Stop shooting at 60fps right now. Here is why that frame rate is ruining your video blur. Switch to 24fps with a 1/50 shutter speed. Save this tip for your next shoot.",
            segments=segments,
        ),
    )


@pytest.mark.asyncio
async def test_video_metadata_extractor():
    """Verify metadata extraction handles missing or dummy files gracefully."""
    meta = await VideoMetadataExtractor.probe_video_file("/non/existent/path.mp4")
    assert "width" in meta
    assert "height" in meta
    assert "fps" in meta
    assert "duration_seconds" in meta
    assert "has_audio" in meta


@pytest.mark.asyncio
async def test_video_metrics_calculator_bounds():
    """Verify all 10 retention metrics are strictly bounded 0-100."""
    from app.schemas.video_analysis import VideoMetadata

    video = VideoMetadata(
        filename="test.mp4",
        file_size_bytes=1024,
        file_size_mb=0.01,
        duration_seconds=15.0,
        width=1080,
        height=1920,
        fps=30.0,
        has_audio=True,
        format="mp4",
    )
    segments = [
        TranscriptSegment(id="seg_1", start_time=0.2, end_time=3.0, text="Stop using default camera settings."),
        TranscriptSegment(id="seg_2", start_time=3.2, end_time=8.0, text="You know so basically this setting is a secret hack."),
        TranscriptSegment(id="seg_3", start_time=8.5, end_time=14.0, text="Save this and follow for more."),
    ]
    signals = VideoMetricsCalculator.extract_signals(15.0, True, segments)
    metrics, overall_score, overall_rating, summary, findings, recommendations = (
        VideoMetricsCalculator.calculate_metrics(video, segments, signals)
    )

    assert 0 <= overall_score <= 100
    assert len(metrics) == 10
    metric_ids = {m.id for m in metrics}
    expected_ids = {
        "hook_strength",
        "opening_clarity",
        "retention_structure",
        "pacing",
        "information_density",
        "filler_repetition",
        "story_flow",
        "curiosity_open_loops",
        "cta_strength",
        "accessibility_readiness",
    }
    assert metric_ids == expected_ids
    for m in metrics:
        assert 0 <= m.score <= 100
        assert m.rating in ("Excellent", "Strong", "Moderate", "Needs Work")
        assert len(m.summary) > 0
        assert isinstance(m.evidence, list)


@pytest.mark.asyncio
async def test_no_fabricated_timestamps_in_segments():
    """Verify structural segment timestamps map 1:1 to audio engine output without fabrication."""
    segments = [
        TranscriptSegment(id="seg_1", start_time=0.15, end_time=2.85, text="Hook sentence here."),
        TranscriptSegment(id="seg_2", start_time=3.10, end_time=6.45, text="Core body text."),
        TranscriptSegment(id="seg_3", start_time=6.70, end_time=9.90, text="Closing CTA sentence."),
    ]
    mapped = VideoMetricsCalculator.map_segments(segments, duration_seconds=10.0)
    assert len(mapped) == 3
    assert mapped[0].start_seconds == 0.15
    assert mapped[0].end_seconds == 2.85
    assert mapped[0].label == "HOOK"
    assert mapped[1].start_seconds == 3.10
    assert mapped[1].end_seconds == 6.45
    assert mapped[2].start_seconds == 6.70
    assert mapped[2].end_seconds == 9.90
    assert mapped[2].label == "CTA"


@pytest.mark.asyncio
async def test_gemini_semantic_analyzer_fallback():
    """Verify Gemini failure (e.g. invalid response, timeout, missing key) falls back cleanly without 500."""
    analyzer = GeminiVideoSemanticAnalyzer(api_key="")
    res = await analyzer.analyze_semantics(
        transcript_text="Test transcript",
        duration_seconds=10.0,
    )
    assert res is None  # Clean fallback to local heuristics


@pytest.mark.asyncio
async def test_gemini_semantic_analyzer_malformed_response():
    """Verify malformed JSON from Gemini is safely caught."""
    analyzer = GeminiVideoSemanticAnalyzer(api_key="fake-key")
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": "Not valid json at all!"}]}}]
        }
        mock_post.return_value = mock_response

        res = await analyzer.analyze_semantics(
            transcript_text="Test transcript",
            duration_seconds=10.0,
        )
        assert res is None


@pytest.mark.asyncio
async def test_api_analyze_video_success():
    """Verify POST /api/v1/video-analysis/analyze successfully processes valid video."""
    video_bytes = create_dummy_mp4_bytes(2048)

    mock_resp = create_mock_transcription_response()

    with patch(
        "app.services.caption_service.CaptionService.transcribe_video",
        new=AsyncMock(return_value=mock_resp),
    ), patch(
        "app.services.video_analysis.metadata_extractor.VideoMetadataExtractor.probe_video_file",
        new=AsyncMock(return_value={
            "width": 1080,
            "height": 1920,
            "duration_seconds": 15.0,
            "fps": 30.0,
            "has_audio": True,
        }),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            files = {"file": ("test_clip.mp4", video_bytes, "video/mp4")}
            data = {"language": "English"}
            response = await client.post("/api/v1/video-analysis/analyze", files=files, data=data)

            assert response.status_code == 200
            json_data = response.json()
            assert "id" in json_data
            assert json_data["video"]["filename"] == "test_clip.mp4"
            assert json_data["video"]["duration_seconds"] == 15.0
            assert json_data["video"]["width"] == 1080
            assert json_data["video"]["height"] == 1920
            assert 0 <= json_data["overall_score"] <= 100
            assert len(json_data["metrics"]) == 10
            assert len(json_data["segments"]) == 4
            assert json_data["transcript"]["available"] is True
            assert "Stop shooting at 60fps" in json_data["transcript"]["text"]

            # Verify retrieval endpoint GET /api/v1/video-analysis/{analysis_id}
            analysis_id = json_data["id"]
            get_resp = await client.get(f"/api/v1/video-analysis/{analysis_id}")
            assert get_resp.status_code == 200
            get_data = get_resp.json()
            assert get_data["id"] == analysis_id
            assert get_data["video"]["filename"] == "test_clip.mp4"
            assert get_data["overall_score"] == json_data["overall_score"]


@pytest.mark.asyncio
async def test_api_analyze_video_no_audio_graceful_degradation():
    """Verify video without audio degrades gracefully with transcript.available=False and no 500 error."""
    video_bytes = create_dummy_mp4_bytes(2048)

    with patch(
        "app.services.caption_service.CaptionService.transcribe_video",
        new=AsyncMock(side_effect=NoAudioTrackError("No audio track was detected in this video.")),
    ), patch(
        "app.services.video_analysis.metadata_extractor.VideoMetadataExtractor.probe_video_file",
        new=AsyncMock(return_value={
            "width": 1080,
            "height": 1920,
            "duration_seconds": 10.0,
            "fps": 30.0,
            "has_audio": False,
        }),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            files = {"file": ("silent_clip.mp4", video_bytes, "video/mp4")}
            response = await client.post("/api/v1/video-analysis/analyze", files=files)

            assert response.status_code == 200
            json_data = response.json()
            assert json_data["video"]["has_audio"] is False
            assert json_data["transcript"]["available"] is False
            assert len(json_data["limitations"]) > 0
            assert 0 <= json_data["overall_score"] <= 100
            assert len(json_data["metrics"]) == 10


@pytest.mark.asyncio
async def test_api_analyze_video_invalid_extension():
    """Verify rejection of invalid file extensions (.exe / .txt) with 415."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("malicious.exe", b"not a video", "application/octet-stream")}
        response = await client.post("/api/v1/video-analysis/analyze", files=files)
        assert response.status_code == 415


@pytest.mark.asyncio
async def test_api_analyze_video_zero_byte_file():
    """Verify zero-byte upload is rejected with 400 Bad Request."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("empty.mp4", b"", "video/mp4")}
        response = await client.post("/api/v1/video-analysis/analyze", files=files)
        assert response.status_code == 400
        assert "empty (0 bytes)" in response.json()["detail"]


@pytest.mark.asyncio
async def test_api_analyze_video_oversized_file():
    """Verify file exceeding 100 MB is rejected with 413."""
    oversized_bytes = create_dummy_mp4_bytes(100 * 1024 * 1024 + 1024)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("huge.mp4", oversized_bytes, "video/mp4")}
        response = await client.post("/api/v1/video-analysis/analyze", files=files)
        assert response.status_code == 413


@pytest.mark.asyncio
async def test_api_get_analysis_not_found():
    """Verify GET /api/v1/video-analysis/{non_existent} returns 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/video-analysis/vanalysis_unknown999")
        assert response.status_code == 404
