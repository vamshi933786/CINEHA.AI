import pytest
from httpx import AsyncClient
from app.services.llm_provider import OfflineHeuristicMockProvider
from app.agents.script_agent import ScriptAgent
from app.schemas.script import ScriptGenerationRequest, ScriptUpdateRequest


@pytest.mark.asyncio
async def test_offline_heuristic_script_generation_direct():
    provider = OfflineHeuristicMockProvider()

    # Test 30s English
    result_30s = await provider.generate_script(
        topic="Bedside Lamp Lighting",
        platform="Instagram Reels",
        language="English",
        duration_seconds=30,
        tone="Cinematic",
        hook="Stop buying expensive lights!",
        cta="Follow for more mobile filmmaking tips.",
        creator_name="Sai Panga",
        niche="Mobile Filmmaking",
        audience="Beginner filmmakers",
        context="Shot using an iPhone 15 Pro",
    )

    assert result_30s["title"] is not None
    assert result_30s["hook"] == "Stop buying expensive lights!"
    assert result_30s["cta"] == "Follow for more mobile filmmaking tips."
    assert len(result_30s["segments"]) == 4
    # First segment must use the provided hook
    assert result_30s["segments"][0]["voiceover"] == "Stop buying expensive lights!"
    assert result_30s["segments"][0]["section"] == "HOOK"
    # Last segment must use the provided cta
    assert result_30s["segments"][-1]["voiceover"] == "Follow for more mobile filmmaking tips."
    assert result_30s["segments"][-1]["section"] == "CTA"

    # Test 15s Telugu
    result_15s = await provider.generate_script(
        topic="షట్టర్ స్పీడ్ రూల్",
        platform="TikTok",
        language="Telugu",
        duration_seconds=15,
        tone="Educational",
    )
    assert len(result_15s["segments"]) == 4
    assert result_15s["segments"][0]["start_time"] == "0:00"
    assert result_15s["segments"][-1]["end_time"] == "0:15"

    # Test 60s Tanglish
    result_60s = await provider.generate_script(
        topic="Gimbal Walk",
        platform="YouTube Shorts",
        language="Tanglish",
        duration_seconds=60,
        tone="High-Energy",
    )
    assert len(result_60s["segments"]) == 5
    assert result_60s["segments"][-1]["end_time"] == "1:00"

    # Test 90s English
    result_90s = await provider.generate_script(
        topic="3-Point Lighting",
        platform="YouTube Shorts",
        language="English",
        duration_seconds=90,
        tone="Professional",
    )
    assert len(result_90s["segments"]) == 6
    assert result_90s["segments"][-1]["end_time"] == "1:30"


@pytest.mark.asyncio
async def test_script_agent_fallback_on_error():
    class BrokenProvider:
        async def generate_script(self, *args, **kwargs):
            raise RuntimeError("Simulated API failure")

    agent = ScriptAgent(provider=BrokenProvider())
    req = ScriptGenerationRequest(
        topic="Color Grading",
        platform="Instagram Reels",
        language="English",
        duration_seconds=30,
    )
    # Must not throw, but fall back to heuristic mock
    result = await agent.generate(req)
    assert result["provider_used"] == "heuristic_mock"
    assert len(result["segments"]) == 4


