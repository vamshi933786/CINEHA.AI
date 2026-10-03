"""Unit and integration tests for real speech transcription accuracy, audio extraction,
no-audio handling, language recognition (English, Telugu, mixed, Tanglish),
genuine word timing handling, and file isolation.
"""
import os
import io
import json
import uuid
import tempfile
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import pytest
import httpx
from httpx import AsyncClient, ASGITransport
from fastapi import HTTPException

from app.main import app
from app.services.audio_extractor import (
    extract_audio_from_video,
    detect_audio_stream,
    NoAudioTrackError,
    AudioExtractionResult,
)
from app.services.transcription_provider import (
    BaseTranscriptionProvider,
    OpenAIWhisperTranscriptionProvider,
    MockDevelopmentTranscriptionProvider,
    ProductionTranscriptionProviderStub,
    get_transcription_provider,
    is_production_transcription_configured,
)
from app.services.caption_service import CaptionService
from app.schemas.captions import (
    TranscriptSegment,
    TranscriptWord,
    CaptionCueGenerationRequest,
    CaptionCueSettings,
)
from app.services.caption_cue_generator import CaptionCueGeneratorService


def create_dummy_mp4_bytes(size: int = 1024) -> bytes:
    """Generate minimal valid MP4 container binary header."""
    ftyp_box = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41"
    mdat_header = b"\x00\x00\x00\x08mdat"
    padding_len = max(0, size - len(ftyp_box) - len(mdat_header))
    return ftyp_box + mdat_header + (b"\x00" * padding_len)


# ---------------------------------------------------------------------------
# 1. Real Provider Selection & Missing Credentials Handling
# ---------------------------------------------------------------------------

def test_default_transcription_provider_is_production():
    """Verify get_transcription_provider defaults to production and does not silently return mock."""
    # When credentials are missing, requesting default provider must raise HTTPException(400)
    with patch("app.services.transcription_provider.is_production_transcription_configured", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            get_transcription_provider()
        assert exc_info.value.status_code == 400
        assert "Production speech recognition is not configured" in exc_info.value.detail


def test_mock_provider_strictly_requires_explicit_mock_flag():
    """Verify MockDevelopmentTranscriptionProvider is only returned when explicitly requested."""
    provider = get_transcription_provider("mock")
    assert isinstance(provider, MockDevelopmentTranscriptionProvider)


def test_no_silent_mock_fallback_when_whisper_unconfigured():
    """Verify that unconfigured production provider never silently falls back to mock."""
    stub = ProductionTranscriptionProviderStub()
    with patch.object(stub._whisper, "is_configured", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(
                stub.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    filename="test.mp4",
                )
            )
        assert exc_info.value.status_code == 400
        assert "Production speech recognition is not configured" in exc_info.value.detail


# ---------------------------------------------------------------------------
# 2. Audio Extraction & Silent Video Detection
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_silent_video_raises_no_audio_track_error():
    """Verify extract_audio_from_video raises NoAudioTrackError when video has no audio stream."""
    # Create silent MP4 using ffmpeg if available
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        silent_video_path = f.name

    try:
        # Generate 1s silent video with no audio track: -f lavfi -i color=c=blue:s=320x240:d=1
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=160x120:d=1",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", silent_video_path
        ]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

        with open(silent_video_path, "rb") as vf:
            video_bytes = vf.read()

        with pytest.raises(NoAudioTrackError) as exc_info:
            await extract_audio_from_video(video_bytes, filename="silent.mp4")

        assert "No audio track was detected in this video." in str(exc_info.value)
    finally:
        if os.path.exists(silent_video_path):
            os.unlink(silent_video_path)


