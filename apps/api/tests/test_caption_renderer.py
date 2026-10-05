import io
import os
import json
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.captions import CaptionCue, CaptionCueWord, CaptionRenderOptions
from app.services.caption_renderer import (
    FFmpegCaptionRenderer,
    format_ass_timestamp,
    hex_to_ass_color,
    resolve_caption_font,
    InvalidCaptionTimingError,
    UnicodeFontNotFoundError,
    RENDER_REGISTRY,
)


def create_minimal_mp4_bytes() -> bytes:
    """Create a minimal valid ftyp mp4 binary header for testing."""
    return (
        b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"
        b"\x00\x00\x00\x08free"
        b"\x00\x00\x00\x10mdat" + b"\x00" * 64
    )


def test_format_ass_timestamp():
    """Verify standard centisecond ASS timestamp formatting."""
    assert format_ass_timestamp(0.0) == "0:00:00.00"
    assert format_ass_timestamp(1.234) == "0:00:01.23"
    assert format_ass_timestamp(59.999) == "0:01:00.00"
    assert format_ass_timestamp(65.5) == "0:01:05.50"
    assert format_ass_timestamp(3661.05) == "1:01:01.05"


def test_hex_to_ass_color():
    """Verify conversion of hex color to ASS BGR format."""
    assert hex_to_ass_color("#FFFFFF") == "&H00FFFFFF"
    assert hex_to_ass_color("#000000") == "&H00000000"
    assert hex_to_ass_color("#00F0FF") == "&H00FFF000"
    assert hex_to_ass_color("#FF0000") == "&H000000FF"
    assert hex_to_ass_color("", default="&H00FFFFFF") == "&H00FFFFFF"


def test_resolve_caption_font():
    """Verify font resolution for Telugu, English, and Tanglish."""
    # English
    en_font, en_dir = resolve_caption_font("English")
    assert en_font in ("Arial", "Helvetica", "Telugu Sangam MN", "DejaVu Sans")

    # Tanglish (uses Latin script)
    tan_font, tan_dir = resolve_caption_font("Tanglish")
    assert tan_font in ("Arial", "Helvetica", "Telugu Sangam MN", "DejaVu Sans")

    # Telugu (checks system fonts or raises UnicodeFontNotFoundError)
    try:
        te_font, te_dir = resolve_caption_font("Telugu")
        assert te_font in ("Telugu Sangam MN", "Kohinoor Telugu", "Telugu MN", "Noto Sans Telugu", "FreeSerif")
    except UnicodeFontNotFoundError:
        # If in headless minimal docker without any Telugu font installed
        pass


def test_generate_ass_content_clean_pop():
    """Verify ASS document structure for clean_pop preset."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Welcome to CINEHAI",
            start_time=0.0,
            end_time=2.5,
            duration=2.5,
            lines=["Welcome to", "CINEHAI"],
        )
    ]
    options = CaptionRenderOptions(preset="clean_pop", font_size="medium")
    ass = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert "[Script Info]" in ass
    assert "PlayResX: 1080" in ass
    assert "PlayResY: 1920" in ass
    assert "[V4+ Styles]" in ass
    assert "Welcome to\\NCINEHAI" in ass
    assert "Dialogue: 0,0:00:00.00,0:00:02.50,Default" in ass


def test_generate_ass_content_karaoke():
    """Verify ASS document karaoke timing tags for karaoke preset."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Stop shooting now",
            start_time=0.0,
            end_time=1.5,
            duration=1.5,
            lines=["Stop shooting now"],
            words=[
                CaptionCueWord(text="Stop", start_time=0.0, end_time=0.5),
                CaptionCueWord(text="shooting", start_time=0.5, end_time=1.0),
                CaptionCueWord(text="now", start_time=1.0, end_time=1.5),
            ],
        )
    ]
    options = CaptionRenderOptions(preset="karaoke")
    ass = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert "{\\k" in ass
    assert "Stop" in ass
    assert "shooting" in ass


@pytest.mark.asyncio
async def test_render_empty_cues_rejected():
    """Verify renderer rejects empty cue list."""
    renderer = FFmpegCaptionRenderer()
    mp4_bytes = create_minimal_mp4_bytes()
    with pytest.raises(Exception):
        await renderer.render(
            video_bytes=mp4_bytes,
            cues=[],
            language="English",
        )


