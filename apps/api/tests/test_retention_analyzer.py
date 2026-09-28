import pytest
from httpx import AsyncClient
from app.services.llm_provider import OfflineHeuristicMockProvider
from app.agents.retention_analyzer_agent import RetentionAnalyzerAgent
from app.schemas.analyzer import ScriptAnalysisRequest
from app.schemas.script import ScriptSegmentSchema


@pytest.mark.asyncio
async def test_offline_heuristic_analyzer_direct():
    provider = OfflineHeuristicMockProvider()

    segments = [
        {
            "id": "seg_1",
            "section": "HOOK",
            "start_time": "0:00",
            "end_time": "0:03",
            "visual_direction": "Extreme close up of camera lens",
            "voiceover": "Stop scrolling! This 3-second camera trick makes any phone footage look cinematic.",
            "b_roll": "Macro glass reflection",
            "on_screen_text": "CINEMATIC PHONE TRICK",
            "audio_direction": "Sub bass drop",
        },
        {
            "id": "seg_2",
            "section": "PROBLEM",
            "start_time": "0:03",
            "end_time": "0:12",
            "visual_direction": "Side-by-side comparison of jittery footage versus locked 24fps",
            "voiceover": "Most creators shoot at default 60fps with high shutter speeds, creating that cheap soap opera effect.",
            "b_roll": "Harsh jittery footage",
            "on_screen_text": "DEFAULT 60FPS VS 24FPS",
            "audio_direction": "Subtle swoosh",
        },
        {
            "id": "seg_3",
            "section": "SOLUTION",
            "start_time": "0:12",
            "end_time": "0:25",
            "visual_direction": "Host tapping manual camera settings",
            "voiceover": "Lock your shutter angle to 180 degrees and drop your ISO down to minimum.",
            "b_roll": "Interface screencast",
            "on_screen_text": "180° RULE + MIN ISO",
            "audio_direction": "Upbeat synth pulse",
        },
        {
            "id": "seg_4",
            "section": "CTA",
            "start_time": "0:25",
            "end_time": "0:30",
            "visual_direction": "Host smiling pointing down to bookmark icon",
            "voiceover": "Save this guide and try it on your next shoot!",
            "b_roll": "Phone saving animation",
            "on_screen_text": "SAVE FOR LATER",
            "audio_direction": "Closing bell chime",
        },
    ]

    result = await provider.analyze_script_retention(
        title="Cinematic Phone Trick",
        topic="Mobile Filmmaking",
        platform="Instagram Reels",
        language="English",
        duration_seconds=30,
        hook="Stop scrolling! This 3-second camera trick makes any phone footage look cinematic.",
        segments=segments,
        cta="Save this guide and try it on your next shoot!",
        niche="Mobile Filmmaking",
        target_audience="Beginner filmmakers",
    )

    # Check overall score and qualitative label
    assert 0 <= result["overall_score"] <= 100
    assert "Retention" in result["overall_rating"]

    # Check all 9 categories exist as direct keys in result
    expected_categories = [
        "hook_clarity",
        "hook_strength",
        "pacing_progression",
        "information_density",
        "filler_repetition",
        "segment_timing",
        "curiosity_open_loops",
        "cta_strength",
        "overall_retention_potential",
    ]
    for cat_name in expected_categories:
        assert cat_name in result
        cat_obj = result[cat_name]
        assert 0 <= cat_obj["score"] <= 100
        assert len(cat_obj["rating"]) > 0
        assert len(cat_obj["explanation"]) > 0

    # Check metrics
    metrics = result["metrics"]
    assert metrics["total_word_count"] > 0
    assert metrics["words_per_second"] > 0
    assert metrics["hook_duration_seconds"] == 3.0
    assert metrics["cta_duration_seconds"] == 5.0
    assert isinstance(metrics["detected_filler_words"], list)

    # Check segment observations
    assert len(result["segment_observations"]) == len(segments)
    for obs in result["segment_observations"]:
        assert obs["retention_risk"] in ["low", "medium", "high"]
        assert len(obs["observation"]) > 0

    # Check weak points and recommendations
    assert isinstance(result["weak_points"], list)
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) > 0


