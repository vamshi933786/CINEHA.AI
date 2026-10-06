import pytest
from httpx import AsyncClient
from app.services.script_language_detector import (
    detect_script_language,
    normalize_language_contract,
    resolve_script_language,
    TELUGU_UNICODE_PATTERN,
)
from app.services.llm_provider import OfflineHeuristicMockProvider


def test_script_language_detector_unit():
    """Verifies that script language detection correctly identifies English, Telugu Unicode, and Tanglish."""
    # 1. English
    en_sample = "Most creators make this one big mistake when shooting 60fps video on their smartphone."
    assert detect_script_language(en_sample) == "English"

    # 2. Telugu Unicode
    te_sample = "చాలా మంది క్రియేటర్లు తమ ఫోన్‌లో 60fps వీడియో తీసేటప్పుడు ఈ పెద్ద తప్పు చేస్తారు."
    assert detect_script_language(te_sample) == "Telugu"
    assert bool(TELUGU_UNICODE_PATTERN.search(te_sample)) is True

    # 3. Tanglish (te-Latn)
    tanglish_sample = "Chala mandi creators 60fps lo shoot chesi pedda mistake chestaru! Ee video ni save cheskondi."
    assert detect_script_language(tanglish_sample) == "Tanglish"

    # 4. Contract Normalization
    assert normalize_language_contract("te") == "Telugu"
    assert normalize_language_contract("telugu") == "Telugu"
    assert normalize_language_contract("తెలుగు") == "Telugu"
    assert normalize_language_contract("tanglish") == "Tanglish"
    assert normalize_language_contract("te-Latn") == "Tanglish"
    assert normalize_language_contract("en") == "English"
    assert normalize_language_contract("english") == "English"
    assert normalize_language_contract(None) == "English"

    # 5. Language Resolution Priority
    # Explicit override takes highest precedence
    assert resolve_script_language("Telugu", en_sample) == "Telugu"
    assert resolve_script_language("Tanglish", te_sample) == "Tanglish"
    # Fallback to profile preference if explicit is empty
    assert resolve_script_language(None, en_sample, "Telugu") == "Telugu"
    # Fallback to script content detection if no explicit or profile
    assert resolve_script_language(None, te_sample) == "Telugu"
    assert resolve_script_language(None, tanglish_sample) == "Tanglish"
    assert resolve_script_language(None, en_sample) == "English"

    # Preventing silent English fallback when Telugu Unicode is in text even if caller passes None
    mixed_telugu = "Watch this video: ఈ 1 సెకను సెట్టింగ్ మీ వీడియోను సినిమాగా మారుస్తుంది!"
    assert resolve_script_language(None, mixed_telugu) == "Telugu"


