import pytest
import json
import httpx
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.captions import (
    TranscriptSegment,
    TranscriptWord,
    TranscriptionResult,
    CaptionCue,
)
from app.services.speech_restoration import (
    BaseSpeechRestorationProvider,
    GeminiSpeechRestorationProvider,
    DisabledSpeechRestorationProvider,
    SpeechRestorationResult,
    SpeechRestorationValidationError,
    validate_restoration_output,
    get_speech_restoration_provider,
)
from app.services.caption_service import CaptionService
from app.services.audio_extractor import AudioExtractionResult


@pytest.fixture
def sample_whisper_segments():
    """Real phonetic Whisper segments extracted from creator speech."""
    return [
        TranscriptSegment(
            id="seg_1",
            text="bho mhi videos vola cinematics garavalant e",
            start_time=0.0,
            end_time=2.22,
            words=[
                TranscriptWord(text="bho", start_time=0.0, end_time=0.5),
                TranscriptWord(text="mhi", start_time=0.5, end_time=1.0),
            ],
            confidence=0.88,
        ),
        TranscriptSegment(
            id="seg_2",
            text="mhi videos voli chaisa topi di ushtales na teknics end",
            start_time=2.22,
            end_time=4.98,
            words=[],
            confidence=0.85,
        ),
        TranscriptSegment(
            id="seg_3",
            text="ente composition and frame",
            start_time=4.98,
            end_time=6.62,
            words=[],
            confidence=0.91,
        ),
    ]


# ---------------------------------------------------------------------------
# 1. Telugu restoration provider initialization
# ---------------------------------------------------------------------------
def test_telugu_restoration_provider_initialization():
    provider = GeminiSpeechRestorationProvider(
        api_key="test-gemini-key",
        model="gemini-3.5-flash-lite",
    )
    assert isinstance(provider, BaseSpeechRestorationProvider)
    assert provider.api_key == "test-gemini-key"
    assert provider.model == "gemini-3.5-flash-lite"
    assert provider.provider_name == "gemini_speech_restoration"