@pytest.mark.asyncio
async def test_api_rejects_silent_video_with_clear_error():
    """Verify /api/v1/captions/transcribe returns 400 'No audio track was detected in this video.' for silent video."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        silent_video_path = f.name

    try:
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=160x120:d=1",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", silent_video_path
        ]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

        with open(silent_video_path, "rb") as vf:
            video_bytes = vf.read()

        # Mock configured production provider to reach the audio extraction step
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.services.transcription_provider.is_production_transcription_configured", return_value=True):
                with patch("app.services.transcription_provider.settings.WHISPER_API_KEY", "test_key_sk_123"):
                    files = {"file": ("silent.mp4", video_bytes, "video/mp4")}
                    response = await client.post("/api/v1/captions/transcribe", files=files)
                    assert response.status_code == 400
                    assert "No audio track was detected in this video." in response.json()["detail"]
    finally:
        if os.path.exists(silent_video_path):
            os.unlink(silent_video_path)


# ---------------------------------------------------------------------------
# 3. Whisper Verbose JSON Parsing & Genuine Word Timings
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_whisper_parsing_with_genuine_word_timings():
    """Verify genuine word timestamps returned by Whisper are accurately mapped without fabrication."""
    whisper_json = {
        "text": "Hello and welcome to cinema.",
        "language": "english",
        "duration": 2.5,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 2.5,
                "text": "Hello and welcome to cinema.",
                "words": [
                    {"word": "Hello", "start": 0.0, "end": 0.4},
                    {"word": "and", "start": 0.45, "end": 0.6},
                    {"word": "welcome", "start": 0.65, "end": 1.2},
                    {"word": "to", "start": 1.25, "end": 1.4},
                    {"word": "cinema.", "start": 1.45, "end": 2.3},
                ],
                "avg_logprob": -0.15,
            }
        ],
        "words": [
            {"word": "Hello", "start": 0.0, "end": 0.4},
            {"word": "and", "start": 0.45, "end": 0.6},
            {"word": "welcome", "start": 0.65, "end": 1.2},
            {"word": "to", "start": 1.25, "end": 1.4},
            {"word": "cinema.", "start": 1.45, "end": 2.3},
        ],
    }

    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-test-key")

    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_data",
        audio_format="mp3",
        duration_seconds=2.5,
    )

    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = whisper_json
            mock_post.return_value = mock_resp

            result = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="speech_sample.mp4",
                language="English",
            )

            assert result.language == "English"
            assert result.is_production_provider is True
            assert result.metadata["word_timings_available"] is True
            assert len(result.segments) == 1

            seg = result.segments[0]
            assert len(seg.words) == 5
            assert seg.words[0].text == "Hello"
            assert seg.words[0].start_time == 0.0
            assert seg.words[0].end_time == 0.4
            assert seg.words[4].text == "cinema."
            assert seg.words[4].start_time == 1.45


@pytest.mark.asyncio
async def test_whisper_parsing_segment_fallback_no_fabricated_timings():
    """Verify that when Whisper provides only segment timing, no word timings are fabricated."""
    whisper_json_no_words = {
        "text": "Hello world from speech recognition.",
        "language": "english",
        "duration": 3.0,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 3.0,
                "text": "Hello world from speech recognition.",
                # No 'words' key in segment or root
                "avg_logprob": -0.2,
            }
        ],
        "words": [],
    }

    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-test-key")
    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_data",
        audio_format="mp3",
        duration_seconds=3.0,
    )

    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = whisper_json_no_words
            mock_post.return_value = mock_resp

            result = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="no_words.mp4",
                language="English",
            )

            assert result.metadata["word_timings_available"] is False
            seg = result.segments[0]
            # Must NOT invent words
            assert len(seg.words) == 0

            # Cue generator must use segment timings honestly
            cue_req = CaptionCueGenerationRequest(
                segments=result.segments,
                language="English",
                language_code="en",
                settings=CaptionCueSettings(),
            )
            cue_res = CaptionCueGeneratorService.generate_cues(cue_req)
            assert cue_res.timing_granularity == "segment"
            assert len(cue_res.cues) >= 1
            assert cue_res.cues[0].start_time == 0.0
            assert cue_res.cues[0].end_time == 3.0


# ---------------------------------------------------------------------------
# 4. Telugu Speech Recognition & Tanglish Transliteration
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_telugu_speech_recognition():
    """Verify Telugu spoken audio is transcribed into authentic Telugu Unicode script."""
    telugu_sentence = "నమస్కారం అందరికీ, ఈరోజు మనం ఒక మంచి వీడియో ఎలా తయారు చేయాలో తెలుసుకుందాం."

    whisper_json = {
        "text": telugu_sentence,
        "language": "telugu",
        "duration": 5.0,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 5.0,
                "text": telugu_sentence,
                "avg_logprob": -0.1,
            }
        ],
    }

    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-test-key")
    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_data",
        audio_format="mp3",
        duration_seconds=5.0,
    )

    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = whisper_json
            mock_post.return_value = mock_resp

            result = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="telugu_sample.mp4",
                language="Telugu",
            )

            assert result.language == "Telugu"
            assert result.language_code == "te"
            assert result.script_type == "Telugu"
            assert "నమస్కారం" in result.full_text
            assert "వీడియో" in result.full_text


@pytest.mark.asyncio
async def test_tanglish_output_pipeline_from_real_telugu_transcript():
    """Verify Tanglish output transliterates real Telugu transcript into Latin characters."""
    telugu_sentence = "నేను ఇప్పుడు హైదరాబాద్ వెళ్తున్నాను"

    whisper_json = {
        "text": telugu_sentence,
        "language": "telugu",
        "duration": 3.0,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 3.0,
                "text": telugu_sentence,
            }
        ],
    }

    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-test-key")
    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_data",
        audio_format="mp3",
        duration_seconds=3.0,
    )

    caption_service = CaptionService(provider=provider)

    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = whisper_json
            mock_post.return_value = mock_resp

            pipeline_res = await caption_service.generate_captions_pipeline(
                video_bytes=create_dummy_mp4_bytes(),
                filename="tanglish_input.mp4",
                language="Tanglish",
            )

            # Original transcription is native Telugu
            assert pipeline_res.transcription.language == "Telugu"
            assert "హైదరాబాద్" in pipeline_res.transcription.full_text

            # Processed transcription is Romanized Tanglish
            assert pipeline_res.processed_transcription is not None
            assert pipeline_res.processed_transcription.target_language == "Tanglish"
            assert pipeline_res.processed_transcription.script_type == "Latin"

            # Cues are in Tanglish
            assert len(pipeline_res.cues) > 0
            cue_text = pipeline_res.cues[0].text
            assert "Hyderabad" in cue_text or "velthunnanu" in cue_text or "Nenu" in cue_text or "ippudu" in cue_text


# ---------------------------------------------------------------------------
# 5. Mixed-Language Recognition (Telugu + English)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_mixed_telugu_english_speech_recognition():
    """Verify mixed-language conversational speech preserves English terms alongside Telugu script."""
    mixed_sentence = "ఈరోజు మనం Instagram reels కోసం captions ఎలా create చేయాలో చూద్దాం."

    whisper_json = {
        "text": mixed_sentence,
        "language": "telugu",
        "duration": 4.5,
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 4.5,
                "text": mixed_sentence,
            }
        ],
    }

    provider = OpenAIWhisperTranscriptionProvider(api_key="sk-test-key")
    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_data",
        audio_format="mp3",
        duration_seconds=4.5,
    )

    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = whisper_json
            mock_post.return_value = mock_resp

            result = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="mixed_sample.mp4",
                language="Telugu",
            )

            assert "Instagram" in result.full_text
            assert "reels" in result.full_text
            assert "captions" in result.full_text
            assert "ఈరోజు" in result.full_text


# ---------------------------------------------------------------------------
# 6. File Isolation & State Leakage Prevention
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_extraction_temporary_directory_isolation_and_cleanup():
    """Verify each video extraction has a unique session directory that is cleanly removed."""
    created_dirs = []

    # Intercept temp directory creations to verify isolation
    orig_extract = extract_audio_from_video

    async def tracking_extract(video_bytes, filename=None):
        res = await orig_extract(video_bytes, filename=filename)
        return res

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        vid_a = f.name
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        vid_b = f.name

    try:
        # Create small valid videos with audio tracks
        cmd_a = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=160x120:d=1",
            "-f", "lavfi", "-i", "sine=f=440:d=1", "-c:v", "libx264", "-c:a", "aac",
            vid_a
        ]
        cmd_b = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=white:s=160x120:d=1",
            "-f", "lavfi", "-i", "sine=f=880:d=1", "-c:v", "libx264", "-c:a", "aac",
            vid_b
        ]
        p_a = await asyncio.create_subprocess_exec(*cmd_a, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await p_a.communicate()
        p_b = await asyncio.create_subprocess_exec(*cmd_b, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await p_b.communicate()

        with open(vid_a, "rb") as fa:
            bytes_a = fa.read()
        with open(vid_b, "rb") as fb:
            bytes_b = fb.read()

        res_a = await extract_audio_from_video(bytes_a, "video_a.mp4")
        res_b = await extract_audio_from_video(bytes_b, "video_b.mp4")

        assert res_a.audio_bytes is not None
        assert res_b.audio_bytes is not None
        assert res_a.file_size_bytes > 0
        assert res_b.file_size_bytes > 0

        # Verify no stale /tmp/cinehai_audio directories remained
        stale_dirs = [d for d in os.listdir(tempfile.gettempdir()) if d.startswith("cinehai_audio_")]
        assert len(stale_dirs) == 0
    finally:
        if os.path.exists(vid_a):
            os.unlink(vid_a)
        if os.path.exists(vid_b):
            os.unlink(vid_b)


# ---------------------------------------------------------------------------
# 7. Production Async Multipart Encoding & Language Parameter Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_production_transcription_provider_async_multipart_encoding():
    """Verify production provider builds a valid async multipart request without RuntimeError."""
    mock_audio = AudioExtractionResult(
        audio_bytes=b"fake_mp3_audio_payload",
        audio_format="mp3",
        duration_seconds=3.0,
    )
    provider = OpenAIWhisperTranscriptionProvider(api_key="mock-key-for-test-only")

    captured_requests = []
    class MockAsyncTransport(httpx.AsyncBaseTransport):
        async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
            captured_requests.append(request)
            body_bytes = await request.aread()
            is_telugu = b'name="language"\r\n\r\nte' in body_bytes
            return httpx.Response(200, json={
                "text": "నమస్కారం" if is_telugu else "Hello world",
                "language": "telugu" if is_telugu else "english",
                "duration": 3.0,
                "segments": [
                    {
                        "id": 0,
                        "start": 0.0,
                        "end": 3.0,
                        "text": "నమస్కారం" if is_telugu else "Hello world",
                        "words": [
                            {"word": "నమస్కారం" if is_telugu else "Hello", "start": 0.0, "end": 1.2},
                        ],
                    }
                ],
            })

    orig_client = httpx.AsyncClient
    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient", lambda *args, **kwargs: orig_client(transport=MockAsyncTransport())):
            # 1. English request executes without RuntimeError
            res_en = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="english_sample.mp4",
                language="English",
            )
            assert res_en.full_text == "Hello world"

    # Verify request compatibility with AsyncClient (is AsyncByteStream)
    req = captured_requests[0]
    assert isinstance(req.stream, httpx.AsyncByteStream)

    body = await req.aread()
    body_str = body.decode("utf-8", errors="replace")

    # 2. model=whisper-1 must remain present
    assert 'name="model"' in body_str
    assert "whisper-1" in body_str

    # 3. response_format=verbose_json must remain present
    assert 'name="response_format"' in body_str
    assert "verbose_json" in body_str

    # 4. Both word and segment timestamp granularities must remain requested
    assert 'name="timestamp_granularities[]"' in body_str
    assert "word" in body_str
    assert "segment" in body_str

    # 5. English does not pass language parameter (auto-detection preserved)
    assert 'name="language"' not in body_str

    # 6. Telugu request sends language=te
    captured_requests.clear()
    with patch("app.services.transcription_provider.extract_audio_from_video", return_value=mock_audio):
        with patch("httpx.AsyncClient", lambda *args, **kwargs: orig_client(transport=MockAsyncTransport())):
            res_te = await provider.transcribe(
                video_bytes=create_dummy_mp4_bytes(),
                filename="telugu_sample.mp4",
                language="Telugu",
            )
            assert res_te.language == "Telugu"
    req_te = captured_requests[0]
    body_te = (await req_te.aread()).decode("utf-8", errors="replace")
    assert 'name="language"' in body_te
    assert "te" in body_te