@pytest.mark.asyncio
async def test_retention_analyzer_multilingual_modes():
    """Verifies that Retention Analyzer outputs localized findings, recommendations, and explanations for English, Telugu, and Tanglish."""
    provider = OfflineHeuristicMockProvider()

    # 1. English analysis
    en_res = await provider.analyze_script_retention(
        title="Why 24fps Feels Cinematic",
        topic="Frame Rate",
        platform="Instagram Reels",
        language="English",
        duration_seconds=15,
        hook="Stop shooting at 60fps!",
        segments=[
            {"start_time": "0:00", "end_time": "0:03", "section": "HOOK", "voiceover": "Stop shooting at 60fps!"},
            {"start_time": "0:03", "end_time": "0:15", "section": "BODY", "voiceover": "Switch to 24fps for cinema blur."},
        ],
        cta="Follow for more tips!",
    )
    assert en_res["language"] == "English"
    assert 0 <= en_res["overall_score"] <= 100
    assert 0 <= en_res["hook_clarity"]["score"] <= 100
    assert "hook" in en_res["hook_clarity"]["explanation"].lower() or "0" in en_res["hook_clarity"]["explanation"]
    assert len(en_res["weak_points"]) > 0
    assert len(en_res["recommendations"]) > 0

    # 2. Telugu Unicode analysis
    te_res = await provider.analyze_script_retention(
        title="ఫోన్ వీడియోను సినిమాగా మార్చే 1 ట్రిక్",
        topic="మొబైల్ సినిమాటోగ్రఫీ",
        platform="Instagram Reels",
        language="Telugu",
        duration_seconds=15,
        hook="మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ 24fps సీక్రెట్ తెలుసుకోండి!",
        segments=[
            {"start_time": "0:00", "end_time": "0:03", "section": "HOOK", "voiceover": "మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ 24fps సీక్రెట్ తెలుసుకోండి!"},
            {"start_time": "0:03", "end_time": "0:15", "section": "BODY", "voiceover": "కెమెరా సెట్టింగ్స్ లో 24fps మరియు 180 డిగ్రీల షట్టర్ రూల్ వాడండి."},
        ],
        cta="మరిన్ని సినిమా సీక్రెట్స్ కోసం ఇప్పుడే ఫాలో అవ్వండి!",
    )
    assert te_res["language"] == "Telugu"
    assert 0 <= te_res["overall_score"] <= 100
    # Explanations, recommendations, and weak points must be in Telugu script
    assert bool(TELUGU_UNICODE_PATTERN.search(te_res["hook_clarity"]["explanation"])) is True
    assert bool(TELUGU_UNICODE_PATTERN.search(te_res["overall_rating"])) is True
    assert any(bool(TELUGU_UNICODE_PATTERN.search(w)) for w in te_res["weak_points"])
    assert any(bool(TELUGU_UNICODE_PATTERN.search(r)) for r in te_res["recommendations"])
    assert any(bool(TELUGU_UNICODE_PATTERN.search(obs["observation"])) for obs in te_res["segment_observations"])

    # 3. Tanglish analysis
    tanglish_res = await provider.analyze_script_retention(
        title="Phone Footage Cinema Laga Marchandi",
        topic="Mobile Filmmaking",
        platform="Instagram Reels",
        language="Tanglish",
        duration_seconds=15,
        hook="Chala mandi creators 60fps lo shoot chesi pedda mistake chestaru!",
        segments=[
            {"start_time": "0:00", "end_time": "0:03", "section": "HOOK", "voiceover": "Chala mandi creators 60fps lo shoot chesi pedda mistake chestaru!"},
            {"start_time": "0:03", "end_time": "0:15", "section": "BODY", "voiceover": "Immediate ga 24fps switch chesi 180 shutter angle lock cheyandi."},
        ],
        cta="Next shoot ki mundu ee video ni save cheskondi!",
    )
    assert tanglish_res["language"] == "Tanglish"
    assert 0 <= tanglish_res["overall_score"] <= 100
    # Must contain Tanglish phrasing
    combined_tanglish = (
        tanglish_res["hook_clarity"]["explanation"]
        + " "
        + " ".join(tanglish_res["weak_points"])
        + " "
        + " ".join(tanglish_res["recommendations"])
    ).lower()
    assert any(k in combined_tanglish for k in ["chala", "cheyandi", "undi", "lone", "kante", "gurinchi", "script", "hook"])


@pytest.mark.asyncio
async def test_script_optimizer_multilingual_modes():
    """Verifies that Script Optimizer produces localized screenplay output and change reasons without mutating into English."""
    provider = OfflineHeuristicMockProvider()

    # 1. Telugu Optimization
    te_opt = await provider.optimize_script(
        title="ఫోన్ వీడియో",
        topic="మొబైల్ సినిమాటోగ్రఫీ",
        platform="Instagram Reels",
        language="Telugu",
        duration_seconds=15,
        tone="Cinematic",
        hook="మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ సీక్రెట్ చూడండి.",
        segments=[
            {
                "id": "seg_1",
                "start_time": "0:00",
                "end_time": "0:03",
                "section": "HOOK",
                "voiceover": "మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ సీక్రెట్ చూడండి.",
                "visual_direction": "కెమెరా క్లోజ్-అప్",
                "on_screen_text": "సీక్రెట్",
            },
            {
                "id": "seg_2",
                "start_time": "0:03",
                "end_time": "0:15",
                "section": "CTA",
                "voiceover": "మరిన్ని వీడియోల కోసం ఫాలో అవ్వండి.",
                "visual_direction": "కెమెరా స్మైల్",
                "on_screen_text": "ఫాలో అవ్వండి",
            },
        ],
        cta="మరిన్ని వీడియోల కోసం ఫాలో అవ్వండి.",
        goals=["improve_hook", "improve_cta", "remove_filler"],
    )

    assert te_opt["language"] == "Telugu"
    # Optimized hook and CTA must be authentic Telugu
    assert bool(TELUGU_UNICODE_PATTERN.search(te_opt["hook"])) is True
    assert bool(TELUGU_UNICODE_PATTERN.search(te_opt["cta"])) is True
    # Voiceovers must be authentic Telugu
    assert bool(TELUGU_UNICODE_PATTERN.search(te_opt["segments"][0]["voiceover"])) is True
    # Changes made reasons must be authentic Telugu
    assert any(bool(TELUGU_UNICODE_PATTERN.search(c["reason"])) for c in te_opt["changes_made"])

    # 2. Tanglish Optimization
    tanglish_opt = await provider.optimize_script(
        title="Phone Video Secrets",
        topic="Mobile Filmmaking",
        platform="Instagram Reels",
        language="Tanglish",
        duration_seconds=15,
        tone="Energetic",
        hook="Chala mandi creators ee pedda mistake chestaru.",
        segments=[
            {
                "id": "seg_1",
                "start_time": "0:00",
                "end_time": "0:03",
                "section": "HOOK",
                "voiceover": "Chala mandi creators ee pedda mistake chestaru.",
                "visual_direction": "Close up camera",
                "on_screen_text": "MISTAKE",
            },
            {
                "id": "seg_2",
                "start_time": "0:03",
                "end_time": "0:15",
                "section": "CTA",
                "voiceover": "Follow cheyandi next part kosam.",
                "visual_direction": "Smile",
                "on_screen_text": "FOLLOW",
            },
        ],
        cta="Follow cheyandi next part kosam.",
        goals=["improve_hook", "improve_cta"],
    )

    assert tanglish_opt["language"] == "Tanglish"
    # Voiceover, Hook, CTA should remain in Tanglish
    assert any(w in tanglish_opt["hook"].lower() for w in ["chala", "mistake", "pedda", "creators", "shoot", "setting"])
    assert any(w in tanglish_opt["cta"].lower() for w in ["save", "follow", "shoot", "cheskondi", "video"])
    assert any(w in c["reason"].lower() for c in tanglish_opt["changes_made"] for w in ["hook", "cta", "cheyandi", "retention", "attention"])


