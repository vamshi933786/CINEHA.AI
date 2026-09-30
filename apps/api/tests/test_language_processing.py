import pytest
import json
import httpx
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException
from httpx import Response, Request

from app.core.config import settings
from app.schemas.captions import (
    TranscriptSegment,
    TranscriptWord,
    LanguageProcessingRequest,
    LanguageProcessingResult,
    ProcessedTranscriptSegment,
)
from app.services.language_processor import (
    MockDevelopmentLanguageProcessor,
    ProductionLanguageProcessorAdapter,
    get_language_processor,
    validate_language_processing_request,
    is_production_language_processor_configured,
)
from app.services.caption_service import CaptionService


@pytest.fixture
def sample_segments_english():
    return [
        TranscriptSegment(
            id="seg_0",
            text="Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
            start_time=0.0,
            end_time=3.5,
            words=[
                TranscriptWord(text="Stop", start_time=0.0, end_time=0.3),
                TranscriptWord(text="shooting", start_time=0.3, end_time=0.7),
            ],
            speaker="Speaker 1",
            confidence=0.95,
        ),
        TranscriptSegment(
            id="seg_1",
            text="60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
            start_time=3.8,
            end_time=7.5,
            words=[
                TranscriptWord(text="60fps", start_time=3.8, end_time=4.1),
            ],
            speaker="Speaker 1",
            confidence=0.92,
        ),
    ]


@pytest.fixture
def sample_segments_telugu():
    return [
        TranscriptSegment(
            id="seg_0",
            text="60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.",
            start_time=0.0,
            end_time=3.5,
            words=[
                TranscriptWord(text="60fps", start_time=0.0, end_time=0.4),
                TranscriptWord(text="లో", start_time=0.4, end_time=0.6),
            ],
            confidence=0.96,
        ),
        TranscriptSegment(
            id="seg_1",
            text="60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.",
            start_time=3.8,
            end_time=7.5,
            confidence=0.93,
        ),
    ]


@pytest.fixture
def sample_segments_hindi():
    return [
        TranscriptSegment(
            id="seg_0",
            text="60fps पर शूट करना बंद करें! यह 1-सेकंड की कैमरा सेटिंग है जो मोबाइल फुटेज को सिनेमा जैसा बनाती है।",
            start_time=0.0,
            end_time=3.5,
            confidence=0.95,
        ),
        TranscriptSegment(
            id="seg_1",
            text="60fps बिना किसी ऑर्गेनिक मोशन ब्लर के कठोर और अस्वाभाविक सोप-ओपेरा प्रभाव पैदा करता है।",
            start_time=3.8,
            end_time=7.5,
            confidence=0.91,
        ),
    ]


# 1. Validation and Language Pair Tests
def test_validation_rejects_empty_segments():
    with pytest.raises(HTTPException) as exc:
        validate_language_processing_request("English", "Telugu", "translation", [])
    assert exc.value.status_code == 400
    assert "No transcript segments were provided" in exc.value.detail


def test_validation_rejects_identical_languages(sample_segments_english):
    with pytest.raises(HTTPException) as exc:
        validate_language_processing_request("English", "English", "translation", sample_segments_english)
    assert exc.value.status_code == 400
    assert "identical" in exc.value.detail


def test_validation_rejects_tanglish_translation_attempt(sample_segments_telugu):
    # Tanglish is transliteration, NOT translation
    with pytest.raises(HTTPException) as exc:
        validate_language_processing_request("Telugu", "Tanglish", "translation", sample_segments_telugu)
    assert exc.value.status_code == 400
    assert "transliteration" in exc.value.detail
    assert "not translation" in exc.value.detail


def test_validation_rejects_transliteration_for_english_source(sample_segments_english):
    with pytest.raises(HTTPException) as exc:
        validate_language_processing_request("English", "Telugu", "transliteration", sample_segments_english)
    assert exc.value.status_code == 400
    assert "Supported transliteration pairs" in exc.value.detail


def test_validation_rejects_transliteration_to_tanglish_from_non_telugu(sample_segments_hindi):
    with pytest.raises(HTTPException) as exc:
        validate_language_processing_request("Hindi", "Tanglish", "transliteration", sample_segments_hindi)
    assert exc.value.status_code == 400
    assert "Romanized Telugu script" in exc.value.detail


