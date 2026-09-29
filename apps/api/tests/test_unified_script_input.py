import io
import zipfile
import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image
from app.main import app
from app.services.ocr_provider import MockDevelopmentOCRProvider, get_ocr_provider
from app.services.document_extractor import (
    extract_from_text,
    extract_from_pdf,
    extract_from_docx,
    extract_from_image,
)
from app.services.script_parser import parse_script_text_to_segments


def _create_minimal_pdf_bytes(text: str = "Test Screenplay Content") -> bytes:
    """Creates a valid PDF binary with searchable text using pypdf."""
    import pypdf
    writer = pypdf.PdfWriter()
    # Add a blank page with annotation or use pypdf PageObject
    page = writer.add_blank_page(width=612, height=792)
    # Write a simple content stream
    stream_content = f"BT /F1 12 Tf 72 712 Td ({text}) Tj ET".encode("latin-1")
    page.set_contents(pypdf.generic.DecodedStreamObject())
    page["/Contents"].set_data(stream_content)
    
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _create_minimal_docx_bytes(paragraphs: list[str]) -> bytes:
    """Creates a valid in-memory DOCX file."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        p_xml = "".join(
            f"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>" for p in paragraphs
        )
        doc_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:body>{p_xml}</w:body>'
            '</w:document>'
        )
        zf.writestr("word/document.xml", doc_xml)
        zf.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
    return buf.getvalue()


def _create_sample_image_bytes(format: str = "PNG", size: tuple = (200, 200), color: str = "white") -> bytes:
    """Creates a valid in-memory image."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


# =====================================================================
# UNIT TESTS: Document Extractor & Script Parser
# =====================================================================

def test_extract_from_text_success():
    raw = "  Stop shooting at 60fps! Here is the cinema secret.  "
    res = extract_from_text(raw, language="English")
    assert res.source_type == "text"
    assert res.text == raw.strip()
    assert res.word_count == 9
    assert res.confidence == 1.0


def test_extract_from_text_empty_error():
    with pytest.raises(Exception) as exc:
        extract_from_text("   \n  \t  ")
    assert "empty" in str(exc.value.detail).lower()


def test_extract_from_docx_success():
    docx_bytes = _create_minimal_docx_bytes([
        "CINEHA SCREENPLAY",
        "Stop shooting at 60fps! Switch to 24fps.",
        "Save this before your next shoot!",
    ])
    res = extract_from_docx(docx_bytes, filename="test.docx")
    assert res.source_type == "docx"
    assert "Stop shooting at 60fps!" in res.text
    assert res.word_count > 5


def test_extract_from_docx_invalid_zip():
    with pytest.raises(Exception) as exc:
        extract_from_docx(b"not a valid zip", filename="bad.docx")
    assert "corrupted" in str(exc.value.detail).lower() or "valid" in str(exc.value.detail).lower()


def test_extract_from_pdf_invalid_header():
    with pytest.raises(Exception) as exc:
        extract_from_pdf(b"not a pdf", filename="fake.pdf")
    assert "valid pdf" in str(exc.value.detail).lower()


@pytest.mark.asyncio
async def test_extract_from_image_ocr():
    img_bytes = _create_sample_image_bytes("PNG")
    res = await extract_from_image(img_bytes, filename="notes.png", language="English")
    assert res.source_type == "image"
    assert "60fps" in res.text
    assert res.confidence == 0.92
    assert res.is_production is False
    assert res.provider_name == "heuristic_dev_ocr"


@pytest.mark.asyncio
async def test_extract_from_image_invalid():
    with pytest.raises(Exception) as exc:
        await extract_from_image(b"invalid image bytes", filename="bad.png")
    assert "ocr extraction failed" in str(exc.value.detail).lower()


