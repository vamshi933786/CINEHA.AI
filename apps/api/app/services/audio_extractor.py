import os
import shutil
import tempfile
import asyncio
import logging
from typing import Optional, Dict, Any, Tuple
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


async def extract_audio_from_video(
    video_bytes: bytes,
    filename: Optional[str] = None,
) -> AudioExtractionResult:
    """
    Extract the audio track from video bytes and convert to speech-optimized MP3 (16kHz).
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

    video_temp_path = None
    audio_temp_path = None

    try:
        # 1. Write input video bytes to isolated temporary file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as video_temp:
            video_temp.write(video_bytes)
            video_temp_path = video_temp.name

        # 2. Prepare output audio temporary file path
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as audio_temp:
            audio_temp_path = audio_temp.name

        # 3. Execute ffmpeg: extract audio, convert to 16kHz mono/stereo MP3
        # -vn: disable video recording
        # -acodec libmp3lame: MP3 audio encoder
        # -ar 16000: 16 kHz sample rate (optimal for speech models)
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

        stdout, stderr = await process.communicate()
        stderr_text = stderr.decode("utf-8", errors="replace")

        if process.returncode != 0:
            stderr_lower = stderr_text.lower()
            if (
                "does not contain any stream" in stderr_lower
                or "matches no streams" in stderr_lower
                or "no audio" in stderr_lower
                or "output file is empty" in stderr_lower
            ):
                raise NoAudioTrackError(
                    f"The uploaded video file '{clean_filename}' contains no audio track. "
                    "Please provide a video with recorded speech."
                )

            logger.error(f"FFmpeg extraction failed (code {process.returncode}): {stderr_text[:500]}")
            raise AudioExtractionError(
                f"Failed to extract audio from video '{clean_filename}'. Media may be corrupted or unreadable."
            )

        # 4. Verify output file exists and has content
        if not os.path.isfile(audio_temp_path) or os.path.getsize(audio_temp_path) == 0:
            raise NoAudioTrackError(
                f"The uploaded video file '{clean_filename}' produced no audio data. "
                "The video likely contains no audio track."
            )

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
        # Guaranteed cleanup of temporary files
        if video_temp_path and os.path.exists(video_temp_path):
            try:
                os.unlink(video_temp_path)
            except OSError:
                pass

        if audio_temp_path and os.path.exists(audio_temp_path):
            try:
                os.unlink(audio_temp_path)
            except OSError:
                pass
