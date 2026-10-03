import io
import math
import pytest
import numpy as np
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services.audio_extractor import AudioExtractionResult
from app.services.transcription_provider import (
    LocalWhisperTranscriptionProvider,
    is_local_whisper_available,
    get_local_whisper_model,
    get_transcription_provider,
    _LOCAL_WHISPER_MODELS,
)


class DummyFasterWhisperWord:
    def __init__(self, start: float, end: float, word: str, probability: float = 0.95):
        self.start = start
        self.end = end
        self.word = word
        self.probability = probability


class DummyFasterWhisperSegment:
    def __init__(
        self,
        id: int,
        start: float,
        end: float,
        text: str,
        words=None,
        avg_logprob: float = -0.05,
    ):
        self.id = id
        self.seek = 0
        self.start = start
        self.end = end
        self.text = text
        self.words = words or []
        self.avg_logprob = avg_logprob


class DummyTranscriptionInfo:
    def __init__(self, language: str = "en", language_probability: float = 0.98, duration: float = 4.5):
        self.language = language
        self.language_probability = language_probability
        self.duration = duration


def create_dummy_mp4_bytes() -> bytes:
    # 32-byte minimal MP4 signature
    return b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08free"


def test_local_whisper_availability():
    """Verify local whisper availability checker returns boolean."""
    avail = is_local_whisper_available()
    assert isinstance(avail, bool)
    assert avail is True  # Installed in our Apple Silicon python env


def test_provider_factory_local_whisper():
    """Verify factory returns LocalWhisperTranscriptionProvider for 'local_whisper' and 'local'."""
    p1 = get_transcription_provider("local_whisper")
    assert isinstance(p1, LocalWhisperTranscriptionProvider)
    assert p1.provider_name == "local_whisper"
    assert p1.is_production_provider is True

    p2 = get_transcription_provider("local")
    assert isinstance(p2, LocalWhisperTranscriptionProvider)


def test_model_caching_singleton():
    """Verify get_local_whisper_model caches loaded models and returns the singleton."""
    fake_model = MagicMock()
    _LOCAL_WHISPER_MODELS["test_model_unit"] = fake_model

    retrieved = get_local_whisper_model("test_model_unit")
    assert retrieved is fake_model


@pytest.mark.asyncio
async def test_local_whisper_unavailable_raises_503():
    """Verify provider raises 503 if faster-whisper runtime is unavailable."""
    provider = LocalWhisperTranscriptionProvider()
    with patch.object(provider, "is_available", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            await provider.transcribe(video_bytes=create_dummy_mp4_bytes(), filename="test.mp4")
        assert exc_info.value.status_code == 503
        assert "Local Whisper speech recognition runtime is not available" in exc_info.value.detail


@pytest.mark.asyncio
async def test_local_whisper_transcription_with_genuine_word_timings():
    """Verify LocalWhisperTranscriptionProvider accurately parses real model segments and words."""
    dummy_audio = AudioExtractionResult(
        audio_bytes=b"RIFF" + b"\x00" * 100,
        audio_format="mp3",
    )
    dummy_pcm = np.zeros(16000 * 3, dtype=np.float32)

    mock_words = [
        DummyFasterWhisperWord(start=0.0, end=0.5, word="Stop"),
        DummyFasterWhisperWord(start=0.5, end=1.0, word="shooting"),
        DummyFasterWhisperWord(start=1.0, end=1.4, word="now."),
    ]
    mock_segments = [
        DummyFasterWhisperSegment(
            id=0,
            start=0.0,
            end=1.5,
            text="Stop shooting now.",
            words=mock_words,
            avg_logprob=-0.05,
        )
    ]
    mock_info = DummyTranscriptionInfo(language="en", duration=1.5)

    mock_model = MagicMock()
    mock_model.transcribe.return_value = (iter(mock_segments), mock_info)

    provider = LocalWhisperTranscriptionProvider(model_size="base")

    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("app.services.transcription_provider.convert_audio_to_pcm_array", AsyncMock(return_value=dummy_pcm)):
            with patch("app.services.transcription_provider.get_local_whisper_model", return_value=mock_model):
                res = await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    filename="sample.mp4",
                    language="English",
                )

    assert res.provider_name == "local_whisper"
    assert res.is_production_provider is True
    assert res.language == "English"
    assert res.language_code == "en"
    assert len(res.segments) == 1
    assert res.segments[0].text == "Stop shooting now."
    assert len(res.segments[0].words) == 3
    assert res.segments[0].words[0].text == "Stop"
    assert res.segments[0].words[0].start_time == 0.0
    assert res.segments[0].words[0].end_time == 0.5
    assert res.metadata["word_timings_available"] is True
    assert res.metadata["is_local_inference"] is True


