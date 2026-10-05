import os
import re
import time
import uuid
import shutil
import tempfile
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.captions import (
    CaptionCue,
    CaptionRenderOptions,
    CaptionRenderResult,
)
from app.services.video_validator import validate_video_upload
from app.services.audio_extractor import get_ffmpeg_binary_path, FFmpegNotFoundError

logger = logging.getLogger(__name__)


class CaptionRenderError(Exception):
    """Base exception for caption rendering failures."""
    pass


class UnicodeFontNotFoundError(CaptionRenderError):
    """Raised when the required Unicode font for a target language is missing."""
    pass


class InvalidCaptionTimingError(CaptionRenderError):
    """Raised when caption cues contain invalid start or end timestamps."""
    pass


# Global Render Cache Registry: Maps render_id -> metadata dictionary
RENDER_REGISTRY: Dict[str, Dict[str, Any]] = {}
CACHE_MAX_AGE_SECONDS = 7200  # 2 hours


def get_render_cache_directory() -> str:
    """Return the designated local directory for rendered video cache."""
    cache_dir = settings.RENDER_CACHE_DIR
    if not cache_dir:
        cache_dir = os.path.join(tempfile.gettempdir(), "cinehai_caption_renders")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir


def cleanup_expired_renders() -> None:
    """Prune rendered videos older than CACHE_MAX_AGE_SECONDS."""
    now = time.time()
    expired_ids = []
    for r_id, meta in list(RENDER_REGISTRY.items()):
        if now - meta.get("created_at", 0) > CACHE_MAX_AGE_SECONDS:
            expired_ids.append(r_id)
            filepath = meta.get("filepath")
            if filepath and os.path.exists(filepath):
                try:
                    os.unlink(filepath)
                except OSError:
                    pass

    for r_id in expired_ids:
        RENDER_REGISTRY.pop(r_id, None)


def hex_to_ass_color(color_str: str, default: str = "&H00FFFFFF") -> str:
    """
    Convert CSS hex (#RRGGBB, #AARRGGBB) or rgb/rgba string into ASS color format (&HAABBGGRR).
    Note: ASS uses inverted Alpha (00 = fully opaque, FF = fully transparent) and BGR ordering.
    """
    if not color_str:
        return default

    color_str = color_str.strip()
    # Check for rgba(r, g, b, a) or rgb(r, g, b)
    rgba_match = re.match(
        r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\s*\)",
        color_str,
        re.IGNORECASE,
    )
    if rgba_match:
        r = int(rgba_match.group(1))
        g = int(rgba_match.group(2))
        b = int(rgba_match.group(3))
        alpha_val = float(rgba_match.group(4)) if rgba_match.group(4) is not None else 1.0
        # Invert alpha for ASS (1.0 opacity -> 0x00, 0.0 opacity -> 0xFF)
        ass_alpha = max(0, min(255, int(round((1.0 - alpha_val) * 255))))
        return f"&H{ass_alpha:02X}{b:02X}{g:02X}{r:02X}"

    clean = color_str.lstrip("#")
    if len(clean) == 6:
        r, g, b = clean[0:2], clean[2:4], clean[4:6]
        return f"&H00{b.upper()}{g.upper()}{r.upper()}"
    elif len(clean) == 8:
        # If #AARRGGBB provided
        a, r, g, b = clean[0:2], clean[2:4], clean[4:6], clean[6:8]
        return f"&H{a.upper()}{b.upper()}{g.upper()}{r.upper()}"
    return default


