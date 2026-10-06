import os
import re
import asyncio
import logging
from typing import Tuple, Dict, Any, Optional
from app.services.audio_extractor import get_ffmpeg_binary_path

logger = logging.getLogger(__name__)


class VideoMetadataExtractor:
    """Extracts container, codec, visual dimensions, duration, and stream properties via FFmpeg."""

    @staticmethod
    async def probe_video_file(video_path: str) -> Dict[str, Any]:
        """
        Probe a local video file using FFmpeg stderr metadata inspection.
        Returns dictionary with width, height, duration_seconds, fps, and has_audio.
        """
        ffmpeg_bin = get_ffmpeg_binary_path()
        if not ffmpeg_bin:
            logger.warning("FFmpeg binary not available for probing video metadata. Using defaults.")
            return {
                "width": 1080,
                "height": 1920,
                "duration_seconds": 0.0,
                "fps": 30.0,
                "has_audio": False,
            }

        cmd = [ffmpeg_bin, "-i", video_path]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                _, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)
            except asyncio.TimeoutError:
                try:
                    process.kill()
                    await process.communicate()
                except Exception:
                    pass
                logger.warning(f"FFmpeg probe timed out for {video_path}")
                stderr = b""
            stderr_text = stderr.decode("utf-8", errors="replace")
        except Exception as e:
            logger.error(f"Error running FFmpeg probe on {video_path}: {e}")
            return {
                "width": 1080,
                "height": 1920,
                "duration_seconds": 0.0,
                "fps": 30.0,
                "has_audio": False,
            }

        # 1. Dimensions (e.g. 1080x1920 or 1920x1080)
        width, height = 1080, 1920
        dim_match = re.search(r"Stream.*Video:.*,\s*(\d{2,5})x(\d{2,5})", stderr_text)
        if dim_match:
            try:
                width = int(dim_match.group(1))
                height = int(dim_match.group(2))
            except Exception:
                pass

        # 2. FPS (e.g. 30 fps, 29.97 fps, 24 fps)
        fps = 30.0
        fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", stderr_text)
        if fps_match:
            try:
                fps = round(float(fps_match.group(1)), 2)
            except Exception:
                pass

        # 3. Duration (e.g. Duration: 00:00:15.50)
        duration = 0.0
        dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", stderr_text)
        if dur_match:
            try:
                h = int(dur_match.group(1))
                m = int(dur_match.group(2))
                s = float(dur_match.group(3))
                duration = round(h * 3600 + m * 60 + s, 2)
            except Exception:
                pass

        # 4. Audio stream detection
        has_audio = bool(re.search(r"Stream\s+#\d+:\d+.*:\s*Audio:", stderr_text, re.IGNORECASE))

        return {
            "width": width,
            "height": height,
            "duration_seconds": duration,
            "fps": fps,
            "has_audio": has_audio,
        }
