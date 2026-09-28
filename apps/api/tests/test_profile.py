import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_empty_profile(async_client: AsyncClient):
    response = await async_client.get("/api/v1/profile")
    assert response.status_code == 200
    data = response.json()
    assert "is_configured" in data
    # In a clean DB, profile is None
    if not data["is_configured"]:
        assert data["profile"] is None

@pytest.mark.asyncio
async def test_create_and_get_profile(async_client: AsyncClient):
    payload = {
        "creator_name": "Sai Panga",
        "niche": "Cinematography",
        "target_audience": "Beginner mobile filmmakers and creators.",
        "platforms": ["Instagram Reels", "YouTube Shorts"],
        "primary_language": "Tanglish",
        "content_tones": ["Educational", "Cinematic", "Conversational"],
        "creator_bio": "Filmmaker sharing camera angles and lighting breakdowns.",
        "content_goals": ["Increase retention", "Build personal brand"],
    }

    # Save profile via PUT
    put_response = await async_client.put("/api/v1/profile", json=payload)
    assert put_response.status_code == 200
    put_data = put_response.json()
    assert put_data["is_configured"] is True
    assert put_data["profile"]["creator_name"] == "Sai Panga"
    assert put_data["profile"]["niche"] == "Cinematography"
    assert put_data["profile"]["primary_language"] == "Tanglish"
    assert "Instagram Reels" in put_data["profile"]["platforms"]
    assert "Cinematic" in put_data["profile"]["content_tones"]
    assert "id" in put_data["profile"]

    # Verify retrieval via GET
    get_response = await async_client.get("/api/v1/profile")
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert get_data["is_configured"] is True
    assert get_data["profile"]["creator_name"] == "Sai Panga"
    assert get_data["profile"]["id"] == put_data["profile"]["id"]

@pytest.mark.asyncio
async def test_update_existing_profile(async_client: AsyncClient):
    update_payload = {
        "creator_name": "Sai Panga Updated",
        "niche": "Mobile Filmmaking",
        "target_audience": "Advanced mobile creators.",
        "platforms": ["Instagram Reels", "TikTok"],
        "primary_language": "Telugu",
        "content_tones": ["Cinematic", "Storytelling"],
        "creator_bio": "Updated creator bio.",
        "content_goals": ["Grow followers", "Increase engagement"],
    }

    put_response = await async_client.put("/api/v1/profile", json=update_payload)
    assert put_response.status_code == 200
    put_data = put_response.json()
    assert put_data["profile"]["creator_name"] == "Sai Panga Updated"
    assert put_data["profile"]["niche"] == "Mobile Filmmaking"
    assert put_data["profile"]["primary_language"] == "Telugu"

@pytest.mark.asyncio
async def test_profile_validation_failures(async_client: AsyncClient):
    # Empty creator name
    res1 = await async_client.put(
        "/api/v1/profile",
        json={
            "creator_name": "   ",
            "niche": "Tech",
            "platforms": ["Instagram Reels"],
            "primary_language": "English",
            "content_tones": ["Educational"],
            "content_goals": ["Grow followers"],
        },
    )
    assert res1.status_code == 422

    # Empty platforms list
    res2 = await async_client.put(
        "/api/v1/profile",
        json={
            "creator_name": "Sai",
            "niche": "Tech",
            "platforms": [],
            "primary_language": "English",
            "content_tones": ["Educational"],
            "content_goals": ["Grow followers"],
        },
    )
    assert res2.status_code == 422

    # Extra/unknown field rejection
    res3 = await async_client.put(
        "/api/v1/profile",
        json={
            "creator_name": "Sai",
            "niche": "Tech",
            "platforms": ["Instagram Reels"],
            "primary_language": "English",
            "content_tones": ["Educational"],
            "content_goals": ["Grow followers"],
            "malicious_unknown_field": "hack",
        },
    )
    assert res3.status_code == 422
