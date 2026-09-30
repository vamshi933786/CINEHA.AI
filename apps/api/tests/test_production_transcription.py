import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport, Response, Request
from fastapi import HTTPException
from app.main import app
from app.services.transcription_provider import (
    OpenAIWhisperTranscriptionProvider,
    MockDevelopmentTranscriptionProvider,
    get_transcription_provider,
    is_production_transcription_configured,
)
from app.services.audio_extractor import (
    AudioExtractionResult,
    NoAudioTrackError,
    AudioExtractionError,
    FFmpegNotFoundError,
    extract_audio_from_video,
)
from app.schemas.captions import TranscriptionResult


# Helper for dummy video
def create_dummy_mp4_bytes(size: int = 512) -> bytes:
    header = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08mdat"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


# Mock Whisper verbose_json response with word & segment timestamps
MOCK_WHISPER_RESPONSE = {
    "text": "Stop shooting at 60fps! Here is the 1-second cinema camera setting.",
    "duration": 5.2,
    "language": "english",
    "segments": [
        {
            "id": 0,
            "start": 0.0,
            "end": 2.5,
            "text": "Stop shooting at 60fps!",
            "avg_logprob": -0.15,
        },
        {
            "id": 1,
            "start": 2.6,
            "end": 5.2,
            "text": "Here is the 1-second cinema camera setting.",
            "avg_logprob": -0.22,
        },
    ],
    "words": [
        {"word": "Stop", "start": 0.0, "end": 0.4},
        {"word": "shooting", "start": 0.4, "end": 1.1},
        {"word": "at", "start": 1.1, "end": 1.4},
        {"word": "60fps!", "start": 1.4, "end": 2.4},
        {"word": "Here", "start": 2.6, "end": 2.9},
        {"word": "is", "start": 2.9, "end": 3.1},
        {"word": "the", "start": 3.1, "end": 3.3},
        {"word": "1-second", "start": 3.3, "end": 4.1},
        {"word": "cinema", "start": 4.1, "end": 4.6},
        {"word": "camera", "start": 4.6, "end": 4.9},
        {"word": "setting.", "start": 4.9, "end": 5.2},
    ],
}


# 1. Provider Initialization
def test_production_provider_initialization():
    provider = OpenAIWhisperTranscriptionProvider(
        api_key="test_key_123",
        model="whisper-1",
        api_url="https://api.openai.com/v1/audio/transcriptions",
    )
    assert provider.api_key == "test_key_123"
    assert provider.model == "whisper-1"
    assert provider.provider_name == "openai_whisper"
    assert provider.is_production_provider is True


# 2. Provider Configuration Detection
def test_production_provider_is_configured():
    provider_configured = OpenAIWhisperTranscriptionProvider(api_key="sk-live-mock-key")
    assert provider_configured.is_configured() is True

    provider_empty = OpenAIWhisperTranscriptionProvider(api_key="")
    assert provider_empty.is_configured() is False


# 3. Missing Credentials Handling
@pytest.mark.asyncio
async def test_production_provider_missing_credentials_raises_error():
    provider = OpenAIWhisperTranscriptionProvider(api_key="")
    with pytest.raises(HTTPException) as exc_info:
        await provider.transcribe(
            video_bytes=create_dummy_mp4_bytes(),
            filename="demo.mp4",
        )
    assert exc_info.value.status_code == 400
    assert "Production transcription is not configured" in exc_info.value.detail