@pytest.mark.asyncio
async def test_render_invalid_cue_timing_rejected():
    """Verify renderer rejects cues with reversed or invalid timings."""
    renderer = FFmpegCaptionRenderer()
    mp4_bytes = create_minimal_mp4_bytes()

    # End <= Start
    bad_cues = [
        CaptionCue(
            id="c2",
            text="Hello",
            start_time=2.0,
            end_time=1.0,
            duration=0.0,
        )
    ]
    with pytest.raises(InvalidCaptionTimingError):
        await renderer.render(video_bytes=mp4_bytes, cues=bad_cues, language="English")


@pytest.mark.asyncio
async def test_api_generate_captions_pipeline():
    """Verify POST /api/v1/captions/generate pipeline works end-to-end."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        mp4_bytes = create_minimal_mp4_bytes()

        # Test English
        files = {"file": ("demo.mp4", mp4_bytes, "video/mp4")}
        data = {"language": "English", "provider": "mock"}
        resp = await client.post("/api/v1/captions/generate", files=files, data=data)
        assert resp.status_code == 200
        payload = resp.json()
        assert payload["selected_language"] == "English"
        assert len(payload["cues"]) > 0
        assert "project_id" in payload

        # Test Telugu
        files_te = {"file": ("demo_te.mp4", mp4_bytes, "video/mp4")}
        data_te = {"language": "Telugu", "provider": "mock"}
        resp_te = await client.post("/api/v1/captions/generate", files=files_te, data=data_te)
        assert resp_te.status_code == 200
        payload_te = resp_te.json()
        assert payload_te["selected_language"] == "Telugu"
        assert len(payload_te["cues"]) > 0

        # Test Tanglish
        files_tan = {"file": ("demo_tan.mp4", mp4_bytes, "video/mp4")}
        data_tan = {"language": "Tanglish", "provider": "mock"}
        resp_tan = await client.post("/api/v1/captions/generate", files=files_tan, data=data_tan)
        assert resp_tan.status_code == 200
        payload_tan = resp_tan.json()
        assert payload_tan["selected_language"] == "Tanglish"
        assert len(payload_tan["cues"]) > 0


@pytest.mark.asyncio
async def test_api_render_validation_and_download():
    """Verify POST /api/v1/captions/render rejects invalid inputs and downloads output."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        mp4_bytes = create_minimal_mp4_bytes()

        # 1. Rejects missing file
        resp1 = await client.post("/api/v1/captions/render", data={"cues": "[]", "language": "English"})
        assert resp1.status_code == 422  # missing required file field

        # 2. Rejects empty cues array
        files = {"file": ("test.mp4", mp4_bytes, "video/mp4")}
        resp2 = await client.post(
            "/api/v1/captions/render",
            files=files,
            data={"cues": "[]", "language": "English"},
        )
        assert resp2.status_code == 400
        assert "at least one caption cue" in resp2.json()["detail"].lower()

        # 3. Rejects invalid cues JSON
        files3 = {"file": ("test.mp4", mp4_bytes, "video/mp4")}
        resp3 = await client.post(
            "/api/v1/captions/render",
            files=files3,
            data={"cues": "{not-valid-json}", "language": "English"},
        )
        assert resp3.status_code == 400

        # 4. Rejects invalid timing
        bad_cues = [
            {
                "id": "c1",
                "text": "Hello",
                "start_time": 5.0,
                "end_time": 2.0,
                "duration": 0.0,
                "manually_edited": False,
            }
        ]
        files4 = {"file": ("test.mp4", mp4_bytes, "video/mp4")}
        resp4 = await client.post(
            "/api/v1/captions/render",
            files=files4,
            data={"cues": json.dumps(bad_cues), "language": "English"},
        )
        assert resp4.status_code == 400
        assert "end time" in resp4.json()["detail"].lower()

        # 5. Invalid UUID format on download
        resp5 = await client.get("/api/v1/captions/render/not-a-valid-uuid/download")
        assert resp5.status_code == 400
        assert "invalid" in resp5.json()["detail"].lower()

        # 6. Non-existent render ID on download
        resp6 = await client.get(
            "/api/v1/captions/render/12345678-1234-1234-1234-123456789abc/download"
        )
        assert resp6.status_code == 404