@pytest.mark.asyncio
async def test_local_whisper_telugu_and_tanglish_routing():
    """Verify Telugu and Tanglish correctly use Telugu language recognition."""
    dummy_audio = AudioExtractionResult(audio_bytes=b"RIFF\x00", audio_format="mp3")
    dummy_pcm = np.zeros(16000 * 2, dtype=np.float32)

    telugu_text = "సినిమా షూటింగ్ ఆపండి."
    mock_words = [
        DummyFasterWhisperWord(start=0.0, end=0.8, word="సినిమా"),
        DummyFasterWhisperWord(start=0.8, end=1.4, word="షూటింగ్"),
        DummyFasterWhisperWord(start=1.4, end=1.8, word="ఆపండి."),
    ]
    mock_segments = [
        DummyFasterWhisperSegment(
            id=0,
            start=0.0,
            end=1.8,
            text=telugu_text,
            words=mock_words,
        )
    ]
    mock_info = DummyTranscriptionInfo(language="te", duration=1.8)

    mock_model = MagicMock()
    mock_model.transcribe.return_value = (iter(mock_segments), mock_info)

    provider = LocalWhisperTranscriptionProvider(model_size="base")

    # 1. Native Telugu request
    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("app.services.transcription_provider.convert_audio_to_pcm_array", AsyncMock(return_value=dummy_pcm)):
            with patch("app.services.transcription_provider.get_local_whisper_model", return_value=mock_model):
                res_telugu = await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    language="Telugu",
                )
    assert res_telugu.language == "Telugu"
    assert res_telugu.language_code == "te"
    assert res_telugu.script_type == "Telugu"
    assert res_telugu.segments[0].text == telugu_text

    # 2. Tanglish request — speech recognition outputs Telugu script, transliteration note recorded
    mock_model.transcribe.return_value = (iter(mock_segments), mock_info)
    with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
        with patch("app.services.transcription_provider.convert_audio_to_pcm_array", AsyncMock(return_value=dummy_pcm)):
            with patch("app.services.transcription_provider.get_local_whisper_model", return_value=mock_model):
                res_tanglish = await provider.transcribe(
                    video_bytes=create_dummy_mp4_bytes(),
                    language="Tanglish",
                )
    assert res_tanglish.language == "Telugu"
    assert res_tanglish.language_code == "te"
    assert res_tanglish.script_type == "Telugu"
    assert "underlying_speech_language" in res_tanglish.metadata
    assert res_tanglish.metadata["underlying_speech_language"] == "te"


@pytest.mark.asyncio
async def test_api_get_providers_includes_local_whisper():
    """Verify GET /api/v1/captions/providers returns local_whisper with configured status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/captions/providers")
        assert res.status_code == 200
        data = res.json()
        assert "default_provider" in data
        assert "is_local_whisper_configured" in data
        assert data["is_local_whisper_configured"] is True

        provider_ids = [p["id"] for p in data["providers"]]
        assert "local_whisper" in provider_ids
        assert "production" in provider_ids
        assert "mock" in provider_ids

        local_p = next(p for p in data["providers"] if p["id"] == "local_whisper")
        assert local_p["name"] == "Local Whisper"
        assert local_p["is_production"] is True
        assert local_p["is_configured"] is True


@pytest.mark.asyncio
async def test_api_transcribe_with_local_whisper_provider():
    """Verify POST /api/v1/captions/transcribe accepts provider='local_whisper' and returns valid response."""
    dummy_audio = AudioExtractionResult(audio_bytes=b"RIFF\x00", audio_format="mp3")
    dummy_pcm = np.zeros(16000 * 2, dtype=np.float32)

    mock_words = [
        DummyFasterWhisperWord(start=0.0, end=1.0, word="Cinematic"),
        DummyFasterWhisperWord(start=1.0, end=1.8, word="captions"),
    ]
    mock_segments = [
        DummyFasterWhisperSegment(
            id=0,
            start=0.0,
            end=1.8,
            text="Cinematic captions",
            words=mock_words,
        )
    ]
    mock_info = DummyTranscriptionInfo(language="en", duration=1.8)

    mock_model = MagicMock()
    mock_model.transcribe.return_value = (iter(mock_segments), mock_info)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("demo.mp4", create_dummy_mp4_bytes(), "video/mp4")}
        data = {"language": "English", "provider": "local_whisper"}

        with patch("app.services.transcription_provider.extract_audio_from_video", AsyncMock(return_value=dummy_audio)):
            with patch("app.services.transcription_provider.convert_audio_to_pcm_array", AsyncMock(return_value=dummy_pcm)):
                with patch("app.services.transcription_provider.get_local_whisper_model", return_value=mock_model):
                    res = await client.post("/api/v1/captions/transcribe", files=files, data=data)

        assert res.status_code == 200
        json_data = res.json()
        assert json_data["notice"] is None  # Never mock warning for local real STT
        assert json_data["transcription"]["provider_name"] == "local_whisper"
        assert json_data["transcription"]["is_production_provider"] is True
        assert len(json_data["transcription"]["segments"]) == 1
        assert len(json_data["transcription"]["segments"][0]["words"]) == 2
