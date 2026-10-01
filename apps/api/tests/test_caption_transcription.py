import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.video_validator import (
    validate_video_upload,
    inspect_video_magic_bytes,
    MAX_VIDEO_SIZE_BYTES,
)
from app.services.transcription_provider import (
    MockDevelopmentTranscriptionProvider,
    ProductionTranscriptionProviderStub,
    get_transcription_provider,
    LANGUAGE_CONFIGS,
)
from fastapi import HTTPException


# Helper fixtures for valid video headers
def create_dummy_mp4_bytes(size: int = 1024) -> bytes:
    """Create minimal valid MP4 container bytes."""
    header = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08mdat"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


def create_dummy_mov_bytes(size: int = 1024) -> bytes:
    """Create minimal valid QuickTime MOV container bytes."""
    header = b"\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00qt  \x00\x00\x00\x08mdat"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


def create_dummy_webm_bytes(size: int = 1024) -> bytes:
    """Create minimal valid WebM container bytes."""
    header = b"\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42\xf7\x81\x01\x42\xf2\x81\x04"
    if len(header) >= size:
        return header[:size]
    return header + b"\x00" * (size - len(header))


@pytest.mark.asyncio
async def test_inspect_video_magic_bytes():
    """Verify container signature detection across formats."""
    mp4_bytes = create_dummy_mp4_bytes(64)
    mov_bytes = create_dummy_mov_bytes(64)
    webm_bytes = create_dummy_webm_bytes(64)
    text_bytes = b"Hello, this is just plain text masquerading as video."

    is_mp4, cat_mp4 = inspect_video_magic_bytes(mp4_bytes)
    assert is_mp4 is True
    assert cat_mp4 == "mp4"

    is_mov, cat_mov = inspect_video_magic_bytes(mov_bytes)
    assert is_mov is True
    assert cat_mov in ("mov", "mp4")

    is_webm, cat_webm = inspect_video_magic_bytes(webm_bytes)
    assert is_webm is True
    assert cat_webm == "webm"

    is_text, cat_text = inspect_video_magic_bytes(text_bytes)
    assert is_text is False
    assert cat_text == "unknown"


@pytest.mark.asyncio
async def test_validate_video_upload_valid_formats():
    """Verify validation passes for valid MP4, MOV, and WebM under 100 MB."""
    # MP4
    res_mp4 = validate_video_upload(create_dummy_mp4_bytes(500), "test_video.mp4")
    assert res_mp4.is_valid is True
    assert res_mp4.extension == ".mp4"
    assert res_mp4.detected_format == "mp4"
    assert res_mp4.file_size_bytes == 500

    # MOV
    res_mov = validate_video_upload(create_dummy_mov_bytes(600), "camera_raw.mov")
    assert res_mov.is_valid is True
    assert res_mov.extension == ".mov"

    # WebM
    res_webm = validate_video_upload(create_dummy_webm_bytes(700), "screen_capture.webm")
    assert res_webm.is_valid is True
    assert res_webm.extension == ".webm"
    assert res_webm.detected_format == "webm"


@pytest.mark.asyncio
async def test_validate_video_upload_empty_file():
    """Verify empty video file is rejected with 400 Bad Request."""
    with pytest.raises(HTTPException) as exc_info:
        validate_video_upload(b"", "empty_file.mp4")
    assert exc_info.value.status_code == 400
    assert "empty (0 bytes)" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_video_upload_oversized():
    """Verify video exceeding 100 MB limit is rejected with 413 Payload Too Large."""
    # Pass a custom max_size_bytes of 1000 for fast testing
    dummy_bytes = create_dummy_mp4_bytes(2000)
    with pytest.raises(HTTPException) as exc_info:
        validate_video_upload(dummy_bytes, "big_video.mp4", max_size_bytes=1000)
    assert exc_info.value.status_code == 413
    assert "exceeds the maximum allowed size" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_video_upload_invalid_extension():
    """Verify unsupported extensions (.txt, .exe, .pdf) are rejected with 415."""
    with pytest.raises(HTTPException) as exc_info:
        validate_video_upload(b"some content", "script.txt")
    assert exc_info.value.status_code == 415
    assert "Unsupported video format" in exc_info.value.detail


@pytest.mark.asyncio
async def test_validate_video_upload_malformed_container():
    """Verify non-video content disguised as .mp4 is rejected with 400."""
    bogus_bytes = b"Just plain ASCII characters inside a file called video.mp4"
    with pytest.raises(HTTPException) as exc_info:
        validate_video_upload(bogus_bytes, "spoofed.mp4")
    assert exc_info.value.status_code == 400
    assert "Malformed video file" in exc_info.value.detail


@pytest.mark.asyncio
async def test_transcription_provider_abstraction():
    """Verify MockDevelopmentTranscriptionProvider returns structured segments and word timings."""
    provider = get_transcription_provider("mock")
    assert isinstance(provider, MockDevelopmentTranscriptionProvider)

    result = await provider.transcribe(
        video_bytes=create_dummy_mp4_bytes(500),
        filename="cinematic_intro.mp4",
        language="English",
    )

    assert result.language == "English"
    assert result.is_production_provider is False
    assert result.provider_name == "heuristic_dev_transcription"
    assert len(result.segments) > 0
    assert result.duration_seconds > 0.0
    assert len(result.full_text) > 0

    # Verify segment timestamps
    first_seg = result.segments[0]
    assert first_seg.id == "seg_0"
    assert first_seg.start_time >= 0.0
    assert first_seg.end_time > first_seg.start_time
    assert len(first_seg.words) > 0

    # Verify word timestamps
    first_word = first_seg.words[0]
    assert first_word.start_time >= first_seg.start_time
    assert first_word.end_time <= first_seg.end_time
    assert len(first_word.text) > 0