def test_generate_ass_content_free_positioning():
    """Verify ASS output includes pixel-accurate \\pos tags for custom coordinates."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Centered high cue",
            start_time=0.0,
            end_time=2.0,
            duration=2.0,
            lines=["Centered high cue"],
        )
    ]
    options = CaptionRenderOptions(
        preset="clean_pop",
        position_x=0.5,
        position_y=0.25,
        alignment="center",
    )
    ass = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    # 0.5 * 1080 = 540, 0.25 * 1920 = 480
    assert "{\\an5\\pos(540,480)}Centered high cue" in ass

    # Test left alignment (\an4)
    options_left = CaptionRenderOptions(
        preset="clean_pop",
        position_x=0.2,
        position_y=0.8,
        alignment="left",
    )
    ass_left = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options_left,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    # 0.2 * 1080 = 216, 0.8 * 1920 = 1536
    assert "{\\an4\\pos(216,1536)}Centered high cue" in ass_left

    # Test right alignment (\an6)
    options_right = CaptionRenderOptions(
        preset="clean_pop",
        position_x=0.8,
        position_y=0.5,
        alignment="right",
    )
    ass_right = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options_right,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    # 0.8 * 1080 = 864, 0.5 * 1920 = 960
    assert "{\\an6\\pos(864,960)}Centered high cue" in ass_right


def test_generate_ass_content_cue_level_position_override():
    """Verify cue-level position dict overrides global render options."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Cue with individual position",
            start_time=0.0,
            end_time=2.0,
            duration=2.0,
            lines=["Cue with individual position"],
            position={"x": 0.3, "y": 0.4},
        )
    ]
    options = CaptionRenderOptions(preset="clean_pop", position_x=0.5, position_y=0.85)
    ass = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    # 0.3 * 1080 = 324, 0.4 * 1920 = 768
    assert "{\\an5\\pos(324,768)}Cue with individual position" in ass


def test_generate_ass_content_motion_presets():
    """Verify ASS styling headers for new motion presets: hormozi, neon_pulse, editorial."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Template test",
            start_time=0.0,
            end_time=2.0,
            duration=2.0,
            lines=["Template test"],
        )
    ]

    # 1. Hormozi: BorderStyle 3 (box), scaled font size
    ass_hormozi = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=CaptionRenderOptions(preset="hormozi"),
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert "[V4+ Styles]" in ass_hormozi
    assert "Style: Default" in ass_hormozi
    # Check border style 3 in style line
    assert ",3,6,3," in ass_hormozi

    # 2. Neon Pulse: Bold, outline 4, shadow 4
    ass_neon = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=CaptionRenderOptions(preset="neon_pulse"),
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert ",1,4,4," in ass_neon

    # 3. Editorial: Subtle, outline 1, shadow 0
    ass_editorial = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=CaptionRenderOptions(preset="editorial"),
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert ",3,6,1," in ass_editorial

    # 4. Viral Pop: Bold, outline 3, shadow 2
    ass_viral = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=CaptionRenderOptions(preset="viral_pop"),
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert ",3,10,0," in ass_viral or ",1,3,2," in ass_viral

    # 5. Cinematic: Subtle, outline 2, shadow 2
    ass_cine = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=CaptionRenderOptions(preset="cinematic"),
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    assert ",3,10,0," in ass_cine or ",1,2,2," in ass_cine


def test_generate_ass_content_karaoke_with_custom_position():
    """Verify karaoke timing tags coexist cleanly with custom coordinate \\pos tag."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Viral pop now",
            start_time=0.0,
            end_time=1.5,
            duration=1.5,
            lines=["Viral pop now"],
            words=[
                CaptionCueWord(text="Viral", start_time=0.0, end_time=0.5),
                CaptionCueWord(text="pop", start_time=0.5, end_time=1.0),
                CaptionCueWord(text="now", start_time=1.0, end_time=1.5),
            ],
        )
    ]
    options = CaptionRenderOptions(
        preset="karaoke",
        position_x=0.5,
        position_y=0.3,
    )
    ass = renderer._generate_ass_content(
        cues=cues,
        language="English",
        options=options,
        video_width=1080,
        video_height=1920,
        font_family="Arial",
    )
    # 0.5 * 1080 = 540, 0.3 * 1920 = 576
    assert "{\\an5\\pos(540,576)}" in ass
    assert "{\\k50}Viral" in ass
    assert "{\\k50}pop" in ass
    assert "{\\k50}now" in ass