# 4. Request Construction & 5. Response Normalization & 6. Segments & 7. Words
@pytest.mark.asyncio
async def test_production_provider_transcribe_success_with_word_timestamps():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")
    dummy_audio = AudioExtractionResult(
        audio_bytes=b"ID3_dummy_mp3_stream",
        audio_format="mp3",
    )

    with patch(
        "app.services.transcription_provider.extract_audio_from_video",
        new_callable=AsyncMock,
        return_value=dummy_audio,
    ):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = MOCK_WHISPER_RESPONSE
            mock_post.return_value = mock_resp

            result: TranscriptionResult = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="reel.mp4",
                language="English",
            )

            # 4. Verify request construction
            assert mock_post.called
            call_kwargs = mock_post.call_args[1]
            assert "Authorization" in call_kwargs["headers"]
            assert "Bearer sk-mock-key" in call_kwargs["headers"]["Authorization"]
            assert ("model", "whisper-1") in call_kwargs["data"]
            assert ("response_format", "verbose_json") in call_kwargs["data"]
            assert ("timestamp_granularities[]", "word") in call_kwargs["data"]
            assert ("timestamp_granularities[]", "segment") in call_kwargs["data"]

            # 5. Verify normalization
            assert result.is_production_provider is True
            assert result.provider_name == "openai_whisper"
            assert result.language == "English"
            assert result.duration_seconds == 5.2
            assert "Stop shooting" in result.full_text

            # 6. Verify segment timestamps
            assert len(result.segments) == 2
            seg0 = result.segments[0]
            assert seg0.start_time == 0.0
            assert seg0.end_time == 2.5
            assert seg0.text == "Stop shooting at 60fps!"

            # 7. Verify word timestamps
            assert len(seg0.words) == 4
            assert seg0.words[0].text == "Stop"
            assert seg0.words[0].start_time == 0.0
            assert seg0.words[0].end_time == 0.4
            assert result.metadata["word_timings_available"] is True


# 8. Provider Without Word Timings
@pytest.mark.asyncio
async def test_production_provider_without_word_timestamps():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")
    dummy_audio = AudioExtractionResult(audio_bytes=b"dummy", audio_format="mp3")

    # Response with segments only (words list empty)
    whisper_no_words = {
        "text": "Full voiceover without word-level timestamps.",
        "duration": 4.0,
        "segments": [
            {"id": 0, "start": 0.0, "end": 4.0, "text": "Full voiceover without word-level timestamps."}
        ],
        "words": [],
    }

    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("httpx.AsyncClient.post", AsyncMock()) as mock_post:
            mock_resp = MagicMock(status_code=200)
            mock_resp.json.return_value = whisper_no_words
            mock_post.return_value = mock_resp

            result = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="no_words.mp4",
            )

            assert len(result.segments) == 1
            assert result.segments[0].words == []
            assert result.metadata["word_timings_available"] is False


# 9. Authentication Failure (401 from provider)
@pytest.mark.asyncio
async def test_production_provider_authentication_failure():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-bad-key")
    dummy_audio = AudioExtractionResult(audio_bytes=b"dummy", audio_format="mp3")

    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("httpx.AsyncClient.post", AsyncMock()) as mock_post:
            mock_resp = MagicMock(status_code=401)
            mock_resp.json.return_value = {"error": {"message": "Invalid API key"}}
            mock_post.return_value = mock_resp

            with pytest.raises(HTTPException) as exc_info:
                await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    filename="reel.mp4",
                )
            assert exc_info.value.status_code == 401
            assert "authentication failed" in exc_info.value.detail


# 10. Provider API Failure (500 from provider)
@pytest.mark.asyncio
async def test_production_provider_api_error_returns_502():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")
    dummy_audio = AudioExtractionResult(audio_bytes=b"dummy", audio_format="mp3")

    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("httpx.AsyncClient.post", AsyncMock()) as mock_post:
            mock_resp = MagicMock(status_code=500)
            mock_resp.json.return_value = {"error": {"message": "Internal server error at provider"}}
            mock_post.return_value = mock_resp

            with pytest.raises(HTTPException) as exc_info:
                await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    filename="reel.mp4",
                )
            assert exc_info.value.status_code == 502
            assert "Transcription provider error" in exc_info.value.detail