# 2. Mock Development Processor: English -> Telugu
@pytest.mark.asyncio
async def test_mock_english_to_telugu_translation(sample_segments_english):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="English",
        target_language="Telugu",
        processing_mode="translation",
        segments=sample_segments_english,
    )
    result = await processor.process(req)

    assert result.source_language == "English"
    assert result.target_language == "Telugu"
    assert result.target_language_code == "te"
    assert result.script_type == "Telugu"
    assert result.is_transliteration is False
    assert result.is_production_provider is False
    assert "Development Language Processing Mode" in result.notice
    assert len(result.segments) == 2

    # Check segment preservation
    assert result.segments[0].id == "seg_0"
    assert result.segments[0].start_time == 0.0
    assert result.segments[0].end_time == 3.5
    assert "షూట్ చేయడం ఆపండి" in result.segments[0].text
    assert result.segments[0].original_text == sample_segments_english[0].text

    # Word timings marked unavailable
    assert result.word_timings_available is False
    assert result.segments[0].words == []


# 3. Mock Development Processor: English -> Hindi
@pytest.mark.asyncio
async def test_mock_english_to_hindi_translation(sample_segments_english):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="English",
        target_language="Hindi",
        processing_mode="translation",
        segments=sample_segments_english,
    )
    result = await processor.process(req)

    assert result.target_language == "Hindi"
    assert result.target_language_code == "hi"
    assert result.script_type == "Devanagari"
    assert result.is_transliteration is False
    assert "शूट करना बंद करें" in result.segments[0].text
    assert result.segments[1].start_time == 3.8
    assert result.segments[1].end_time == 7.5


# 4. Mock Development Processor: Telugu -> English
@pytest.mark.asyncio
async def test_mock_telugu_to_english_translation(sample_segments_telugu):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="Telugu",
        target_language="English",
        processing_mode="translation",
        segments=sample_segments_telugu,
    )
    result = await processor.process(req)

    assert result.target_language == "English"
    assert result.target_language_code == "en"
    assert result.script_type == "Latin"
    assert "Stop shooting at 60fps!" in result.segments[0].text
    assert result.segments[0].start_time == 0.0
    assert result.segments[0].end_time == 3.5


# 5. Mock Development Processor: Telugu -> Hindi
@pytest.mark.asyncio
async def test_mock_telugu_to_hindi_translation(sample_segments_telugu):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="Telugu",
        target_language="Hindi",
        processing_mode="translation",
        segments=sample_segments_telugu,
    )
    result = await processor.process(req)

    assert result.target_language == "Hindi"
    assert result.target_language_code == "hi"
    assert "शूट करना बंद करें" in result.segments[0].text


# 6. Mock Development Processor: Telugu -> Tanglish (Transliteration)
@pytest.mark.asyncio
async def test_mock_telugu_to_tanglish_transliteration(sample_segments_telugu):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="Telugu",
        target_language="Tanglish",
        processing_mode="transliteration",
        segments=sample_segments_telugu,
    )
    result = await processor.process(req)

    assert result.target_language == "Tanglish"
    assert result.target_language_code == "te-Latn"
    assert result.is_transliteration is True
    assert result.script_type == "Latin"
    assert result.processing_mode == "transliteration"

    # Verify phonetic Romanized output (NOT English translation)
    seg0_tanglish = result.segments[0].text.lower()
    assert "shoot cheyadam aapandi" in seg0_tanglish
    assert "cinema laaga" in seg0_tanglish

    # Timings strictly preserved
    assert result.segments[0].start_time == 0.0
    assert result.segments[0].end_time == 3.5
    assert result.segments[1].start_time == 3.8
    assert result.segments[1].end_time == 7.5

    # Word timings marked unavailable
    assert result.word_timings_available is False
    assert result.segments[0].words == []


# 7. Mock Development Processor: Hindi -> English
@pytest.mark.asyncio
async def test_mock_hindi_to_english_translation(sample_segments_hindi):
    processor = MockDevelopmentLanguageProcessor()
    req = LanguageProcessingRequest(
        source_language="Hindi",
        target_language="English",
        processing_mode="translation",
        segments=sample_segments_hindi,
    )
    result = await processor.process(req)

    assert result.target_language == "English"
    assert "Stop shooting at 60fps!" in result.segments[0].text