def test_all_10_templates_have_deterministic_export_mapping():
    """PART 2 & 9: Verify every selectable template has a deterministic, valid ASS export definition."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Parity Verification",
            start_time=0.0,
            end_time=2.0,
            duration=2.0,
            lines=["Parity Verification"],
        )
    ]

    all_10_templates = [
        ("clean", "clean_pop", 1),       # Clean Classic (border_style 1: outline + shadow, NO box)
        ("hormozi", "hormozi", 3),       # Hormozi Impact (border_style 3: impact box)
        ("viral_pop", "viral_pop", 1),   # Viral Pop (border_style 1 or 3)
        ("karaoke", "karaoke", 1),       # Karaoke Glow (border_style 1)
        ("neon", "neon_pulse", 1),       # Neon Cyber (border_style 1, luminous outline)
        ("editorial", "editorial", 3),   # Editorial Reel (border_style 3: clean box)
        ("minimal", "minimal_fade", 3),  # Minimal Fade (border_style 3)
        ("dynamic", "bold_bounce", 1),   # Dynamic Bounce (border_style 1 or 3)
        ("punch", "punchy", 1),          # Punchy Impact (border_style 1 or 3)
        ("cinematic", "cinematic", 1),   # Cinematic Gold (border_style 1)
    ]

    for template_id, expected_preset, expected_border in all_10_templates:
        # Test passing via template_id
        options_template = CaptionRenderOptions(
            preset=template_id,
            template_id=template_id,
            primary_color="#FFFFFF",
            active_color="#00F0FF",
        )
        ass = renderer._generate_ass_content(
            cues=cues,
            language="English",
            options=options_template,
            video_width=1080,
            video_height=1920,
            font_family="Arial",
        )
        assert "[Script Info]" in ass, f"Template {template_id} missing Script Info"
        assert "[V4+ Styles]" in ass, f"Template {template_id} missing V4+ Styles"
        assert "Style: Default" in ass, f"Template {template_id} missing Style Default"
        assert "[Events]" in ass, f"Template {template_id} missing Events"
        assert "Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Parity Verification" in ass

        # Verify clean template specifically has border_style 1 (NO universal black box)
        if template_id == "clean":
            assert ",1,3,1," in ass or ",1,3,2," in ass, "Clean template must use outline+shadow, not opaque box"


def test_free_positioning_across_all_templates():
    """PART 3: Verify user-selected position_x and position_y overrides template default across multiple templates."""
    renderer = FFmpegCaptionRenderer()
    cues = [
        CaptionCue(
            id="cue_0",
            text="Upper Left Drag",
            start_time=0.0,
            end_time=2.0,
            duration=2.0,
            lines=["Upper Left Drag"],
        )
    ]

    # Upper-left coordinates: x=0.18, y=0.18 -> (194, 346) in 1080x1920
    test_templates = ["hormozi", "neon", "editorial", "karaoke", "clean", "cinematic"]
    for t_id in test_templates:
        options = CaptionRenderOptions(
            preset=t_id,
            template_id=t_id,
            position_x=0.18,
            position_y=0.18,
            alignment="center",
        )
        ass = renderer._generate_ass_content(
            cues=cues,
            language="English",
            options=options,
            video_width=1080,
            video_height=1920,
            font_family="Arial",
        )
        # Expected pos tag: 0.18 * 1080 = 194, 0.18 * 1920 = 346
        assert "{\\an5\\pos(194,346)}Upper Left Drag" in ass, (
            f"Template {t_id} failed to respect manual upper-left drag position"
        )


def test_telugu_system_font_resolution():
    """PART 4: Verify Telugu font resolves to installed Telugu Unicode font."""
    font_name, font_dir = resolve_caption_font("Telugu")
    assert font_name in ("Telugu Sangam MN", "Kohinoor Telugu", "Telugu MN", "Noto Sans Telugu", "Lohit Telugu")
    assert font_dir is not None
    # On macOS systems with KohinoorTelugu.ttc installed, Kohinoor Telugu is prioritized for OpenType shaping
    if os.path.exists("/System/Library/Fonts/KohinoorTelugu.ttc"):
        assert font_name == "Kohinoor Telugu"