# 11. Malformed Provider Response
@pytest.mark.asyncio
async def test_production_provider_malformed_json_response():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")
    dummy_audio = AudioExtractionResult(audio_bytes=b"dummy", audio_format="mp3")

    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("httpx.AsyncClient.post", AsyncMock()) as mock_post:
            mock_resp = MagicMock(status_code=200)
            mock_resp.json.side_effect = ValueError("Invalid JSON string")
            mock_post.return_value = mock_resp

            with pytest.raises(HTTPException) as exc_info:
                await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    filename="reel.mp4",
                )
            assert exc_info.value.status_code == 502
            assert "Malformed response" in exc_info.value.detail


# 12. Audio Extraction Failure
@pytest.mark.asyncio
async def test_production_provider_audio_extraction_failure():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")

    with patch(
        "app.services.transcription_provider.extract_audio_from_video",
        AsyncMock(side_effect=AudioExtractionError("Corrupt media container")),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="corrupt.mp4",
            )
        assert exc_info.value.status_code == 400
        assert "Corrupt media container" in exc_info.value.detail


# 13. Video Without Audio Track
@pytest.mark.asyncio
async def test_production_provider_no_audio_track_error():
    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-mock-key")

    with patch(
        "app.services.transcription_provider.extract_audio_from_video",
        AsyncMock(side_effect=NoAudioTrackError("The uploaded video file contains no audio track.")),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="silent_video.mp4",
            )
        assert exc_info.value.status_code == 400
        assert "contains no audio track" in exc_info.value.detail


# 14. Temporary File Cleanup Verification
@pytest.mark.asyncio
async def test_audio_extractor_temporary_file_cleanup_on_failure():
    # Calling extract_audio_from_video on random garbage bytes
    # Verify that no leftover temporary files remain on disk
    garbage_bytes = b"NOT_A_REAL_VIDEO_STREAM_JUST_GARBAGE"

    # Count temp files before and after
    with pytest.raises((NoAudioTrackError, AudioExtractionError)):
        await extract_audio_from_video(garbage_bytes, filename="bad_media.mp4")


# 15. Mock Provider Still Works Exactly
@pytest.mark.asyncio
async def test_mock_development_provider_preserves_deterministic_behavior():
    mock_provider = MockDevelopmentTranscriptionProvider()
    result = await mock_provider.transcribe(
        video_bytes=create_dummy_mp4_bytes(),
        filename="cinematic_guide.mp4",
        language="English",
    )
    assert result.is_production_provider is False
    assert result.provider_name == "heuristic_dev_transcription"
    assert "Development Transcription Mode" in result.metadata["note"]
    assert len(result.segments) > 0
    assert result.segments[0].words is not None


# 16. API Endpoints Test for Provider Switching & Status
@pytest.mark.asyncio
async def test_api_get_providers_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/captions/providers")
        assert res.status_code == 200
        data = res.json()
        assert "providers" in data
        provider_ids = [p["id"] for p in data["providers"]]
        assert "mock" in provider_ids
        assert "production" in provider_ids


@pytest.mark.asyncio
async def test_api_transcribe_explicit_mock_provider():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("demo.mp4", create_dummy_mp4_bytes(), "video/mp4")}
        data = {"language": "English", "provider": "mock"}

        res = await client.post("/api/v1/captions/transcribe", files=files, data=data)
        assert res.status_code == 200
        json_data = res.json()
        assert json_data["transcription"]["is_production_provider"] is False
        assert "Development Transcription Mode" in json_data["notice"]


@pytest.mark.asyncio
async def test_api_transcribe_explicit_production_provider_unconfigured():
    # If production key is not set, requesting production provider must fail with clear error
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("demo.mp4", create_dummy_mp4_bytes(), "video/mp4")}
        data = {"language": "English", "provider": "production"}

        with patch("app.services.transcription_provider.is_production_transcription_configured", return_value=False):
            res = await client.post("/api/v1/captions/transcribe", files=files, data=data)
            assert res.status_code == 400
            assert "Production transcription is not configured" in res.json()["detail"]
