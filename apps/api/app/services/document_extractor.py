import io
import zipfile
import xml.etree.ElementTree as ET
import logging
from typing import Optional, Dict, Any, Literal
from fastapi import HTTPException, status
from app.services.ocr_provider import get_ocr_provider, BaseOCRProvider, OCRResult

logger = logging.getLogger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB strict limit for documents/images
ALLOWED_EXTENSIONS = {
    "pdf": [".pdf"],
    "docx": [".docx"],
    "image": [".jpg", ".jpeg", ".png", ".webp"],
}


class DocumentExtractionResult:
    def __init__(
        self,
        source_type: Literal["text", "pdf", "docx", "image"],
        text: str,
        original_file_name: Optional[str] = None,
        language: str = "English",
        extraction_method: str = "direct",
        confidence: Optional[float] = None,
        provider_name: str = "native",
        is_production: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.source_type = source_type
        self.text = text.strip()
        self.original_file_name = original_file_name
        self.language = language
        self.extraction_method = extraction_method
        self.confidence = confidence
        self.provider_name = provider_name
        self.is_production = is_production
        self.character_count = len(self.text)
        self.word_count = len(self.text.split()) if self.text else 0
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_type": self.source_type,
            "text": self.text,
            "original_file_name": self.original_file_name,
            "language": self.language,
            "extraction_method": self.extraction_method,
            "confidence": self.confidence,
            "provider_name": self.provider_name,
            "is_production_ocr": self.is_production,
            "character_count": self.character_count,
            "word_count": self.word_count,
            "metadata": self.metadata,
        }


def validate_file_upload(
    file_bytes: bytes,
    filename: str,
    expected_type: Literal["pdf", "docx", "image"],
    max_size_bytes: int = MAX_FILE_SIZE_BYTES,
) -> None:
    """Validate uploaded document/image file size, non-emptiness, and extension."""
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file '{filename}' is empty (0 bytes).",
        )

    if len(file_bytes) > max_size_bytes:
        size_mb = round(len(file_bytes) / (1024 * 1024), 2)
        limit_mb = round(max_size_bytes / (1024 * 1024))
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File '{filename}' ({size_mb} MB) exceeds maximum allowed size of {limit_mb} MB.",
        )

    name_lower = filename.lower()
    valid_exts = ALLOWED_EXTENSIONS.get(expected_type, [])
    if not any(name_lower.endswith(ext) for ext in valid_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format for {expected_type.upper()}. Allowed extensions: {', '.join(valid_exts)}.",
        )


def extract_from_text(text: str, language: str = "English") -> DocumentExtractionResult:
    """Normalize pasted or typed plain text."""
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provided script text cannot be empty.",
        )

    return DocumentExtractionResult(
        source_type="text",
        text=cleaned,
        language=language,
        extraction_method="direct_input",
        confidence=1.0,
        provider_name="manual_input",
        is_production=True,
    )


def extract_from_pdf(
    pdf_bytes: bytes,
    filename: str = "document.pdf",
    language: str = "English",
) -> DocumentExtractionResult:
    """Extract screenplay text from PDF using pypdf."""
    validate_file_upload(pdf_bytes, filename, "pdf")

    # Basic PDF magic header check
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' is not a valid PDF document (missing %PDF- header).",
        )

    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                extracted_pages.append(page_text.strip())

        full_text = "\n\n".join(extracted_pages).strip()
    except Exception as e:
        logger.error(f"Error reading PDF '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF document '{filename}': {str(e)}",
        )

    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"PDF '{filename}' contains no readable digital text. "
                "If this is a scanned screenplay, please export as an image or use Paste Text."
            ),
        )

    return DocumentExtractionResult(
        source_type="pdf",
        text=full_text,
        original_file_name=filename,
        language=language,
        extraction_method="pypdf_stream_parser",
        confidence=0.98,
        provider_name="pypdf",
        is_production=True,
        metadata={"total_pages": len(reader.pages)},
    )


MAX_UNCOMPRESSED_ENTRY_BYTES = 25 * 1024 * 1024  # 25 MB max per entry
MAX_TOTAL_UNCOMPRESSED_BYTES = 50 * 1024 * 1024  # 50 MB max cumulative uncompressed


def extract_from_docx(
    docx_bytes: bytes,
    filename: str = "screenplay.docx",
    language: str = "English",
) -> DocumentExtractionResult:
    """Extract screenplay text from DOCX using native zipfile and OpenXML parsing."""
    validate_file_upload(docx_bytes, filename, "docx")

    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as docx_zip:
            # 1. Zip bomb mitigation: check uncompressed entries against safe ceilings
            total_uncompressed = 0
            for info in docx_zip.infolist():
                total_uncompressed += info.file_size
                if info.file_size > MAX_UNCOMPRESSED_ENTRY_BYTES or total_uncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File '{filename}' exceeds safe decompression thresholds (potential decompression bomb).",
                    )

            if "word/document.xml" not in docx_zip.namelist():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{filename}' is not a valid DOCX document (missing word/document.xml).",
                )
            xml_content = docx_zip.read("word/document.xml")

            # 2. XML Entity Injection / DTD Blowup protection
            if b"<!DOCTYPE" in xml_content or b"<!ENTITY" in xml_content:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{filename}' contains forbidden XML entity or DOCTYPE declarations.",
                )

            tree = ET.fromstring(xml_content)

            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = []
            for p in tree.iter(f"{{{ns['w']}}}p"):
                texts = [node.text for node in p.iter(f"{{{ns['w']}}}t") if node.text]
                if texts:
                    paragraphs.append("".join(texts).strip())

            full_text = "\n\n".join(paragraphs).strip()
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' is corrupted or not a valid ZIP/DOCX package.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing DOCX '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse DOCX document '{filename}': {str(e)}",
        )

    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"DOCX document '{filename}' is empty or contains no readable paragraph text.",
        )

    return DocumentExtractionResult(
        source_type="docx",
        text=full_text,
        original_file_name=filename,
        language=language,
        extraction_method="openxml_paragraph_parser",
        confidence=1.0,
        provider_name="openxml_native",
        is_production=True,
    )


async def extract_from_image(
    image_bytes: bytes,
    filename: str = "screenshot.png",
    language: str = "English",
    ocr_provider: Optional[BaseOCRProvider] = None,
) -> DocumentExtractionResult:
    """Extract screenplay text from image via OCR provider abstraction."""
    validate_file_upload(image_bytes, filename, "image")

    provider = ocr_provider or get_ocr_provider()
    ocr_result: OCRResult = await provider.extract_text(
        image_bytes=image_bytes,
        filename=filename,
        language=language,
    )

    if ocr_result.error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OCR Extraction Failed: {ocr_result.error}",
        )

    if not ocr_result.extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="OCR could not detect any readable text in the image. Please enter your script manually.",
        )

    return DocumentExtractionResult(
        source_type="image",
        text=ocr_result.extracted_text,
        original_file_name=filename,
        language=language,
        extraction_method="ocr",
        confidence=ocr_result.confidence,
        provider_name=ocr_result.provider_name,
        is_production=ocr_result.is_production,
        metadata=ocr_result.metadata,
    )