@pytest.mark.asyncio
async def test_api_multilingual_analyzer_and_optimizer_endpoints(async_client: AsyncClient):
    """Verifies that HTTP API routes respect explicit language and detected language for Telugu and Tanglish."""
    # 1. Direct Script Analysis in Telugu
    te_analysis_req = {
        "title": "తెలుగు స్క్రిప్ట్ ఆడిట్",
        "script_text": "HOOK: మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ 24fps సీక్రెట్ తెలుసుకోండి!\n[0:00 - 0:15] BODY: 24fps కి మారండి.\nCTA: ఇప్పుడే ఫాలో అవ్వండి!",
        "language": "Telugu",
        "duration_seconds": 15,
        "platform": "Instagram Reels",
    }
    te_res = await async_client.post("/api/v1/analyzer/script", json=te_analysis_req)
    assert te_res.status_code == 200
    te_data = te_res.json()
    assert te_data["language"] == "Telugu"
    assert bool(TELUGU_UNICODE_PATTERN.search(te_data["hook_clarity"]["explanation"])) is True
    assert bool(TELUGU_UNICODE_PATTERN.search(te_data["overall_rating"])) is True

    # 2. Direct Script Optimization in Telugu (Custom / Unsaved)
    te_opt_req = {
        "goals": ["improve_hook", "improve_cta"],
        "language": "Telugu",
        "title": "తెలుగు స్క్రిప్ట్ ఆప్టిమైజేషన్",
        "topic": "మొబైల్ సినిమా",
        "platform": "Instagram Reels",
        "duration_seconds": 15,
        "hook": "మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ సీక్రెట్ చూడండి.",
        "cta": "ఇప్పుడే ఫాలో అవ్వండి.",
        "segments": [
            {
                "id": "seg_1",
                "start_time": "0:00",
                "end_time": "0:03",
                "section": "HOOK",
                "voiceover": "మీ ఫోన్ వీడియోలు సినిమా లాగా రావాలంటే ఈ సీక్రెట్ చూడండి.",
                "visual_direction": "కెమెరా షాట్",
                "on_screen_text": "24FPS సీక్రెట్ 🎬",
            },
            {
                "id": "seg_2",
                "start_time": "0:03",
                "end_time": "0:15",
                "section": "CTA",
                "voiceover": "ఇప్పుడే ఫాలో అవ్వండి.",
                "visual_direction": "సైన్ చేయండి",
                "on_screen_text": "ఇప్పుడే ఫాలో అవ్వండి",
            },
        ],
    }
    te_opt_res = await async_client.post("/api/v1/scripts/optimize-custom", json=te_opt_req)
    assert te_opt_res.status_code == 200
    te_opt_data = te_opt_res.json()
    assert te_opt_data["optimized_script"]["language"] == "Telugu"
    assert bool(TELUGU_UNICODE_PATTERN.search(te_opt_data["optimized_script"]["hook"])) is True
    assert bool(TELUGU_UNICODE_PATTERN.search(te_opt_data["changes_made"][0]["reason"])) is True

    # 3. Direct Script Analysis in Tanglish
    tanglish_req = {
        "title": "Tanglish Screenplay Audit",
        "script_text": "HOOK: Chala mandi creators 60fps lo shoot chesi pedda mistake chestaru!\n[0:00 - 0:15] BODY: Switch to 24fps for cinematic blur.\nCTA: Next shoot ki mundu save cheskondi!",
        "language": "Tanglish",
        "duration_seconds": 15,
        "platform": "Instagram Reels",
    }
    tanglish_res = await async_client.post("/api/v1/analyzer/script", json=tanglish_req)
    assert tanglish_res.status_code == 200
    tanglish_data = tanglish_res.json()
    assert tanglish_data["language"] == "Tanglish"
