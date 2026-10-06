import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException
from httpx import AsyncClient

from app.services.video_url_validator import (
    validate_and_normalize_video_url,
    is_ip_prohibited,
)
from app.services.video_url.youtube_provider import YouTubeVideoURLProvider
from app.services.video_url.instagram_provider import InstagramVideoURLProvider
from app.services.video_url.extraction_service import VideoURLExtractionService
from app.schemas.extraction import VideoURLScriptExtraction


# ==========================================
# 1. URL VALIDATOR & SSRF DEFENSE TESTS
# ==========================================

def test_ip_prohibited_checks():
    assert is_ip_prohibited("127.0.0.1") is True
    assert is_ip_prohibited("10.0.0.1") is True
    assert is_ip_prohibited("192.168.1.1") is True
    assert is_ip_prohibited("172.16.0.1") is True
    assert is_ip_prohibited("0.0.0.0") is True
    assert is_ip_prohibited("::1") is True
    assert is_ip_prohibited("8.8.8.8") is False
    assert is_ip_prohibited("1.1.1.1") is False


def test_youtube_url_normalization_valid():
    # Standard watch URL
    url, platform, video_id = validate_and_normalize_video_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert platform == "YouTube"
    assert video_id == "dQw4w9WgXcQ"
    assert url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    # Short youtu.be URL
    url, platform, video_id = validate_and_normalize_video_url("https://youtu.be/dQw4w9WgXcQ")
    assert platform == "YouTube"
    assert video_id == "dQw4w9WgXcQ"
    assert url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    # Shorts URL
    url, platform, video_id = validate_and_normalize_video_url("https://youtube.com/shorts/dQw4w9WgXcQ")
    assert platform == "YouTube"
    assert video_id == "dQw4w9WgXcQ"
    assert url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def test_instagram_url_normalization_valid():
    # Reel
    url, platform, shortcode = validate_and_normalize_video_url("https://www.instagram.com/reel/C3zYx1gL9mM/")
    assert platform == "Instagram"
    assert shortcode == "C3zYx1gL9mM"
    assert url == "https://www.instagram.com/reel/C3zYx1gL9mM/"

    # Post
    url, platform, shortcode = validate_and_normalize_video_url("https://instagram.com/p/C3zYx1gL9mM")
    assert platform == "Instagram"
    assert shortcode == "C3zYx1gL9mM"
    assert url == "https://www.instagram.com/reel/C3zYx1gL9mM/"


def test_reject_unsupported_platforms():
    # TikTok must be clearly rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_video_url("https://www.tiktok.com/@creator/video/1234567890")
    assert exc_info.value.status_code == 400
    assert "This platform is not supported" in exc_info.value.detail

    # Arbitrary domains
    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_video_url("https://vimeo.com/123456789")
    assert exc_info.value.status_code == 400
    assert "This platform is not supported" in exc_info.value.detail


def test_ssrf_prohibited_hosts():
    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_video_url("http://localhost:8000/watch?v=1234567890")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_video_url("http://127.0.0.1:8000/watch?v=1234567890")
    assert exc_info.value.status_code == 400


# ==========================================
# 2. PROVIDER UNIT TESTS WITH MOCKS
# ==========================================