# 8. Production Language Processor Adapter — Unconfigured credentials
@pytest.mark.asyncio
async def test_production_adapter_unconfigured_raises_400(sample_segments_english):
    with patch.object(settings, "LANGUAGE_PROCESSOR_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""):
        adapter = ProductionLanguageProcessorAdapter()
        req = LanguageProcessingRequest(
            source_language="English",
            target_language="Telugu",
            processing_mode="translation",
            segments=sample_segments_english,
        )
        with pytest.raises(HTTPException) as exc:
            await adapter.process(req)
        assert exc.value.status_code == 400
        assert "Production language processing is not configured" in exc.value.detail


# 9. Production Language Processor Adapter — Successful translation
@pytest.mark.asyncio
async def test_production_adapter_successful_translation(sample_segments_english):
    adapter = ProductionLanguageProcessorAdapter(api_key="test-sk-12345")

    mock_llm_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "segments": [
                            {"id": "seg_0", "text": "60fps లో రికార్డ్ చేయడం ఆపండి!"},
                            {"id": "seg_1", "text": "60fps కఠినమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను తెస్తుంది."},
                        ]
                    })
                }
            }
        ]
    }

    dummy_request = Request("POST", "https://api.openai.com/v1/chat/completions")
    fake_response = Response(status_code=200, json=mock_llm_response, request=dummy_request)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_response

        req = LanguageProcessingRequest(
            source_language="English",
            target_language="Telugu",
            processing_mode="translation",
            segments=sample_segments_english,
        )
        result = await adapter.process(req)

        assert result.is_production_provider is True
        assert result.provider_name == "openai_language_processor"
        assert result.notice is None
        assert result.target_language == "Telugu"
        assert result.target_language_code == "te"
        assert result.script_type == "Telugu"
        assert len(result.segments) == 2
        assert result.segments[0].text == "60fps లో రికార్డ్ చేయడం ఆపండి!"
        assert result.segments[0].start_time == 0.0
        assert result.segments[0].end_time == 3.5
        assert result.word_timings_available is False


# 10. Production Language Processor Adapter — Error handling (401 and 502)
@pytest.mark.asyncio
async def test_production_adapter_401_error(sample_segments_english):
    adapter = ProductionLanguageProcessorAdapter(api_key="bad-key")
    dummy_req = Request("POST", "https://api.openai.com/v1/chat/completions")
    fake_resp = Response(status_code=401, json={"error": "Invalid API key"}, request=dummy_req)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_resp

        req = LanguageProcessingRequest(
            source_language="English",
            target_language="Telugu",
            processing_mode="translation",
            segments=sample_segments_english,
        )
        with pytest.raises(HTTPException) as exc:
            await adapter.process(req)
        assert exc.value.status_code == 401
        assert "authentication failed" in exc.value.detail


@pytest.mark.asyncio
async def test_production_adapter_500_maps_to_502(sample_segments_english):
    adapter = ProductionLanguageProcessorAdapter(api_key="valid-key")
    dummy_req = Request("POST", "https://api.openai.com/v1/chat/completions")
    fake_resp = Response(status_code=500, text="Internal Server Error", request=dummy_req)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = fake_resp

        req = LanguageProcessingRequest(
            source_language="English",
            target_language="Telugu",
            processing_mode="translation",
            segments=sample_segments_english,
        )
        with pytest.raises(HTTPException) as exc:
            await adapter.process(req)
        assert exc.value.status_code == 502
        assert "returned error status 500" in exc.value.detail


# 11. CaptionService integration test
@pytest.mark.asyncio
async def test_caption_service_process_language(sample_segments_english):
    service = CaptionService()
    req = LanguageProcessingRequest(
        source_language="English",
        target_language="Hindi",
        processing_mode="translation",
        segments=sample_segments_english,
        provider="mock",
    )
    resp = await service.process_language(req)
    assert resp.result.target_language == "Hindi"
    assert resp.notice is not None
    assert len(resp.result.segments) == 2


# 12. Factory tests
def test_get_language_processor_factory():
    proc_mock = get_language_processor("mock")
    assert isinstance(proc_mock, MockDevelopmentLanguageProcessor)

    proc_prod = get_language_processor("production")
    assert isinstance(proc_prod, ProductionLanguageProcessorAdapter)


# 13. Test configuration detection
def test_is_production_language_processor_configured():
    with patch.object(settings, "LANGUAGE_PROCESSOR_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""):
        assert is_production_language_processor_configured() is False

    with patch.object(settings, "LANGUAGE_PROCESSOR_API_KEY", "test-key"):
        assert is_production_language_processor_configured() is True