def format_ass_timestamp(seconds: float) -> str:
    """Format floating seconds into standard ASS timestamp: H:MM:SS.cs (centiseconds)."""
    if seconds < 0:
        seconds = 0.0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds % 1) * 100))
    if cs >= 100:
        s += 1
        cs -= 100
        if s >= 60:
            m += 1
            s -= 60
            if m >= 60:
                h += 1
                m -= 60
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def resolve_caption_font(language: str) -> Tuple[str, Optional[str]]:
    """
    Determine the optimal font family and optional font directory for the target script.
    Checks:
    1. settings.TELUGU_FONT_PATH or custom environment configuration
    2. System-installed Telugu Unicode fonts (macOS, Linux, Windows)
    3. Standard Latin fonts for English / Tanglish
    Raises UnicodeFontNotFoundError if Telugu is required but no Telugu font is found.
    """
    if language == "Telugu":
        # 1. Custom configured font path
        if settings.TELUGU_FONT_PATH:
            if os.path.exists(settings.TELUGU_FONT_PATH):
                font_dir = os.path.dirname(settings.TELUGU_FONT_PATH)
                base = os.path.splitext(os.path.basename(settings.TELUGU_FONT_PATH))[0]
                return (base, font_dir)
            else:
                logger.warning(
                    f"Configured TELUGU_FONT_PATH '{settings.TELUGU_FONT_PATH}' was not found. Checking system fonts."
                )

        # 2. Known Telugu font paths on macOS / Linux
        candidate_paths = [
            # macOS system font locations
            ("/System/Library/Fonts/Supplemental/Telugu Sangam MN.ttc", "Telugu Sangam MN"),
            ("/System/Library/Fonts/KohinoorTelugu.ttc", "Kohinoor Telugu"),
            ("/System/Library/Fonts/Supplemental/Telugu MN.ttc", "Telugu MN"),
            ("/Library/Fonts/Telugu Sangam MN.ttc", "Telugu Sangam MN"),
            ("/Library/Fonts/Arial Unicode.ttf", "Arial Unicode MS"),
            # Linux / Debian / Ubuntu / Fedora font locations
            ("/usr/share/fonts/truetype/noto/NotoSansTelugu-Regular.ttf", "Noto Sans Telugu"),
            ("/usr/share/fonts/opentype/noto/NotoSansTelugu-Regular.otf", "Noto Sans Telugu"),
            ("/usr/share/fonts/lohit-telugu/Lohit-Telugu.ttf", "Lohit Telugu"),
            ("/usr/share/fonts/truetype/freefont/FreeSerif.ttf", "FreeSerif"),
        ]

        for font_path, family_name in candidate_paths:
            if os.path.exists(font_path):
                return (family_name, os.path.dirname(font_path))

        # Check fontconfig cache or directory scan if available
        for search_dir in ["/Library/Fonts", "/System/Library/Fonts/Supplemental", "/usr/share/fonts"]:
            if os.path.isdir(search_dir):
                for root, _, files in os.walk(search_dir):
                    for f in files:
                        if "telugu" in f.lower() and f.endswith((".ttf", ".otf", ".ttc")):
                            base_name = os.path.splitext(f)[0]
                            return (base_name, root)

        raise UnicodeFontNotFoundError(
            "Telugu Unicode font is unavailable on the host system. "
            "Please ensure 'Telugu Sangam MN' (macOS) or 'Noto Sans Telugu' (Linux) is installed to render Telugu captions."
        )

    # For English and Tanglish (Latin script)
    # Both use Latin glyphs. 'Telugu Sangam MN' also has Latin glyphs, or standard Arial / Helvetica.
    candidate_latin = [
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "Arial"),
        ("/Library/Fonts/Arial.ttf", "Arial"),
        ("/System/Library/Fonts/Helvetica.ttc", "Helvetica"),
        ("/System/Library/Fonts/Supplemental/Telugu Sangam MN.ttc", "Telugu Sangam MN"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVu Sans"),
    ]
    for font_path, family in candidate_latin:
        if os.path.exists(font_path):
            return (family, os.path.dirname(font_path))

    return ("Arial", None)


class BaseCaptionRenderer(ABC):
    """Abstract interface defining the video caption burning & rendering contract."""

    @abstractmethod
    async def render(
        self,
        video_bytes: bytes,
        cues: List[CaptionCue],
        language: str = "English",
        options: Optional[CaptionRenderOptions] = None,
        filename: Optional[str] = None,
    ) -> CaptionRenderResult:
        """Permanently burn caption cues into the video file and return render metadata."""
        pass