@pytest.mark.asyncio
async def test_youtube_provider_transcript_api_success():
    provider = YouTubeVideoURLProvider()
    mock_snippets = [
        {"text": "First 3 seconds are critical.", "start": 0.0, "duration": 3.0},
        {"text": "Here is why your retention drops.", "start": 3.0, "duration": 4.0},
    ]

    with patch.object(provider, "_extract_metadata", new_callable=AsyncMock) as mock_meta:
        mock_meta.return_value = {
            "title": "Camera Secrets",
            "creator_name": "TestCreator",
            "description": "Cinema tips",
            "duration_seconds": 7.0,
        }
        with patch.object(provider, "_try_fetch_transcript_api", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "source_url": "https://www.youtube.com/watch?v=1234567890",
                "platform": "YouTube",
                "video_id": "1234567890",
                "title": "Camera Secrets",
                "duration_seconds": 7.0,
                "language": "English",
                "transcript": "First 3 seconds are critical.\n\nHere is why your retention drops.",
                "segments": [
                    {"id": "seg_0", "start": 0.0, "end": 3.0, "text": "First 3 seconds are critical."},
                    {"id": "seg_1", "start": 3.0, "end": 7.0, "text": "Here is why your retention drops."},
                ],
                "extraction_method": "official_transcript",
                "transcription_provider": "youtube_transcript_api",
                "confidence": 0.98,
                "source_type": "video_url",
                "warnings": [],
            }

            result = await provider.extract_script(
                url="https://www.youtube.com/watch?v=1234567890",
                video_id="1234567890",
                target_language="English",
                temp_dir="/tmp/test",
            )

            assert isinstance(result, VideoURLScriptExtraction)
            assert result.platform == "YouTube"
            assert result.title == "Camera Secrets"
            assert result.extraction_method == "official_transcript"
            assert "First 3 seconds" in result.transcript


@pytest.mark.asyncio
async def test_youtube_provider_telugu_tanglish():
    provider = YouTubeVideoURLProvider()

    with patch.object(provider, "_extract_metadata", new_callable=AsyncMock) as mock_meta:
        mock_meta.return_value = {"title": "Telugu Cinema Guide"}
        with patch.object(provider, "_try_fetch_transcript_api", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "source_url": "https://www.youtube.com/watch?v=1234567890",
                "platform": "YouTube",
                "video_id": "1234567890",
                "title": "Telugu Cinema Guide",
                "duration_seconds": 10.0,
                "language": "Tanglish",
                "transcript": "shoot cheyadam aapandi! idi cinema laaga chesthundi.",
                "segments": [
                    {"id": "seg_0", "start": 0.0, "end": 5.0, "text": "shoot cheyadam aapandi! idi cinema laaga chesthundi."}
                ],
                "extraction_method": "official_transcript",
                "transcription_provider": "youtube_transcript_api",
                "confidence": 0.98,
                "source_type": "video_url",
                "warnings": [],
            }

            result = await provider.extract_script(
                url="https://www.youtube.com/watch?v=1234567890",
                video_id="1234567890",
                target_language="Tanglish",
                temp_dir="/tmp/test",
            )

            assert result.language == "Tanglish"
            assert "shoot" in result.transcript


# ==========================================
# 3. ENDPOINT INTEGRATION TESTS
# ==========================================