def test_parse_script_text_to_segments():
    text = (
        "Stop shooting at 60fps! Here is the 1-second setting.\n\n"
        "60fps gives you an unnatural soap-opera effect.\n\n"
        "Switch to 24fps with a 180 degree shutter angle.\n\n"
        "Save this script for later!"
    )
    hook, cta, segments = parse_script_text_to_segments(text, duration_seconds=30)
    assert len(segments) >= 2
    assert "60fps" in hook
    assert "Save this" in cta or "later" in cta
    assert segments[0]["section"] == "HOOK"
    assert segments[-1]["section"] == "CTA"


# =====================================================================
# API ENDPOINT TESTS: /api/v1/scripts/extract & /api/v1/analyzer/script
# =====================================================================

@pytest.mark.asyncio
async def test_api_extract_text_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/extract",
            data={
                "source_type": "text",
                "text": "Why 24fps feels like cinema. Here is the trick: lock shutter angle. Follow for more!",
                "language": "English",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "text"
        assert data["extraction_method"] == "direct_input"
        assert data["word_count"] > 5
        assert data["character_count"] > 10


@pytest.mark.asyncio
async def test_api_extract_docx_endpoint():
    docx_bytes = _create_minimal_docx_bytes([
        "Hook: Mobile cinematography secret.",
        "Use natural window light at a 45 degree angle.",
        "CTA: Follow for part 2.",
    ])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/extract",
            data={"source_type": "docx", "language": "English"},
            files={"file": ("script.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "docx"
        assert "Mobile cinematography secret" in data["text"]


@pytest.mark.asyncio
async def test_api_extract_image_endpoint():
    img_bytes = _create_sample_image_bytes("JPEG")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/extract",
            data={"source_type": "image", "language": "Telugu"},
            files={"file": ("screenshot.jpg", img_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "image"
        assert data["provider_name"] == "heuristic_dev_ocr"
        assert data["is_production_ocr"] is False
        assert "షూట్" in data["text"] or "60fps" in data["text"]


@pytest.mark.asyncio
async def test_api_extract_empty_file_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/extract",
            data={"source_type": "image"},
            files={"file": ("empty.png", b"", "image/png")},
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_extract_oversized_file_rejected():
    large_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB > 10 MB limit
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/extract",
            data={"source_type": "image"},
            files={"file": ("large.png", large_bytes, "image/png")},
        )
        assert response.status_code == 413


@pytest.mark.asyncio
async def test_analyzer_with_normalized_script_text():
    """Verify that normalized script text interfaces with existing RetentionAnalyzerAgent."""
    script_text = (
        "Stop shooting at 60fps! Here is the 1-second setting that makes phone footage look like cinema.\n\n"
        "60fps creates that harsh soap-opera effect with zero natural motion blur.\n\n"
        "Switch to 24fps and lock your shutter angle to 180 degrees.\n\n"
        "Save this before your next shoot!"
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/analyzer/script",
            json={
                "title": "Normalized 24fps Screenplay",
                "script_text": script_text,
                "source_type": "image",
                "language": "English",
                "duration_seconds": 30,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Normalized 24fps Screenplay"
        assert "overall_score" in data
        assert "hook_clarity" in data
        assert "hook_strength" in data
        assert "pacing_progression" in data
        assert "filler_repetition" in data
        assert len(data["segment_observations"]) >= 2


@pytest.mark.asyncio
async def test_save_imported_script_endpoint():
    """Verify that normalized script can be saved into Script Studio database as Version 1."""
    script_text = (
        "Opening Hook: Stop buying expensive cameras.\n\n"
        "The secret to professional video is three-point lighting.\n\n"
        "Follow for part 2!"
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/scripts/save-imported",
            json={
                "title": "Imported Three-Point Lighting Script",
                "text": script_text,
                "topic": "Lighting Setup",
                "platform": "Instagram Reels",
                "language": "English",
                "duration_seconds": 30,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Imported Three-Point Lighting Script"
        assert data["current_version"] == 1
        assert len(data["segments"]) >= 2
        assert data["provider_used"] == "unified_input_import"