@pytest.mark.asyncio
async def test_generate_script_api_success(async_client: AsyncClient):
    payload = {
        "topic": "Natural Light Cinematography",
        "context": "Using window light during golden hour",
        "platform": "Instagram Reels",
        "language": "English",
        "duration_seconds": 30,
        "tone": "Cinematic",
        "hook": "This one window can replace a ₹50,000 studio light.",
        "cta": "Save this for your next video shoot!",
    }

    response = await async_client.post("/api/v1/scripts/generate", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["topic"] == "Natural Light Cinematography"
    assert data["platform"] == "Instagram Reels"
    assert data["language"] == "English"
    assert data["duration_seconds"] == 30
    assert data["current_version"] == 1
    assert data["hook"] == "This one window can replace a ₹50,000 studio light."
    assert data["cta"] == "Save this for your next video shoot!"
    assert len(data["segments"]) == 4

    script_id = data["id"]

    # Verify script retrieval by ID
    get_res = await async_client.get(f"/api/v1/scripts/{script_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == script_id
    assert retrieved["current_version"] == 1

    # Verify version history has Version 1
    v_res = await async_client.get(f"/api/v1/scripts/{script_id}/versions")
    assert v_res.status_code == 200
    versions = v_res.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1
    assert versions[0]["change_summary"] == "Initial generation"


@pytest.mark.asyncio
async def test_script_update_and_versioning(async_client: AsyncClient):
    # 1. Create initial script
    create_payload = {
        "topic": "Audio Secrets",
        "platform": "TikTok",
        "language": "Tanglish",
        "duration_seconds": 15,
    }
    create_res = await async_client.post("/api/v1/scripts/generate", json=create_payload)
    assert create_res.status_code == 201
    script_data = create_res.json()
    script_id = script_data["id"]
    assert script_data["current_version"] == 1

    # 2. Update script to create Version 2
    update_payload = {
        "title": "Updated Audio Secrets for Creators",
        "hook": "New refined opening hook line",
        "cta": "Follow for part 2!",
        "change_summary": "Polished voiceover and CTA",
    }
    update_res = await async_client.put(f"/api/v1/scripts/{script_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["current_version"] == 2
    assert updated_data["title"] == "Updated Audio Secrets for Creators"
    assert updated_data["hook"] == "New refined opening hook line"
    assert updated_data["cta"] == "Follow for part 2!"

    # 3. Verify version history now lists both V2 and V1
    v_res = await async_client.get(f"/api/v1/scripts/{script_id}/versions")
    assert v_res.status_code == 200
    versions = v_res.json()
    assert len(versions) == 2
    assert versions[0]["version_number"] == 2
    assert versions[0]["change_summary"] == "Polished voiceover and CTA"
    assert versions[1]["version_number"] == 1


@pytest.mark.asyncio
async def test_list_scripts(async_client: AsyncClient):
    response = await async_client.get("/api/v1/scripts")
    assert response.status_code == 200
    scripts = response.json()
    assert isinstance(scripts, list)
    assert len(scripts) >= 1


@pytest.mark.asyncio
async def test_script_validation_failures(async_client: AsyncClient):
    # 1. Empty topic
    res1 = await async_client.post(
        "/api/v1/scripts/generate",
        json={"topic": "   ", "platform": "Instagram Reels", "language": "English"},
    )
    assert res1.status_code == 422

    # 2. Invalid platform
    res2 = await async_client.post(
        "/api/v1/scripts/generate",
        json={"topic": "Lighting", "platform": "LinkedIn", "language": "English"},
    )
    assert res2.status_code == 422

    # 3. Invalid language
    res3 = await async_client.post(
        "/api/v1/scripts/generate",
        json={"topic": "Lighting", "platform": "Instagram Reels", "language": "French"},
    )
    assert res3.status_code == 422

    # 4. Invalid duration
    res4 = await async_client.post(
        "/api/v1/scripts/generate",
        json={"topic": "Lighting", "platform": "Instagram Reels", "duration_seconds": 120},
    )
    assert res4.status_code == 422

    # 5. Unknown fields rejected
    res5 = await async_client.post(
        "/api/v1/scripts/generate",
        json={"topic": "Lighting", "platform": "Instagram Reels", "unexpected_param": "bad"},
    )
    assert res5.status_code == 422


@pytest.mark.asyncio
async def test_script_not_found(async_client: AsyncClient):
    res = await async_client.get("/api/v1/scripts/nonexistent-id-12345")
    assert res.status_code == 404

    res_put = await async_client.put(
        "/api/v1/scripts/nonexistent-id-12345",
        json={"title": "Doesn't matter"},
    )
    assert res_put.status_code == 404

    res_ver = await async_client.get("/api/v1/scripts/nonexistent-id-12345/versions")
    assert res_ver.status_code == 404