class FFmpegCaptionRenderer(BaseCaptionRenderer):
    """
    Production Video Caption Renderer utilizing FFmpeg with libass.
    Burns synchronized multi-lingual captions (English, Telugu, Tanglish) permanently into the video.
    Guarantees strict temporary file isolation and automatic cleanup.
    """

    def __init__(self, ffmpeg_bin: Optional[str] = None):
        self.ffmpeg_bin = ffmpeg_bin or get_ffmpeg_binary_path()

    def _generate_ass_content(
        self,
        cues: List[CaptionCue],
        language: str,
        options: CaptionRenderOptions,
        video_width: int,
        video_height: int,
        font_family: str,
    ) -> str:
        """
        Generate Advanced SubStation Alpha (.ass) subtitle document.
        Translates caption settings, presets, positions, and styling into deterministic ASS directives.
        """
        # Calculate proportional font scaling based on video resolution (1080x1920 baseline)
        scale_factor = video_height / 1920.0

        # Normalization mapping for template IDs and preset names
        preset_aliases = {
            "clean": "clean_pop",
            "clean_classic": "clean_pop",
            "clean_pop": "clean_pop",
            "hormozi": "hormozi",
            "hormozi_impact": "hormozi",
            "viral_pop": "viral_pop",
            "viral": "viral_pop",
            "karaoke": "karaoke",
            "karaoke_glow": "karaoke",
            "neon": "neon_pulse",
            "neon_pulse": "neon_pulse",
            "editorial": "editorial",
            "editorial_reel": "editorial",
            "minimal": "minimal_fade",
            "minimal_fade": "minimal_fade",
            "dynamic": "bold_bounce",
            "dynamic_bounce": "bold_bounce",
            "bold_bounce": "bold_bounce",
            "punch": "punchy",
            "punchy": "punchy",
            "cinematic": "cinematic",
            "cinematic_gold": "cinematic",
        }
        raw_key = (
            getattr(options, "template_id", None)
            or options.preset
            or "clean_pop"
        ).lower().strip().replace(" ", "_")
        preset = preset_aliases.get(raw_key, raw_key)

        # Base font size calculation
        font_size_map = {
            "small": 48,
            "medium": 64,
            "large": 80,
        }
        base_size = font_size_map.get(options.font_size, 64)

        if preset in ("bold_bounce", "dynamic"):
            base_size += 12
        elif preset in ("punchy", "punch"):
            base_size += 8
        elif preset == "hormozi":
            base_size += 16
        elif preset in ("neon_pulse", "neon"):
            base_size += 10
        elif preset == "editorial":
            base_size += 6
        elif preset == "viral_pop":
            base_size += 8
        elif preset == "cinematic":
            base_size += 4

        scaled_font_size = max(24, int(base_size * scale_factor))

        # Colors from options (which inherit the active template styling)
        primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
        active_color_ass = hex_to_ass_color(options.active_color, "&H0000F0FF")
        bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H4D000000")  # ~30% alpha default
        outline_color_ass = "&H00000000"  # Opaque black outline default

        # Template-specific styling configurations
        outline_width = 3
        shadow_depth = 2
        border_style = 1  # 1 = outline + drop shadow, 3 = opaque box
        bold_flag = -1 if options.font_weight in ("bold", "black") else 0
        fade_in_ms = 0
        fade_out_ms = 0

        if preset == "karaoke":
            # Primary is active highlight, Secondary is inactive text
            primary_color_ass = active_color_ass
            secondary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            outline_width = 3
            shadow_depth = 2
            border_style = 1
        elif preset in ("punchy", "punch"):
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H0000D7FF")
            secondary_color_ass = active_color_ass
            outline_width = 4
            shadow_depth = 3
            bold_flag = -1
            border_style = 3 if options.background == "box" else 1
            bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H1A000000")
        elif preset == "hormozi":
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = active_color_ass
            border_style = 3  # Impact box
            outline_width = 6
            shadow_depth = 3
            bold_flag = -1
            bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H14000000")
        elif preset in ("neon_pulse", "neon"):
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = active_color_ass
            outline_width = 4
            shadow_depth = 4
            bold_flag = -1
            border_style = 1
        elif preset == "editorial":
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00F8FAFC")
            secondary_color_ass = active_color_ass
            border_style = 3
            outline_width = 6
            shadow_depth = 1
            bold_flag = -1
            bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H33000000")
        elif preset == "viral_pop":
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = hex_to_ass_color(options.active_color, "&H00D4B606")
            outline_width = 3
            shadow_depth = 2
            bold_flag = -1
            border_style = 3 if options.background == "box" else 1
            bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H59000000")
        elif preset == "cinematic":
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00F7FBFD")
            secondary_color_ass = hex_to_ass_color(options.active_color, "&H000BB5F5")
            outline_width = 2
            shadow_depth = 2
            bold_flag = -1
            border_style = 1
        elif preset in ("bold_bounce", "dynamic"):
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = active_color_ass
            outline_width = 5
            shadow_depth = 2
            bold_flag = -1
            border_style = 3 if options.background == "box" else 1
            bg_box_ass = hex_to_ass_color(options.active_bg_color, "&H66701C58")  # Purple backing
        elif preset in ("minimal_fade", "minimal"):
            border_style = 3  # Clean bounding box
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = primary_color_ass
            outline_width = 8
            shadow_depth = 0
        else:  # clean_pop (Clean Classic)
            primary_color_ass = hex_to_ass_color(options.primary_color, "&H00FFFFFF")
            secondary_color_ass = active_color_ass
            outline_width = 3
            shadow_depth = 1
            border_style = 1  # High contrast drop shadow, NO universal black box

        # Background override if specified explicitly by options
        if options.background == "box" and preset not in ("minimal_fade", "hormozi", "editorial", "neon_pulse"):
            border_style = 3
            outline_width = 10  # box padding
            shadow_depth = 0
        elif options.background == "none" and preset not in ("minimal_fade", "hormozi", "editorial"):
            border_style = 1
            outline_width = 3 if preset in ("clean_pop", "clean") else 1
            shadow_depth = 1 if preset in ("clean_pop", "clean") else 0
        elif options.background == "outline":
            border_style = 1
            outline_width = max(outline_width, 4)

        # Alignment calculation (ASS numpad style)
        align_row = 2  # bottom
        if options.vertical_position == "center":
            align_row = 5
        elif options.vertical_position == "top":
            align_row = 8

        align_offset = 0
        if options.alignment == "left":
            align_offset = -1
        elif options.alignment == "right":
            align_offset = 1

        alignment_val = align_row + align_offset

        margin_v = int(180 * scale_factor)
        if options.vertical_position == "center":
            margin_v = 0
        margin_h = int(60 * scale_factor)

        # Build ASS document header
        ass_lines = [
            "[Script Info]",
            "ScriptType: v4.00+",
            f"PlayResX: {video_width}",
            f"PlayResY: {video_height}",
            "ScaledBorderAndShadow: yes",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,{font_family},{scaled_font_size},{primary_color_ass},{secondary_color_ass},{outline_color_ass},{bg_box_ass},{bold_flag},0,0,0,100,100,0,0,{border_style},{outline_width},{shadow_depth},{alignment_val},{margin_h},{margin_h},{margin_v},1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]

        for cue in cues:
            start_str = format_ass_timestamp(cue.start_time)
            end_str = format_ass_timestamp(cue.end_time)

            # Determine free position override if configured on options or cue
            cue_pos_x = options.position_x
            cue_pos_y = options.position_y
            if cue.position and isinstance(cue.position, dict):
                if "x" in cue.position:
                    try:
                        cue_pos_x = float(cue.position["x"])
                    except (ValueError, TypeError):
                        pass
                if "y" in cue.position:
                    try:
                        cue_pos_y = float(cue.position["y"])
                    except (ValueError, TypeError):
                        pass

            pos_tag = ""
            if cue_pos_x is not None and cue_pos_y is not None:
                # Clamp to safe bounds [0.05, 0.95]
                clamped_x = max(0.05, min(0.95, cue_pos_x))
                clamped_y = max(0.05, min(0.95, cue_pos_y))
                pos_x_px = int(round(clamped_x * video_width))
                pos_y_px = int(round(clamped_y * video_height))

                # Align code: 4=left, 6=right, 5=center
                align_code = 5
                if options.alignment == "left":
                    align_code = 4
                elif options.alignment == "right":
                    align_code = 6

                pos_tag = f"{{\\an{align_code}\\pos({pos_x_px},{pos_y_px})}}"

            cue_text = ""
            # Handle Karaoke preset if word timings exist
            if preset == "karaoke" and cue.words and len(cue.words) > 0:
                karaoke_parts = []
                last_time = cue.start_time
                for w in cue.words:
                    word_duration_cs = max(1, int(round((w.end_time - w.start_time) * 100)))
                    lead_gap_cs = int(round(max(0.0, w.start_time - last_time) * 100))
                    if lead_gap_cs > 0:
                        karaoke_parts.append(f"{{\\k{lead_gap_cs}}}")
                    karaoke_parts.append(f"{{\\k{word_duration_cs}}}{w.text} ")
                    last_time = w.end_time
                cue_text = "".join(karaoke_parts).strip()
            else:
                # Regular dialogue text with line breaks (\N)
                if cue.lines and len(cue.lines) > 0:
                    cue_text = "\\N".join(cue.lines)
                else:
                    cue_text = cue.text.replace("\n", "\\N")

            ass_lines.append(
                f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{pos_tag}{cue_text}"
            )

        return "\n".join(ass_lines) + "\n"

    async def _probe_video_properties(
        self, video_path: str
    ) -> Tuple[int, int, float, bool]:
        """
        Probe input video file dimensions, duration, and audio track presence using FFmpeg.
        Returns (width, height, duration_seconds, has_audio_stream).
        """
        cmd = [self.ffmpeg_bin, "-i", video_path]
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        stderr_text = stderr.decode("utf-8", errors="replace")

        # Probing dimensions (e.g. 1080x1920)
        width, height = 1080, 1920
        dim_match = re.search(r"Stream.*Video:.*,\s*(\d{2,5})x(\d{2,5})", stderr_text)
        if dim_match:
            try:
                width = int(dim_match.group(1))
                height = int(dim_match.group(2))
            except Exception:
                pass

        # Probing duration (e.g. Duration: 00:00:15.50)
        duration = 0.0
        dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", stderr_text)
        if dur_match:
            try:
                h = int(dur_match.group(1))
                m = int(dur_match.group(2))
                s = float(dur_match.group(3))
                duration = h * 3600 + m * 60 + s
            except Exception:
                pass

        has_audio = "Audio:" in stderr_text
        return (width, height, duration, has_audio)

    async def render(
        self,
        video_bytes: bytes,
        cues: List[CaptionCue],
        language: str = "English",
        options: Optional[CaptionRenderOptions] = None,
        filename: Optional[str] = None,
    ) -> CaptionRenderResult:
        """
        Execute FFmpeg composition to burn captions permanently into the video.
        Validates container integrity, timings, and Unicode font requirements.
        """
        if not self.ffmpeg_bin:
            raise FFmpegNotFoundError(
                "FFmpeg is required for video caption rendering but is not installed or available on this system."
            )

        # 1. Validate cues
        if not cues:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No caption cues were provided for video rendering.",
            )

        for idx, cue in enumerate(cues):
            if cue.start_time < 0:
                raise InvalidCaptionTimingError(
                    f"Cue {idx} has invalid negative start time ({cue.start_time}s)."
                )
            if cue.end_time <= cue.start_time:
                raise InvalidCaptionTimingError(
                    f"Cue {idx} end time ({cue.end_time}s) must be strictly greater than start time ({cue.start_time}s)."
                )

        # 2. Validate video container & size (<= 100MB)
        validation = validate_video_upload(
            file_bytes=video_bytes,
            filename=filename,
        )

        render_options = options or CaptionRenderOptions()

        # 3. Resolve Unicode font for target script
        font_family, fonts_dir = resolve_caption_font(language)

        # 4. Prepare temporary working directory
        temp_work_dir = tempfile.mkdtemp(prefix="cinehai_render_")
        video_input_path = os.path.join(temp_work_dir, "input_video.mp4")
        ass_path = os.path.join(temp_work_dir, "subtitles.ass")
        output_temp_path = os.path.join(temp_work_dir, "rendered_output.mp4")

        try:
            # Write input video
            with open(video_input_path, "wb") as f:
                f.write(video_bytes)

            # Probe video geometry and audio
            width, height, duration, has_audio = await self._probe_video_properties(
                video_input_path
            )
            if duration <= 0.0 and cues:
                duration = cues[-1].end_time

            # Generate ASS subtitle content
            ass_content = self._generate_ass_content(
                cues=cues,
                language=language,
                options=render_options,
                video_width=width,
                video_height=height,
                font_family=font_family,
            )

            with open(ass_path, "w", encoding="utf-8") as f:
                f.write(ass_content)

            # Escape subtitle path for FFmpeg filter parameter
            escaped_ass_path = ass_path.replace("\\", "/").replace(":", "\\:")
            subtitles_filter = f"subtitles={escaped_ass_path}"
            if fonts_dir and os.path.isdir(fonts_dir):
                escaped_fonts_dir = fonts_dir.replace("\\", "/").replace(":", "\\:")
                subtitles_filter += f":fontsdir={escaped_fonts_dir}"

            # Build FFmpeg command
            cmd = [
                self.ffmpeg_bin,
                "-y",
                "-i",
                video_input_path,
                "-vf",
                subtitles_filter,
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "22",
                "-pix_fmt",
                "yuv420p",
            ]

            # Audio stream handling
            if has_audio:
                cmd.extend(["-c:a", "aac", "-b:a", "192k"])
            else:
                cmd.append("-an")

            cmd.append(output_temp_path)

            logger.info(
                f"Starting FFmpeg caption rendering for language='{language}', cues={len(cues)}, preset='{render_options.preset}'"
            )

            # Execute FFmpeg rendering process
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await process.communicate()
            stderr_text = stderr.decode("utf-8", errors="replace")

            if process.returncode != 0:
                logger.error(f"FFmpeg rendering failed (code {process.returncode}): {stderr_text[-1000:]}")
                raise CaptionRenderError(
                    f"FFmpeg failed to burn captions into the video. Error: {stderr_text[-300:].strip()}"
                )

            # Verify output exists and is non-empty
            if not os.path.isfile(output_temp_path) or os.path.getsize(output_temp_path) == 0:
                raise CaptionRenderError("FFmpeg produced an empty or missing output video file.")

            final_file_size = os.path.getsize(output_temp_path)

            # Move rendered output to secure cache directory
            render_id = str(uuid.uuid4())
            cache_dir = get_render_cache_directory()
            cache_filepath = os.path.join(cache_dir, f"{render_id}.mp4")
            shutil.move(output_temp_path, cache_filepath)

            # Sanitize output filename
            base_original = os.path.splitext(os.path.basename(validation.filename or "video"))[0]
            clean_base = re.sub(r"[^\w\-]", "_", base_original)
            lang_suffix = language.lower()
            output_filename = f"{clean_base}_{lang_suffix}_captioned.mp4"

            # Register in render registry
            RENDER_REGISTRY[render_id] = {
                "render_id": render_id,
                "filepath": cache_filepath,
                "filename": output_filename,
                "created_at": time.time(),
                "file_size": final_file_size,
                "duration": duration,
                "caption_language": language,
                "caption_count": len(cues),
                "preset": render_options.preset,
            }

            # Prune old cache items
            cleanup_expired_renders()

            download_url = f"/api/v1/captions/render/{render_id}/download"

            return CaptionRenderResult(
                render_id=render_id,
                status="completed",
                output_filename=output_filename,
                mime_type="video/mp4",
                file_size=final_file_size,
                duration=round(duration, 2),
                caption_language=language,
                caption_count=len(cues),
                download_url=download_url,
                video_width=width,
                video_height=height,
                preset_used=render_options.preset,
                metadata={
                    "font_family": font_family,
                    "fonts_dir": fonts_dir,
                    "has_audio": has_audio,
                    "alignment": render_options.alignment,
                    "vertical_position": render_options.vertical_position,
                },
            )

        finally:
            # Guaranteed cleanup of isolated temporary working directory
            if os.path.exists(temp_work_dir):
                shutil.rmtree(temp_work_dir, ignore_errors=True)


def get_caption_renderer() -> BaseCaptionRenderer:
    """Return the default caption renderer instance."""
    return FFmpegCaptionRenderer()
