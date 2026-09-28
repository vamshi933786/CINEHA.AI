from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from app.services.llm_provider import OfflineHeuristicMockProvider
from app.agents.script_optimizer_agent import ScriptOptimizerAgent
from app.schemas.optimizer import ScriptOptimizationRequest, SaveOptimizedScriptRequest
from app.schemas.script import ScriptSegmentSchema


@pytest.mark.asyncio
async def test_offline_heuristic_optimizer_direct():
    provider = OfflineHeuristicMockProvider()

    segments = [
        {
            "id": "seg_1",
            "section": "HOOK",
            "start_time": "0:00",
            "end_time": "0:06",
            "visual_direction": "Person talking",
            "voiceover": "Hey guys, in this video I basically want to talk about camera lighting.",
            "b_roll": "",
            "on_screen_text": "LIGHTING TALK",
            "audio_direction": "",
        },
        {
            "id": "seg_2",
            "section": "BODY",
            "start_time": "0:06",
            "end_time": "0:25",
            "visual_direction": "Person sitting",
            "voiceover": "Actually you know, the most important thing is contrast ratio.",
            "b_roll": "",
            "on_screen_text": "CONTRAST",
            "audio_direction": "",
        },
        {
            "id": "seg_3",
            "section": "CTA",
            "start_time": "0:25",
            "end_time": "0:30",
            "visual_direction": "Person waving",
            "voiceover": "So yeah, like and subscribe if you want more tips.",
            "b_roll": "",
            "on_screen_text": "BYE",
            "audio_direction": "",
        },
    ]

    opt_result = await provider.optimize_script(
        title="Lighting Guide",
        topic="Camera Lighting",
        platform="Instagram Reels",
        language="English",
        duration_seconds=30,
        tone="Educational",
        hook="Hey guys, in this video I basically want to talk about camera lighting.",
        segments=segments,
        cta="So yeah, like and subscribe if you want more tips.",
        goals=["improve_hook", "remove_filler", "strengthen_curiosity", "improve_cta"],
    )

    # Check title updated
    assert "Optimized" in opt_result["title"]

    # Check hook improved (fillers stripped, urgency injected)
    assert "hey guys" not in opt_result["hook"].lower()
    assert "basically" not in opt_result["hook"].lower()
    assert "stop" in opt_result["hook"].lower() or "mistake" in opt_result["hook"].lower()

    # Check filler words removed in body segment
    body_vo = opt_result["segments"][1]["voiceover"].lower()
    assert "actually" not in body_vo
    assert "you know" not in body_vo

    # Check curiosity loop injected
    assert any("secret" in s["voiceover"].lower() or "reveal" in s["voiceover"].lower() for s in opt_result["segments"])

    # Check CTA improved
    assert "like and subscribe" not in opt_result["cta"].lower()
    assert "save" in opt_result["cta"].lower()

    # Check changes_made list
    assert len(opt_result["changes_made"]) >= 3
    for change in opt_result["changes_made"]:
        assert "section" in change
        assert "field" in change
        assert "before" in change
        assert "after" in change
        assert "reason" in change


