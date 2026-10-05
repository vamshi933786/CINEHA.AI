from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from app.agents.retention_analyzer_agent import RetentionAnalyzerAgent
from app.agents.script_optimizer_agent import ScriptOptimizerAgent
from app.schemas.analyzer import ScriptAnalysisRequest
from app.schemas.optimizer import ScriptOptimizationRequest, SaveOptimizedScriptRequest


@pytest.mark.asyncio
async def test_analyzer_result_feeds_optimizer_context(async_client: AsyncClient):
    """
    Verifies that the Retention Analyzer evaluates a script, detects weak points,
    and these findings can directly feed target goals into the Script Optimizer.
    """
    # 1. Create a script with deliberate retention hazards (filler words, weak hook, sluggish pacing)
    create_payload = {
        "topic": "Microphone Selection for Beginners",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Casual",
        "hook": "Hey guys, in this video I basically want to talk about microphones.",
        "cta": "So yeah, kind of like and subscribe if you enjoyed this.",
    }
    create_res = await async_client.post("/api/v1/scripts/generate", json=create_payload)
    assert create_res.status_code == 201
    script_data = create_res.json()
    script_id = script_data["id"]

    # 2. Run Retention Analysis
    analysis_res = await async_client.get(f"/api/v1/analyzer/script/{script_id}")
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()

    assert analysis["overall_score"] > 0
    assert "weak_points" in analysis

    # 3. Feed detected weak areas into optimizer goals
    detected_goals = []
    if analysis["hook_clarity"]["score"] < 80 or any("hook" in w.lower() for w in analysis["weak_points"]):
        detected_goals.append("improve_hook")
    if analysis["filler_repetition"]["score"] < 80 or (analysis["metrics"]["detected_filler_words"]):
        detected_goals.append("remove_filler")
    if analysis["cta_strength"]["score"] < 80 or any("cta" in w.lower() for w in analysis["weak_points"]):
        detected_goals.append("improve_cta")

    if not detected_goals:
        detected_goals = ["general_retention"]

    # 4. Request optimization using the analyzer-diagnosed goals
    opt_payload = {
        "goals": detected_goals,
        "instructions": "Direct address, remove conversational filler, boost hook tension.",
    }
    opt_res = await async_client.post(f"/api/v1/scripts/{script_id}/optimize", json=opt_payload)
    assert opt_res.status_code == 200
    opt_data = opt_res.json()

    assert opt_data["is_saved"] is False
    assert abs(opt_data["analysis_before"]["overall_score"] - analysis["overall_score"]) <= 5
    assert opt_data["analysis_after"]["overall_score"] >= opt_data["analysis_before"]["overall_score"]


@pytest.mark.asyncio
async def test_custom_unsaved_script_optimization_workflow(async_client: AsyncClient):
    """
    Verifies that unsaved screenplay text (e.g. from Unified Input) can be optimized
    directly without requiring silent prior persistence in the database.
    """
    raw_script = (
        "Hey guys, in this video I basically want to show you camera settings.\n\n"
        "Actually, you know, shooting in 60fps makes everything look video-like.\n\n"
        "So yeah, kind of like and subscribe for more tips."
    )

    opt_payload = {
        "script_text": raw_script,
        "title": "Camera Settings Screenplay",
        "language": "English",
        "duration_seconds": 30,
        "goals": ["improve_hook", "remove_filler", "improve_cta"],
        "instructions": "Cinematic feel",
    }

    # Call custom optimization endpoint
    res = await async_client.post("/api/v1/scripts/optimize-custom", json=opt_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["script_id"] == "custom"
    assert data["is_saved"] is False
    assert "Optimized" in data["optimized_script"]["title"]
    assert "save" in data["optimized_script"]["cta"].lower()

    # Before and after analysis should both be populated
    assert data["analysis_before"]["overall_score"] > 0
    assert data["analysis_after"]["overall_score"] > 0
    assert len(data["changes_made"]) >= 2


@pytest.mark.asyncio
async def test_optimizer_preview_does_not_mutate_original_script(async_client: AsyncClient):
    """
    Verifies that generating an optimizer preview does NOT mutate the original script
    or create a new version until explicitly approved and saved by the creator.
    """
    create_res = await async_client.post("/api/v1/scripts/generate", json={
        "topic": "Color Grading Node Tree",
        "platform": "YouTube Shorts",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Technical",
        "hook": "Stop color grading with LUTs.",
        "cta": "Save this node setup.",
    })
    script_data = create_res.json()
    script_id = script_data["id"]
    original_hook = script_data["hook"]
    original_version = script_data["current_version"]

    # Preview optimization
    opt_res = await async_client.post(f"/api/v1/scripts/{script_id}/optimize", json={
        "goals": ["improve_hook", "improve_pacing"],
    })
    assert opt_res.status_code == 200

    # Verify original script is completely unmodified in database
    get_res = await async_client.get(f"/api/v1/scripts/{script_id}")
    assert get_res.status_code == 200
    current_script = get_res.json()
    assert current_script["hook"] == original_hook
    assert current_script["current_version"] == original_version

    # Check version history only has Version 1
    versions_res = await async_client.get(f"/api/v1/scripts/{script_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1


@pytest.mark.asyncio
async def test_explicit_save_creates_new_immutable_version(async_client: AsyncClient):
    """
    Verifies that explicit save creates Version 2 immutably, preserving Version 1.
    """
    create_res = await async_client.post("/api/v1/scripts/generate", json={
        "topic": "Shutter Speed Rules",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Cinematic",
        "hook": "Hey guys, in this video let's talk about shutter speed.",
        "cta": "Like and subscribe.",
    })
    script = create_res.json()
    script_id = script["id"]

    # Run optimization
    opt_res = await async_client.post(f"/api/v1/scripts/{script_id}/optimize", json={
        "goals": ["improve_hook", "remove_filler", "improve_cta"],
    })
    opt_data = opt_res.json()

    # Explicitly save
    save_payload = {
        "title": opt_data["optimized_script"]["title"],
        "hook": opt_data["optimized_script"]["hook"],
        "cta": opt_data["optimized_script"]["cta"],
        "segments": opt_data["optimized_script"]["segments"],
        "change_summary": "Optimized hook tension and CTA punch",
    }
    save_res = await async_client.post(f"/api/v1/scripts/{script_id}/save-optimized", json=save_payload)
    assert save_res.status_code == 200
    saved_script = save_res.json()
    assert saved_script["current_version"] == 2

    # Check immutable version history has both v1 and v2
    versions_res = await async_client.get(f"/api/v1/scripts/{script_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 2
    version_numbers = {v["version_number"] for v in versions}
    assert version_numbers == {1, 2}
    assert versions[0]["hook"] != versions[1]["hook"]


@pytest.mark.asyncio
async def test_optimizer_missing_or_invalid_script(async_client: AsyncClient):
    """
    Verifies that attempting to optimize a non-existent script returns HTTP 404.
    """
    res = await async_client.post("/api/v1/scripts/00000000-0000-0000-0000-000000000000/optimize", json={
        "goals": ["improve_hook"],
    })
    assert res.status_code == 404