# ---------------------------------------------------------------------------
# 2. Valid 1:1 segment mapping
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_valid_1_to_1_segment_mapping(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    mock_gemini_json = {
        "segments": [
            {"id": "seg_1", "text": "బ్రో, మీ వీడియోస్ లో సినిమాటిక్ గా రావాలి అంటే"},
            {"id": "seg_2", "text": "మీ వీడియోస్ లో షూట్ చేసేటప్పుడు యూజ్ చేసిన టెక్నిక్స్ ఏంటంటే"},
            {"id": "seg_3", "text": "అవి కంపోజిషన్ అండ్ ఫ్రేమింగ్"},
        ]
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    assert result.is_restored is True
    assert len(result.segments) == 3
    assert result.segments[0].id == "seg_1"
    assert result.segments[0].text == "బ్రో, మీ వీడియోస్ లో సినిమాటిక్ గా రావాలి అంటే"
    assert result.segments[1].id == "seg_2"
    assert result.segments[2].id == "seg_3"
    assert result.notice is None


# ---------------------------------------------------------------------------
# 3. Missing segment ID validation
# ---------------------------------------------------------------------------
def test_validation_missing_segment_id(sample_whisper_segments):
    # Only 2 out of 3 segments returned
    bad_json = {
        "segments": [
            {"id": "seg_1", "text": "బ్రో"},
            {"id": "seg_3", "text": "ఫ్రేమింగ్"},
        ]
    }
    with pytest.raises(SpeechRestorationValidationError, match="Segment count mismatch"):
        validate_restoration_output(sample_whisper_segments, bad_json)


# ---------------------------------------------------------------------------
# 4. Duplicate segment ID validation
# ---------------------------------------------------------------------------
def test_validation_duplicate_segment_id(sample_whisper_segments):
    bad_json = {
        "segments": [
            {"id": "seg_1", "text": "బ్రో"},
            {"id": "seg_1", "text": "డూప్లికేట్"},
            {"id": "seg_3", "text": "ఫ్రేమింగ్"},
        ]
    }
    with pytest.raises(SpeechRestorationValidationError, match="Duplicate segment ID 'seg_1'"):
        validate_restoration_output(sample_whisper_segments, bad_json)


# ---------------------------------------------------------------------------
# 5. Reordered segment IDs validation
# ---------------------------------------------------------------------------
def test_validation_reordered_segment_ids(sample_whisper_segments):
    # Out of order: seg_2 before seg_1
    bad_json = {
        "segments": [
            {"id": "seg_2", "text": "టెక్నిక్స్"},
            {"id": "seg_1", "text": "బ్రో"},
            {"id": "seg_3", "text": "ఫ్రేమింగ్"},
        ]
    }
    with pytest.raises(SpeechRestorationValidationError, match="Segment order or ID mismatch"):
        validate_restoration_output(sample_whisper_segments, bad_json)


# ---------------------------------------------------------------------------
# 6. Gemini malformed JSON
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_gemini_malformed_json(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "{malformed json here!"}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    # Safe fallback
    assert result.is_restored is False
    assert result.notice == "Telugu restoration unavailable; using local transcription."
    assert len(result.segments) == 3
    # Keeps original text
    assert result.segments[0].text == sample_whisper_segments[0].text


# ---------------------------------------------------------------------------
# 7. Gemini timeout
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_gemini_timeout(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Read timed out")):
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    assert result.is_restored is False
    assert result.notice == "Telugu restoration unavailable; using local transcription."
    assert result.metadata["fallback_reason"] == "timeout"
    assert len(result.segments) == 3
    assert result.segments[0].text == sample_whisper_segments[0].text


# ---------------------------------------------------------------------------
# 8. Gemini HTTP error
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_gemini_http_error(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Quota exceeded"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    assert result.is_restored is False
    assert result.notice == "Telugu restoration unavailable; using local transcription."
    assert "http_error_429" in result.metadata["fallback_reason"]
    assert len(result.segments) == 3


# ---------------------------------------------------------------------------
# 9. Gemini unavailable fallback (missing key)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_gemini_unavailable_fallback(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="")
    result = await provider.restore_telugu_speech(sample_whisper_segments)

    assert result.is_restored is False
    assert result.notice == "Telugu restoration unavailable; using local transcription."
    assert result.metadata["reason"] == "api_key_missing"
    assert result.segments == sample_whisper_segments


# ---------------------------------------------------------------------------
# 10. Whisper timestamps remain unchanged
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_whisper_timestamps_remain_unchanged(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    mock_gemini_json = {
        "segments": [
            {"id": "seg_1", "text": "బ్రో"},
            {"id": "seg_2", "text": "టెక్నిక్స్"},
            {"id": "seg_3", "text": "ఫ్రేమింగ్"},
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    for orig, restored in zip(sample_whisper_segments, result.segments):
        assert restored.start_time == orig.start_time
        assert restored.end_time == orig.end_time
        assert round(restored.start_time, 3) == round(orig.start_time, 3)
        assert round(restored.end_time, 3) == round(orig.end_time, 3)


# ---------------------------------------------------------------------------
# 11. Telugu restoration disabled via feature flag
# ---------------------------------------------------------------------------
def test_telugu_restoration_disabled_via_feature_flag():
    provider = get_speech_restoration_provider(enabled=False)
    assert isinstance(provider, DisabledSpeechRestorationProvider)


# ---------------------------------------------------------------------------
# 12. English bypasses restoration
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_english_bypasses_restoration():
    service = CaptionService()
    mock_provider = MagicMock()
    mock_provider.provider_name = "local_whisper"

    mock_transcription = TranscriptionResult(
        language="English",
        language_code="en",
        is_transliteration=False,
        script_type="Latin",
        segments=[
            TranscriptSegment(
                id="seg_0",
                text="Welcome to the video",
                start_time=0.0,
                end_time=2.0,
                words=[TranscriptWord(text="Welcome", start_time=0.0, end_time=0.8)],
            )
        ],
        full_text="Welcome to the video",
        duration_seconds=2.0,
        provider_name="local_whisper",
        is_production_provider=True,
    )
    mock_provider.transcribe = AsyncMock(return_value=mock_transcription)
    service._custom_provider = mock_provider

    with patch("app.services.speech_restoration.GeminiSpeechRestorationProvider.restore_telugu_speech") as mock_restore:
        with patch("app.services.caption_service.validate_video_upload") as mock_val:
            mock_val.return_value = MagicMock(
                filename="test.mp4", file_size_bytes=1000, declared_mime_type="video/mp4", mime_type="video/mp4", metadata={}
            )
            resp = await service.transcribe_video(
                video_bytes=b"dummy",
                filename="test.mp4",
                language="English",
                provider_type="local_whisper",
            )

    # Restoration must NOT be called for English
    mock_restore.assert_not_called()
    assert resp.transcription.provider_name == "local_whisper"
    assert len(resp.transcription.segments[0].words) == 1


# ---------------------------------------------------------------------------
# 13. Telugu uses restoration
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_telugu_uses_restoration():
    service = CaptionService()
    mock_provider = MagicMock()
    mock_provider.provider_name = "local_whisper"

    raw_segments = [
        TranscriptSegment(
            id="seg_0",
            text="bho mhi videos vola",
            start_time=0.0,
            end_time=2.5,
            words=[TranscriptWord(text="bho", start_time=0.0, end_time=0.5)],
        )
    ]
    mock_transcription = TranscriptionResult(
        language="Telugu",
        language_code="te",
        is_transliteration=False,
        script_type="Telugu",
        segments=raw_segments,
        full_text="bho mhi videos vola",
        duration_seconds=2.5,
        provider_name="local_whisper",
        is_production_provider=True,
    )
    mock_provider.transcribe = AsyncMock(return_value=mock_transcription)
    service._custom_provider = mock_provider

    mock_restored_segments = [
        TranscriptSegment(
            id="seg_0",
            text="బ్రో, మీ వీడియోస్ లో",
            start_time=0.0,
            end_time=2.5,
            words=[],
        )
    ]

    mock_restoration_result = SpeechRestorationResult(
        segments=mock_restored_segments,
        full_text="బ్రో, మీ వీడియోస్ లో",
        is_restored=True,
        provider_name="gemini_speech_restoration",
    )

    with patch("app.services.speech_restoration.GeminiSpeechRestorationProvider.restore_telugu_speech", AsyncMock(return_value=mock_restoration_result)):
        with patch.object(settings, "GEMINI_API_KEY", "valid-test-key"):
            with patch("app.services.caption_service.validate_video_upload") as mock_val:
                mock_val.return_value = MagicMock(
                    filename="test.mp4", file_size_bytes=1000, declared_mime_type="video/mp4", mime_type="video/mp4", metadata={}
                )
                resp = await service.transcribe_video(
                    video_bytes=b"dummy",
                    filename="test.mp4",
                    language="Telugu",
                    provider_type="local_whisper",
                )

    assert resp.transcription.provider_name == "Local Whisper + Gemini Telugu Restoration"
    assert resp.transcription.segments[0].text == "బ్రో, మీ వీడియోస్ లో"
    assert resp.transcription.segments[0].start_time == 0.0
    assert resp.transcription.segments[0].end_time == 2.5
    assert resp.transcription.metadata["speech_restoration"]["applied"] is True


# ---------------------------------------------------------------------------
# 14. Tanglish uses Telugu restoration before transliteration
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_tanglish_uses_telugu_restoration_before_transliteration():
    service = CaptionService()
    mock_provider = MagicMock()
    mock_provider.provider_name = "local_whisper"

    raw_segments = [
        TranscriptSegment(
            id="seg_0",
            text="bho mhi videos vola",
            start_time=0.0,
            end_time=2.2,
            words=[],
        )
    ]
    mock_transcription = TranscriptionResult(
        language="Telugu",
        language_code="te",
        is_transliteration=False,
        script_type="Telugu",
        segments=raw_segments,
        full_text="bho mhi videos vola",
        duration_seconds=2.2,
        provider_name="local_whisper",
        is_production_provider=True,
    )
    mock_provider.transcribe = AsyncMock(return_value=mock_transcription)
    service._custom_provider = mock_provider

    restored_telugu_segments = [
        TranscriptSegment(
            id="seg_0",
            text="బ్రో, మీ వీడియోస్ లో",
            start_time=0.0,
            end_time=2.2,
            words=[],
        )
    ]
    mock_restoration_result = SpeechRestorationResult(
        segments=restored_telugu_segments,
        full_text="బ్రో, మీ వీడియోస్ లో",
        is_restored=True,
        provider_name="gemini_speech_restoration",
    )

    with patch("app.services.speech_restoration.GeminiSpeechRestorationProvider.restore_telugu_speech", AsyncMock(return_value=mock_restoration_result)):
        with patch.object(settings, "GEMINI_API_KEY", "valid-test-key"):
            with patch("app.services.caption_service.validate_video_upload") as mock_val:
                mock_val.return_value = MagicMock(
                    filename="test.mp4", file_size_bytes=1000, declared_mime_type="video/mp4", mime_type="video/mp4", metadata={}
                )
                pipeline_resp = await service.generate_captions_pipeline(
                    video_bytes=b"dummy",
                    filename="test.mp4",
                    language="Tanglish",
                    provider_type="local_whisper",
                )

    # Output cues must be in Tanglish (Romanized Latin characters)
    assert pipeline_resp.selected_language == "Tanglish"
    assert len(pipeline_resp.cues) > 0
    cue_text = pipeline_resp.cues[0].text
    assert "bro" in cue_text.lower() or "video" in cue_text.lower() or "mee" in cue_text.lower()
    # Whisper timings preserved
    assert pipeline_resp.cues[0].start_time == 0.0
    assert pipeline_resp.cues[0].end_time == 2.2


# ---------------------------------------------------------------------------
# 15. No fabricated word timestamps
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_no_fabricated_word_timestamps(sample_whisper_segments):
    provider = GeminiSpeechRestorationProvider(api_key="test-key")

    mock_gemini_json = {
        "segments": [
            {"id": "seg_1", "text": "బ్రో, మీ వీడియోస్ లో"},
            {"id": "seg_2", "text": "టెక్నిక్స్"},
            {"id": "seg_3", "text": "ఫ్రేమింగ్"},
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(sample_whisper_segments)

    # Word timestamps must be empty, not fabricated
    for seg in result.segments:
        assert seg.words == []


# ---------------------------------------------------------------------------
# 16. Noise marker -> [శబ్దం]
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_noise_marker_restoration():
    provider = GeminiSpeechRestorationProvider(api_key="test-key")
    noise_segments = [
        TranscriptSegment(id="seg_noise", text="zzzzzz shhhhh", start_time=1.0, end_time=2.5)
    ]

    mock_gemini_json = {
        "segments": [
            {"id": "seg_noise", "text": "[శబ్దం]"}
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(noise_segments)

    assert result.is_restored is True
    assert result.segments[0].text == "[శబ్దం]"
    assert result.segments[0].start_time == 1.0
    assert result.segments[0].end_time == 2.5


# ---------------------------------------------------------------------------
# 17. Unintelligible speech marker -> [అర్థం కాని శబ్దం] / [అర్థం కాలేదు]
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_unintelligible_speech_marker_restoration():
    provider = GeminiSpeechRestorationProvider(api_key="test-key")
    garbled_segments = [
        TranscriptSegment(id="seg_garbled", text="xyz 123 blorp qux", start_time=3.0, end_time=4.5)
    ]

    mock_gemini_json = {
        "segments": [
            {"id": "seg_garbled", "text": "[అర్థం కాని శబ్దం]"}
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(garbled_segments)

    assert result.is_restored is True
    assert result.segments[0].text == "[అర్థం కాని శబ్దం]"
    assert result.segments[0].start_time == 3.0
    assert result.segments[0].end_time == 4.5


# ---------------------------------------------------------------------------
# 18. Code-switched terms are preserved
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_code_switched_terms_preserved():
    provider = GeminiSpeechRestorationProvider(api_key="test-key")
    code_switched_segments = [
        TranscriptSegment(
            id="seg_terms",
            text="technic sendente composition and frame content creator episode 7",
            start_time=5.0,
            end_time=9.0,
        )
    ]

    mock_gemini_json = {
        "segments": [
            {
                "id": "seg_terms",
                "text": "టెక్నిక్స్ ఏంటంటే composition and framing, content creator episode 7",
            }
        ]
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": json.dumps(mock_gemini_json)}]}}]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        result = await provider.restore_telugu_speech(code_switched_segments)

    assert result.is_restored is True
    text = result.segments[0].text
    assert "composition" in text.lower() or "framing" in text.lower()
    assert "content creator" in text.lower()
    assert "episode 7" in text.lower() or "7" in text