@pytest.mark.asyncio
async def test_analyzer_detects_filler_and_slow_pacing():
    provider = OfflineHeuristicMockProvider()

    segments = [
        {
            "id": "seg_1",
            "section": "HOOK",
            "start_time": "0:00",
            "end_time": "0:08",
            "visual_direction": "Person talking",
            "voiceover": "Hey guys, in this video I basically want to actually talk about lighting.",
            "b_roll": "",
            "on_screen_text": "",
            "audio_direction": "",
        },
        {
            "id": "seg_2",
            "section": "CTA",
            "start_time": "0:08",
            "end_time": "0:30",
            "visual_direction": "Person still talking",
            "voiceover": "So yeah, you know, kind of like and subscribe if you enjoyed this.",
            "b_roll": "",
            "on_screen_text": "",
            "audio_direction": "",
        },
    ]

    result = await provider.analyze_script_retention(
        title="Slow Script With Fillers",
        topic="Lighting",
        platform="Instagram Reels",
        language="English",
        duration_seconds=30,
        hook="Hey guys, in this video I basically want to actually talk about lighting.",
        segments=segments,
        cta="So yeah, you know, kind of like and subscribe if you enjoyed this.",
    )

    # Filler words detected should find candidates like 'hey guys', 'in this video', 'basically', 'actually', 'you know', 'kind of', 'like and subscribe'
    fillers = result["metrics"]["detected_filler_words"]
    assert len(fillers) >= 3

    # Filler repetition score should be penalized (< 75)
    assert result["filler_repetition"]["score"] < 75

    # Hook duration is 8s (> 4.5s), hook timing / strength should have lower score
    assert result["hook_strength"]["score"] <= 75 or result["segment_timing"]["score"] <= 75


@pytest.mark.asyncio
async def test_retention_analyzer_agent_fallback():
    class BrokenProvider:
        async def analyze_script_retention(self, *args, **kwargs):
            raise RuntimeError("Gemini model service offline")

    agent = RetentionAnalyzerAgent(provider=BrokenProvider())

    req = ScriptAnalysisRequest(
        title="Test Script",
        segments=[
            ScriptSegmentSchema(
                id="seg_1",
                section="HOOK",
                start_time="0:00",
                end_time="0:03",
                visual_direction="Visual 1",
                voiceover="Hook voiceover line without fillers",
                on_screen_text="HOOK TEXT",
            ),
            ScriptSegmentSchema(
                id="seg_2",
                section="CTA",
                start_time="0:03",
                end_time="0:15",
                visual_direction="Visual 2",
                voiceover="Save this video right now!",
                on_screen_text="SAVE NOW",
            ),
        ],
    )

    class DummyDB:
        async def execute(self, *args, **kwargs):
            class DummyResult:
                def scalar_one_or_none(self):
                    return None
            return DummyResult()

    res = await agent.analyze(request=req, db=DummyDB())
    assert res.overall_score > 0
    assert res.hook_clarity.score > 0
    assert res.provider_used == "heuristic_mock"


@pytest.mark.asyncio
async def test_retention_analyzer_endpoints(async_client: AsyncClient):
    # 1. Create a script first via Script Studio endpoint
    gen_payload = {
        "topic": "Microphone Placement Secrets",
        "platform": "TikTok",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Punchy",
        "hook": "Your audio sounds terrible because of this 2-inch mistake.",
        "cta": "Save this before your next shoot!",
    }
    create_res = await async_client.post("/api/v1/scripts/generate", json=gen_payload)
    assert create_res.status_code == 201
    script_data = create_res.json()
    script_id = script_data["id"]

    # 2. Test GET /api/v1/analyzer/script/{script_id}
    res_by_id = await async_client.get(f"/api/v1/analyzer/script/{script_id}")
    assert res_by_id.status_code == 200
    analysis_1 = res_by_id.json()
    assert analysis_1["script_id"] == script_id
    assert 0 <= analysis_1["overall_score"] <= 100
    assert analysis_1["hook_clarity"]["score"] > 0
    assert len(analysis_1["segment_observations"]) == len(script_data["segments"])

    # 3. Test POST /api/v1/scripts/{script_id}/analyze shortcut
    shortcut_res = await async_client.post(f"/api/v1/scripts/{script_id}/analyze")
    assert shortcut_res.status_code == 200
    analysis_shortcut = shortcut_res.json()
    assert analysis_shortcut["script_id"] == script_id
    assert analysis_shortcut["overall_score"] == analysis_1["overall_score"]

    # 4. Test POST /api/v1/analyzer/script with raw request body
    raw_payload = {
        "title": "Raw Script Direct Audit",
        "topic": "Direct Audit",
        "platform": "YouTube Shorts",
        "language": "English",
        "duration_seconds": 15,
        "hook": "Never place your key light directly in front of you.",
        "cta": "Follow for more lighting secrets!",
        "segments": script_data["segments"],
    }
    raw_res = await async_client.post("/api/v1/analyzer/script", json=raw_payload)
    assert raw_res.status_code == 200
    analysis_raw = raw_res.json()
    assert analysis_raw["title"] == "Raw Script Direct Audit"
    assert analysis_raw["overall_retention_potential"]["score"] > 0


@pytest.mark.asyncio
async def test_analyzer_not_found_and_validation(async_client: AsyncClient):
    # Non-existent script ID
    res = await async_client.get("/api/v1/analyzer/script/non-existent-uuid-12345")
    assert res.status_code == 404

    # Empty payload without segments or script_id
    empty_res = await async_client.post("/api/v1/analyzer/script", json={})
    assert empty_res.status_code == 422
