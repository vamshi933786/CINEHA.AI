import os
import logging
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Strict 100 MB video upload limit as required across CINEHA AI
MAX_VIDEO_SIZE_BYTES: int = 100 * 1024 * 1024  # 104,857,600 bytes
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
    "application/octet-stream",  # Sometimes reported by browsers for MOV/WebM
}


class VideoValidationResult(BaseModel):
    """Normalized video file verification output."""
    filename: str
    extension: str
    detected_format: str
    file_size_bytes: int
    file_size_mb: float
    mime_type: str
    is_valid: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


def inspect_video_magic_bytes(header: bytes) -> Tuple[bool, str]:
    """
    Inspect the initial binary bytes of an uploaded stream to verify genuine video container format.
    Checks for:
    - MP4 / ISO Base Media: 'ftyp' box at offset 4..8 (brands: isom, mp41, mp42, avc1, etc.)
    - MOV (QuickTime): 'moov', 'mdat', 'wide', or 'ftypqt' in container atom headers
    - WebM (Matroska/EBML): EBML ID header 0x1A 0x45 0xDF 0xA3
    """
    if len(header) < 4:
        return False, "insufficient_bytes"

    # 1. WebM check: Standard EBML element ID
    if header.startswith(b"\x1a\x45\xdf\xa3"):
        return True, "webm"

    # 2. MP4 / MOV check: Box header structure (4-byte length + 4-byte box type)
    if len(header) >= 8:
        box_type = header[4:8]
        if box_type == b"ftyp":
            # MP4 or modern MOV
            major_brand = header[8:12] if len(header) >= 12 else b""
            if major_brand.startswith(b"qt"):
                return True, "mov"
            return True, "mp4"
        elif box_type in (b"moov", b"mdat", b"wide", b"skip", b"free"):
            return True, "mov"

    # 3. QuickTime classic variations
    if len(header) >= 12:
        if b"ftyp" in header[:32] or b"moov" in header[:64]:
            return True, "mp4"

    return False, "unknown"


import re


def sanitize_video_filename(filename: Optional[str], default: str = "uploaded_video.mp4") -> str:
    """
    Sanitize untrusted user-supplied filenames to prevent path traversal, null byte injections,
    control characters, and unexpected directory escapes across POSIX and Windows.
    """
    if not filename:
        return default
    # Replace backslashes with slashes to handle Windows paths across any OS
    cleaned = filename.replace("\\", "/")
    # Extract basename only
    cleaned = os.path.basename(cleaned)
    # Strip null bytes and control characters
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", cleaned)
    # Remove leading/trailing dots and whitespace
    cleaned = cleaned.strip(". \t\r\n")
    # Replace any character other than alphanumeric, dot, underscore, or hyphen
    cleaned = re.sub(r"[^\w\.\-]", "_", cleaned)
    if not cleaned or cleaned.startswith("."):
        return default
    return cleaned


def validate_video_upload(
    file_bytes: bytes,
    filename: Optional[str] = None,
    declared_mime_type: Optional[str] = None,
    max_size_bytes: int = MAX_VIDEO_SIZE_BYTES,
) -> VideoValidationResult:
    """
    Comprehensive validation layer for video assets ingested into CINEHA AI.
    Verifies:
    1. Non-empty payload (>= 1 byte)
    2. File size within max_size_bytes (strictly <= 100 MB)
    3. Extension validation (.mp4, .mov, .webm)
    4. Binary magic-byte / container header signature inspection
    """
    clean_filename = sanitize_video_filename(filename)

    # 1. Non-empty check
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded video file '{clean_filename}' is empty (0 bytes).",
        )

    file_size = len(file_bytes)
    file_size_mb = round(file_size / (1024 * 1024), 2)

    # 2. Maximum file size check (100 MB strict limit)
    if file_size > max_size_bytes:
        max_mb = round(max_size_bytes / (1024 * 1024), 1)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Uploaded video '{clean_filename}' ({file_size_mb} MB) exceeds "
                f"the maximum allowed size of {max_mb} MB."
            ),
        )

    # 3. File extension check
    _, ext = os.path.splitext(clean_filename.lower())
    if not ext or ext not in ALLOWED_VIDEO_EXTENSIONS:
        allowed_list = ", ".join(sorted(ALLOWED_VIDEO_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported video format '{ext}' for file '{clean_filename}'. "
                f"Allowed formats are: {allowed_list}."
            ),
        )

    # 4. MIME type check if supplied
    normalized_mime = (declared_mime_type or "").lower().strip()
    if normalized_mime and normalized_mime not in ALLOWED_VIDEO_MIME_TYPES:
        # If MIME is explicitly text or audio/image, reject
        if normalized_mime.startswith(("text/", "image/", "audio/", "application/pdf")):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid MIME type '{declared_mime_type}' for video file '{clean_filename}'.",
            )

    # 5. Magic byte container inspection
    is_valid_magic, container_type = inspect_video_magic_bytes(file_bytes[:128])
    if not is_valid_magic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Malformed video file '{clean_filename}'. The file header does not contain "
                f"a valid MP4, MOV, or WebM container signature."
            ),
        )

    # Map container to standard MIME
    mime_mapping = {
        "mp4": "video/mp4",
        "mov": "video/quicktime",
        "webm": "video/webm",
    }
    final_mime = mime_mapping.get(container_type, declared_mime_type or "video/mp4")

    return VideoValidationResult(
        filename=clean_filename,
        extension=ext,
        detected_format=container_type,
        file_size_bytes=file_size,
        file_size_mb=file_size_mb,
        mime_type=final_mime,
        is_valid=True,
        metadata={
            "container": container_type,
            "header_bytes_inspected": min(128, len(file_bytes)),
            "max_size_allowed_bytes": max_size_bytes,
        },
    )
