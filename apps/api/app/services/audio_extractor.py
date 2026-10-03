import os
import re
import uuid
import shutil
import tempfile
import asyncio
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class AudioExtractionError(Exception):
    """Base exception for audio extraction issues."""
    pass


class NoAudioTrackError(AudioExtractionError):
    """Raised when an uploaded video has no audio track."""
    pass


class FFmpegNotFoundError(AudioExtractionError):
    """Raised when ffmpeg binary cannot be located."""
    pass


def get_ffmpeg_binary_path() -> Optional[str]:
    """
    Locate the ffmpeg executable on the host system.
    Checks:
    1. settings.FFMPEG_PATH if configured
    2. shutil.which("ffmpeg")
    3. Common system/conda installation directories
    """
    if settings.FFMPEG_PATH and os.path.isfile(settings.FFMPEG_PATH) and os.access(settings.FFMPEG_PATH, os.X_OK):
        return settings.FFMPEG_PATH

    which_path = shutil.which("ffmpeg")
    if which_path and os.access(which_path, os.X_OK):
        return which_path

    common_paths = [
        "/opt/anaconda3/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/opt/homebrew/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ]
    for path in common_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path

    return None


def is_ffmpeg_available() -> bool:
    """Return True if ffmpeg is executable on the current system."""
    return get_ffmpeg_binary_path() is not None


class AudioExtractionResult:
    """Normalized container for extracted audio stream."""

    def __init__(
        self,
        audio_bytes: bytes,
        audio_format: str = "mp3",
        duration_seconds: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.audio_bytes = audio_bytes
        self.audio_format = audio_format
        self.duration_seconds = duration_seconds
        self.file_size_bytes = len(audio_bytes)
        self.metadata = metadata or {}


async def detect_audio_stream(video_path: str, ffmpeg_bin: str) -> bool:
    """
    Inspect the uploaded video container using ffmpeg to verify an audio stream exists.
    Returns True if an Audio stream is present, False otherwise.
    """
    cmd = [ffmpeg_bin, "-i", video_path]
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await process.communicate()
    stderr_text = stderr.decode("utf-8", errors="replace")

    # Match audio stream indicator in FFmpeg metadata
    # Examples:
    # "Stream #0:1[0x2](und): Audio: aac ..."
    # "Stream #0:1: Audio: mp3 ..."
    return bool(re.search(r"Stream\s+#\d+:\d+.*:\s*Audio:", stderr_text, re.IGNORECASE))


async def extract_audio_from_video(
    video_bytes: bytes,
    filename: Optional[str] = None,
) -> AudioExtractionResult:
    """
    Extract the audio track from video bytes and convert to speech-optimized MP3 (16kHz).
    Uses a completely isolated temporary directory per request.
    Guarantees immediate cleanup of all temporary disk files in both success and failure cases.
    Raises:
    - FFmpegNotFoundError if ffmpeg binary is missing
    - NoAudioTrackError if video has no audio track
    - AudioExtractionError on ffmpeg processing failure
    """
    ffmpeg_bin = get_ffmpeg_binary_path()
    if not ffmpeg_bin:
        raise FFmpegNotFoundError(
            "ffmpeg is required for audio extraction but is not installed or available in PATH."
        )

    clean_filename = os.path.basename(filename or "input_video.mp4")
    _, ext = os.path.splitext(clean_filename.lower())
    if not ext:
        ext = ".mp4"

    # Dedicated temporary directory for 100% session isolation
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(tempfile.gettempdir(), f"cinehai_audio_{session_id}")
    os.makedirs(session_dir, exist_ok=True)

    video_temp_path = os.path.join(session_dir, f"video{ext}")
    audio_temp_path = os.path.join(session_dir, "extracted_audio.mp3")

    try:
        # 1. Write input video bytes to isolated temporary file
        with open(video_temp_path, "wb") as f:
            f.write(video_bytes)

        # 2. Inspect video container: detect if an audio stream actually exists
        has_audio = await detect_audio_stream(video_temp_path, ffmpeg_bin)
        if not has_audio:
            logger.warning(f"Video file '{clean_filename}' contains no audio streams.")
            raise NoAudioTrackError("No audio track was detected in this video.")

        # 3. Execute ffmpeg: extract audio, convert to 16kHz mono/stereo MP3
        # -vn: disable video recording
        # -acodec libmp3lame: MP3 audio encoder
        # -ar 16000: 16 kHz sample rate (optimal for speech recognition)
        # -ab 64k: compact speech bitrate
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i",
            video_temp_path,
            "-vn",
            "-acodec",
            "libmp3lame",
            "-ar",
            "16000",
            "-ab",
            "64k",
            audio_temp_path,
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        _, stderr = await process.communicate()
        stderr_text = stderr.decode("utf-8", errors="replace")

        if process.returncode != 0:
            stderr_lower = stderr_text.lower()
            if (
                "does not contain any stream" in stderr_lower
                or "matches no streams" in stderr_lower
                or "no audio" in stderr_lower
                or "output file is empty" in stderr_lower
            ):
                raise NoAudioTrackError("No audio track was detected in this video.")

            logger.error(f"FFmpeg extraction failed (code {process.returncode}): {stderr_text[:500]}")
            raise AudioExtractionError(
                f"Failed to extract audio from video '{clean_filename}'. Media may be corrupted or unreadable."
            )

        # 4. Verify output file exists and has content
        if not os.path.isfile(audio_temp_path) or os.path.getsize(audio_temp_path) == 0:
            raise NoAudioTrackError("No audio track was detected in this video.")

        with open(audio_temp_path, "rb") as f:
            audio_bytes = f.read()

        return AudioExtractionResult(
            audio_bytes=audio_bytes,
            audio_format="mp3",
            metadata={
                "extracted_sample_rate": 16000,
                "audio_codec": "mp3",
                "source_filename": clean_filename,
            },
        )

    finally:
        # Guaranteed complete cleanup of isolated temporary session directory
        try:
            shutil.rmtree(session_dir, ignore_errors=True)
        except Exception:
            pass


async def convert_audio_to_pcm_array(
    audio_bytes: bytes,
    ffmpeg_bin: Optional[str] = None,
) -> Any:
    """
    Decode audio bytes into a 1D float32 numpy array sampled at 16000 Hz mono.
    Directly pipes PCM float32 samples from FFmpeg, bypassing PyAV container decoding
    and eliminating av.open metadata_errors incompatibility on Python 3.14.
    """
    import numpy as np

    bin_path = ffmpeg_bin or get_ffmpeg_binary_path()
    if not bin_path:
        raise FFmpegNotFoundError(
            "ffmpeg is required for audio decoding but is not installed or available in PATH."
        )

    cmd = [
        bin_path,
        "-i",
        "pipe:0",
        "-f",
        "f32le",
        "-acodec",
        "pcm_f32le",
        "-ar",
        "16000",
        "-ac",
        "1",
        "pipe:1",
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate(input=audio_bytes)
    if process.returncode != 0:
        err_msg = stderr.decode("utf-8", errors="replace")[:300]
        logger.error(f"FFmpeg PCM conversion failed (code {process.returncode}): {err_msg}")
        raise AudioExtractionError(f"Failed to decode audio into PCM array: {err_msg}")

    return np.frombuffer(stdout, dtype=np.float32)