@pytest.mark.asyncio
async def test_transcription_language_matrix():
    """Verify distinct language recognition handling for English, Telugu, Hindi, and Tanglish."""
    provider = MockDevelopmentTranscriptionProvider()

    for lang in ["English", "Telugu", "Hindi", "Tanglish"]:
        result = await provider.transcribe(
            video_bytes=create_dummy_mp4_bytes(500),
            filename="demo.mp4",
            language=lang,
        )
        assert result.language == lang
        expected_config = LANGUAGE_CONFIGS[lang]
        assert result.language_code == expected_config["code"]
        assert result.script_type == expected_config["script"]
        assert result.is_transliteration == expected_config["is_transliteration"]

        if lang == "Tanglish":
            assert result.is_transliteration is True
            assert result.script_type == "Latin"
        elif lang == "Telugu":
            assert result.is_transliteration is False
            assert result.script_type == "Telugu"


@pytest.mark.asyncio
async def test_production_transcription_provider_stub():
    """Verify ProductionTranscriptionProviderStub raises 400 when credentials are unconfigured without silent fallback."""
    stub = ProductionTranscriptionProviderStub()
    with pytest.raises(HTTPException) as exc:
        await stub.transcribe(
            video_bytes=create_dummy_mp4_bytes(500),
            filename="reel.mp4",
            language="English",
        )
    assert exc.value.status_code == 400
    assert "Production speech recognition is not configured" in exc.value.detail


@pytest.mark.asyncio
async def test_api_get_supported_languages():
    """Verify GET /api/v1/captions/languages returns language metadata with Tanglish distinction."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/captions/languages")
        assert response.status_code == 200
        data = response.json()
        assert "languages" in data
        names = [l["name"] for l in data["languages"]]
        assert "English" in names
        assert "Telugu" in names
        assert "Hindi" in names
        assert "Tanglish" in names

        tanglish = next(l for l in data["languages"] if l["name"] == "Tanglish")
        assert tanglish["is_transliteration"] is True
        assert tanglish["script"] == "Latin"


@pytest.mark.asyncio
async def test_api_transcribe_video_success():
    """Verify POST /api/v1/captions/transcribe processes valid video and returns normalized transcript."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        mp4_content = create_dummy_mp4_bytes(1024)
        files = {"file": ("cinematic_sample.mp4", mp4_content, "video/mp4")}
        data = {"language": "English", "duration_seconds": "18.5", "provider": "mock"}

        response = await client.post("/api/v1/captions/transcribe", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()

        assert "project_id" in payload
        assert payload["project_id"].startswith("proj_")
        assert "caption_source" in payload
        assert payload["caption_source"]["filename"] == "cinematic_sample.mp4"
        assert payload["caption_source"]["mime_type"] == "video/mp4"

        assert "transcription" in payload
        transcript = payload["transcription"]
        assert transcript["language"] == "English"
        assert transcript["is_production_provider"] is False
        assert len(transcript["segments"]) > 0
        assert "60fps" in transcript["full_text"]

        # Notice explicitly warns user about development mode
        assert payload["notice"] is not None
        assert "Development Transcription Mode" in payload["notice"]


@pytest.mark.asyncio
async def test_api_transcribe_video_tanglish():
    """Verify POST /api/v1/captions/transcribe handles Tanglish language request."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        mov_content = create_dummy_mov_bytes(1024)
        files = {"file": ("telugu_reel.mov", mov_content, "video/quicktime")}
        data = {"language": "Tanglish", "provider": "mock"}

        response = await client.post("/api/v1/captions/transcribe", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert payload["transcription"]["language"] == "Tanglish"
        assert payload["transcription"]["is_transliteration"] is True
        assert payload["transcription"]["script_type"] == "Latin"


@pytest.mark.asyncio
async def test_api_transcribe_invalid_file_rejected():
    """Verify POST /api/v1/captions/transcribe rejects invalid file extension with 415."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("script.pdf", b"%PDF-1.4 dummy", "application/pdf")}
        response = await client.post("/api/v1/captions/transcribe", files=files)
        assert response.status_code == 415
        assert "Unsupported video format" in response.json()["detail"]


@pytest.mark.asyncio
async def test_api_transcribe_empty_file_rejected():
    """Verify POST /api/v1/captions/transcribe rejects empty upload with 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("empty.mp4", b"", "video/mp4")}
        response = await client.post("/api/v1/captions/transcribe", files=files)
        assert response.status_code == 400
        assert "empty (0 bytes)" in response.json()["detail"]


@pytest.mark.asyncio
async def test_api_transcribe_malformed_container_rejected():
    """Verify POST /api/v1/captions/transcribe rejects malformed video container with 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("fake.mp4", b"Random text pretending to be video", "video/mp4")}
        response = await client.post("/api/v1/captions/transcribe", files=files)
        assert response.status_code == 400
        assert "Malformed video file" in response.json()["detail"]
