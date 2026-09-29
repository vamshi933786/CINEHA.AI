import pytest
from httpx import AsyncClient
from app.services.llm_provider import OfflineHeuristicMockProvider
from app.schemas.hook import VALID_TAXONOMIES

@pytest.mark.asyncio
async def test_offline_heuristic_provider_direct():
    provider = OfflineHeuristicMockProvider()
    hooks = await provider.generate_hooks(
        topic="Cinematic Lighting",
        niche="Cinematography",
        platform="Instagram Reels",
        language="English",
        tones=["Educational", "Cinematic"],
        goals=["Increase retention"],
        audience="Beginner creators",
        categories=["Curiosity", "Contrarian", "Problem-Solution"],
        count=3,
    )

    assert len(hooks) == 3
    categories_generated = [h.category for h in hooks]
    assert "Curiosity" in categories_generated
    assert "Contrarian" in categories_generated
    assert "Problem-Solution" in categories_generated
    for h in hooks:
        assert "Cinematic Lighting" in h.hook_text or "cinematic lighting" in h.hook_text.lower()
        assert len(h.visual_framing) > 5
        assert len(h.delivery_style) > 5
        assert len(h.retention_intent) > 5

@pytest.mark.asyncio
async def test_generate_hooks_api_success(async_client: AsyncClient):
    payload = {
        "topic": "Gimbal Ninja Walk",
        "context": "Using mobile gimbal",
        "platform": "Instagram Reels",
        "language": "Tanglish",
        "count": 5,
        "categories": ["Curiosity", "Bold Statement", "List / Number"],
    }

    response = await async_client.post("/api/v1/hooks/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 5
    assert len(data["hooks"]) == 5
    assert data["provider_used"] in ["heuristic_mock", "gemini_pro"]

    # Verify category and delivery fields
    first_hook = data["hooks"][0]
    assert first_hook["category"] in ["Curiosity", "Bold Statement", "List / Number"]
    assert first_hook["platform"] == "Instagram Reels"
    assert first_hook["language"] == "Tanglish"

@pytest.mark.asyncio
async def test_generate_hooks_with_creator_profile(async_client: AsyncClient):
    payload = {
        "topic": "Color Grading",
        "platform": "YouTube Shorts",
        "language": "Telugu",
        "count": 3,
        "creator_profile": {
            "creator_name": "Sai Panga",
            "niche": "Mobile Filmmaking",
            "target_audience": "Creators",
            "platforms": ["YouTube Shorts"],
            "primary_language": "Telugu",
            "content_tones": ["Cinematic"],
            "content_goals": ["Increase retention"],
        },
    }

    response = await async_client.post("/api/v1/hooks/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["persona_used"] == "Sai Panga"
    assert len(data["hooks"]) == 3

@pytest.mark.asyncio
async def test_generate_hooks_with_persisted_creator_profile(async_client: AsyncClient):
    # Regression test: verifies that passing a creator_profile containing DB metadata
    # (id, created_at, updated_at as returned by GET /profile) succeeds without
    # triggering an "Extra inputs are not permitted" 422 error.
    payload = {
        "topic": "Cinematic Lighting Setup",
        "platform": "Instagram Reels",
        "language": "English",
        "count": 3,
        "creator_profile": {
            "id": "c7a8b9d0-1234-5678-9abc-def012345678",
            "created_at": "2026-09-28T12:00:00Z",
            "updated_at": "2026-09-28T12:00:00Z",
            "creator_name": "Sai Panga",
            "niche": "Mobile Filmmaking",
            "target_audience": "Creators",
            "platforms": ["Instagram Reels"],
            "primary_language": "English",
            "content_tones": ["Cinematic", "Educational"],
            "creator_bio": "Filmmaker sharing mobile cinematography tips",
            "content_goals": ["Increase retention", "Grow followers"],
        },
    }

    response = await async_client.post("/api/v1/hooks/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["persona_used"] == "Sai Panga"
    assert len(data["hooks"]) == 3

@pytest.mark.asyncio
async def test_hook_validation_failures(async_client: AsyncClient):
    # 1. Empty topic
    res1 = await async_client.post(
        "/api/v1/hooks/generate",
        json={"topic": " ", "platform": "Instagram Reels", "language": "English"},
    )
    assert res1.status_code == 422

    # 2. Invalid platform
    res2 = await async_client.post(
        "/api/v1/hooks/generate",
        json={"topic": "Lighting", "platform": "Twitter", "language": "English"},
    )
    assert res2.status_code == 422

    # 3. Invalid language
    res3 = await async_client.post(
        "/api/v1/hooks/generate",
        json={"topic": "Lighting", "platform": "Instagram Reels", "language": "Klingon"},
    )
    assert res3.status_code == 422

    # 4. Invalid taxonomy category
    res4 = await async_client.post(
        "/api/v1/hooks/generate",
        json={
            "topic": "Lighting",
            "platform": "Instagram Reels",
            "language": "English",
            "categories": ["FakeCategory123"],
        },
    )
    assert res4.status_code == 422

    # 5. Invalid count (out of 1-20 bounds)
    res5 = await async_client.post(
        "/api/v1/hooks/generate",
        json={"topic": "Lighting", "platform": "Instagram Reels", "count": 50},
    )
    assert res5.status_code == 422

    # 6. Unknown field rejection
    res6 = await async_client.post(
        "/api/v1/hooks/generate",
        json={
            "topic": "Lighting",
            "platform": "Instagram Reels",
            "malicious_field": "injected",
        },
    )
    assert res6.status_code == 422

    # 7. Unknown field rejection inside creator_profile
    res7 = await async_client.post(
        "/api/v1/hooks/generate",
        json={
            "topic": "Lighting",
            "platform": "Instagram Reels",
            "creator_profile": {
                "creator_name": "Sai Panga",
                "niche": "Mobile Filmmaking",
                "platforms": ["Instagram Reels"],
                "primary_language": "English",
                "content_tones": ["Cinematic"],
                "content_goals": ["Increase retention"],
                "unauthorized_field": "injected_value",
            },
        },
    )
    assert res7.status_code == 422
    assert "Extra inputs are not permitted" in res7.text