@pytest.mark.asyncio
async def test_extract_from_url_endpoint_rejection(async_client: AsyncClient):
    # Reject TikTok
    resp = await async_client.post(
        "/api/v1/scripts/extract-from-url",
        json={"url": "https://www.tiktok.com/@user/video/1234567890", "language": "English"},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert "This platform is not supported" in data["detail"]

    # Reject localhost/SSRF
    resp2 = await async_client.post(
        "/api/v1/scripts/extract-from-url",
        json={"url": "http://127.0.0.1:8000/watch?v=abcdefghijk", "language": "English"},
    )
    assert resp2.status_code == 400


@pytest.mark.asyncio
async def test_extract_from_url_endpoint_mocked_success(async_client: AsyncClient):
    mock_extraction = VideoURLScriptExtraction(
        source_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        platform="YouTube",
        video_id="dQw4w9WgXcQ",
        title="Cinematic Lighting Setup",
        creator_name="IndieFilmmaker",
        duration_seconds=30.0,
        language="English",
        transcript="Stop shooting with harsh overhead light. Here is the 3-point lighting formula.",
        segments=[
            {"id": "seg_0", "start": 0.0, "end": 4.0, "text": "Stop shooting with harsh overhead light."},
            {"id": "seg_1", "start": 4.0, "end": 10.0, "text": "Here is the 3-point lighting formula."},
        ],
        extraction_method="official_transcript",
        transcription_provider="youtube_transcript_api",
        confidence=0.98,
        source_type="video_url",
    )

    with patch(
        "app.services.video_url.extraction_service.VideoURLExtractionService.extract_from_url",
        new_callable=AsyncMock,
    ) as mock_extract:
        mock_extract.return_value = mock_extraction

        resp = await async_client.post(
            "/api/v1/scripts/extract-from-url",
            json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "language": "English"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["platform"] == "YouTube"
        assert data["title"] == "Cinematic Lighting Setup"
        assert "Stop shooting" in data["transcript"]
        assert len(data["segments"]) == 2


@pytest.mark.asyncio
async def test_generate_from_url_endpoint(async_client: AsyncClient):
    # Test generation from extracted video URL with adaptation goal
    payload = {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "extracted_text": "Stop using harsh direct flash. Angle your diffuser 45 degrees for cinematic portrait contrast.",
        "original_video_title": "Lighting Secret",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "goal": "Improve Hook",
        "instructions": "Make it punchy for cinematographers",
    }

    resp = await async_client.post("/api/v1/scripts/generate-from-url", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["source_type"] == "video_url"
    assert data["source_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert data["source_platform"] == "YouTube"
    assert "hook" in data
    assert len(data["segments"]) >= 3
    assert data["current_version"] == 1


@pytest.mark.asyncio
async def test_generate_from_url_telugu_and_tanglish(async_client: AsyncClient):
    # Telugu
    payload_te = {
        "url": "https://www.instagram.com/reel/C3zYx1gL9mM/",
        "extracted_text": "మొబైల్ కెమెరా సెట్టింగ్స్ లో 24fps మరియు 180 డిగ్రీల షట్టర్ వాడండి.",
        "original_video_title": "మొబైల్ సినిమాటిక్ ట్రిక్",
        "platform": "Instagram Reels",
        "language": "Telugu",
        "duration_seconds": 30,
        "goal": "Rewrite",
    }
    resp_te = await async_client.post("/api/v1/scripts/generate-from-url", json=payload_te)
    assert resp_te.status_code == 201
    data_te = resp_te.json()
    assert data_te["language"] == "Telugu"
    assert any('\u0c00' <= ch <= '\u0c7f' for ch in data_te["hook"])

    # Tanglish
    payload_tang = {
        "url": "https://www.instagram.com/reel/C3zYx1gL9mM/",
        "extracted_text": "Mobile lo cinema shot teeyali ante 24fps use cheyandi.",
        "original_video_title": "Mobile Cinema",
        "platform": "Instagram Reels",
        "language": "Tanglish",
        "duration_seconds": 30,
        "goal": "Improve Retention",
    }
    resp_tang = await async_client.post("/api/v1/scripts/generate-from-url", json=payload_tang)
    assert resp_tang.status_code == 201
    data_tang = resp_tang.json()
    assert data_tang["language"] == "Tanglish"
    assert "source_type" in data_tang and data_tang["source_type"] == "video_url"


@pytest.mark.asyncio
async def test_save_imported_script_with_video_url_metadata(async_client: AsyncClient):
    payload = {
        "title": "Extracted YouTube Masterpiece",
        "text": "HOOK: Stop scrolling right now.\n\nHere is how you level up your frames.\n\nCTA: Save this for later.",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "source_type": "video_url",
        "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "source_platform": "YouTube",
        "original_video_title": "Original Video Title",
        "extraction_method": "official_transcript",
    }

    resp = await async_client.post("/api/v1/scripts/save-imported", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["source_type"] == "video_url"
    assert data["source_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert data["source_platform"] == "YouTube"
    assert data["original_video_title"] == "Original Video Title"
    assert data["extraction_method"] == "official_transcript"