@pytest.mark.asyncio
async def test_optimizer_api_workflow(async_client: AsyncClient):
    # 1. Create a script first with known flaws (fillers, passive cta)
    create_payload = {
        "topic": "Gimbal Balance Secrets",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Casual",
        "hook": "Hey guys, in this video I basically want to show you gimbal balancing.",
        "cta": "So yeah, kind of like and subscribe if you found this helpful.",
    }
    create_res = await async_client.post("/api/v1/scripts/generate", json=create_payload)
    assert create_res.status_code == 201
    script_data = create_res.json()
    script_id = script_data["id"]
    original_hook = script_data["hook"]
    original_version = script_data["current_version"]
    assert original_version == 1

    # 2. Run optimization preview with multiple goals
    opt_payload = {
        "goals": ["improve_hook", "remove_filler", "improve_cta", "improve_pacing"],
        "instructions": "Make it punchy for tech-savvy creators.",
    }
    opt_res = await async_client.post(f"/api/v1/scripts/{script_id}/optimize", json=opt_payload)
    assert opt_res.status_code == 200
    opt_data = opt_res.json()

    assert opt_data["script_id"] == script_id
    assert opt_data["is_saved"] is False
    assert len(opt_data["changes_made"]) >= 2
    assert opt_data["optimized_script"]["hook"] != original_hook
    assert "save" in opt_data["optimized_script"]["cta"].lower()

    # Retention analysis before vs after comparison
    assert "overall_score" in opt_data["analysis_before"]
    assert "overall_score" in opt_data["analysis_after"]
    # Optimized script should score higher or equal in overall retention
    assert opt_data["analysis_after"]["overall_score"] >= opt_data["analysis_before"]["overall_score"]

    # 3. VERIFY ORIGINAL SCRIPT REMAINS UNCHANGED BEFORE EXPLICIT SAVE
    check_orig = await async_client.get(f"/api/v1/scripts/{script_id}")
    assert check_orig.status_code == 200
    current_script = check_orig.json()
    assert current_script["current_version"] == 1
    assert current_script["hook"] == original_hook

    # 4. Save optimized result as new immutable version
    save_payload = {
        "title": opt_data["optimized_script"]["title"],
        "hook": opt_data["optimized_script"]["hook"],
        "cta": opt_data["optimized_script"]["cta"],
        "segments": opt_data["optimized_script"]["segments"],
        "change_summary": "Optimized: Hook friction enhanced, fillers removed, CTA converted to save command",
    }
    save_res = await async_client.post(f"/api/v1/scripts/{script_id}/save-optimized", json=save_payload)
    assert save_res.status_code == 200
    saved_script = save_res.json()

    # Version number must increment to 2
    assert saved_script["current_version"] == 2
    assert saved_script["hook"] == opt_data["optimized_script"]["hook"]
    assert saved_script["cta"] == opt_data["optimized_script"]["cta"]

    # 5. VERIFY PREVIOUS VERSIONS REMAIN ACCESSIBLE
    versions_res = await async_client.get(f"/api/v1/scripts/{script_id}/versions")
    assert versions_res.status_code == 200
    all_versions = versions_res.json()
    assert len(all_versions) == 2

    # Version 2 (top/latest)
    assert all_versions[0]["version_number"] == 2
    assert all_versions[0]["hook"] == opt_data["optimized_script"]["hook"]
    assert "Optimized" in all_versions[0]["change_summary"]

    # Version 1 (original preserved)
    assert all_versions[1]["version_number"] == 1
    assert all_versions[1]["hook"] == original_hook


@pytest.mark.asyncio
async def test_optimizer_validation_and_errors(async_client: AsyncClient):
    # 1. Non-existent script ID returns 404
    missing_res = await async_client.post(
        "/api/v1/scripts/non-existent-script-uuid/optimize",
        json={"goals": ["improve_hook"]},
    )
    assert missing_res.status_code == 404

    # 2. Empty goals list returns 422 validation error
    invalid_res = await async_client.post(
        "/api/v1/scripts/any-id/optimize",
        json={"goals": []},
    )
    assert invalid_res.status_code == 422

    # 3. Invalid goal string returns 422 validation error
    bad_goal_res = await async_client.post(
        "/api/v1/scripts/any-id/optimize",
        json={"goals": ["completely_unsupported_goal"]},
    )
    assert bad_goal_res.status_code == 422


@pytest.mark.asyncio
async def test_optimizer_agent_fallback_on_error():
    class BrokenProvider:
        async def analyze_script_retention(self, *args, **kwargs):
            fallback = OfflineHeuristicMockProvider()
            return await fallback.analyze_script_retention(*args, **kwargs)

        async def optimize_script(self, *args, **kwargs):
            raise RuntimeError("Gemini optimizer quota exhausted")

    agent = ScriptOptimizerAgent(provider=BrokenProvider())

    class FakeScript:
        id = "fake-1"
        title = "Fake Title"
        topic = "Fake Topic"
        platform = "Instagram Reels"
        language = "English"
        duration_seconds = 30
        tone = "Casual"
        hook = "Hey guys, hook"
        cta = "Like and subscribe"
        segments = [
            {
                "id": "seg_1",
                "start_time": "0:00",
                "end_time": "0:03",
                "section": "HOOK",
                "voiceover": "Hey guys, hook",
                "visual_direction": "Visual",
                "on_screen_text": "Text",
            }
        ]
        provider_used = "gemini"
        current_version = 1
        created_at = datetime.now(timezone.utc)
        updated_at = datetime.now(timezone.utc)
        versions = []

    class FakeDB:
        def __init__(self):
            self.call_count = 0

        async def execute(self, *args, **kwargs):
            self.call_count += 1
            val = FakeScript() if self.call_count == 1 else None

            class FakeResult:
                def __init__(self, res):
                    self.res = res

                def scalar_one_or_none(self):
                    return self.res

            return FakeResult(val)

    req = ScriptOptimizationRequest(goals=["improve_hook", "remove_filler"])
    res = await agent.optimize("fake-1", req, FakeDB())

    # Fallback must succeed and return heuristic mock result
    assert res.provider_used == "heuristic_mock"
    assert "hey guys" not in res.optimized_script.hook.lower()
