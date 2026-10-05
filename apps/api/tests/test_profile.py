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


@pytest.mark.asyncio
async def test_extended_creator_persona_engine_fields(async_client: AsyncClient):
    payload = {
        "creator_name": "Sai Panga",
        "display_name": "Cineha Shoots",
        "creator_type": "Filmmaker",
        "location": "Hyderabad",
        "niche": "Cinematography",
        "secondary_niches": ["Mobile Filmmaking", "Lighting Techniques", "Color Grading"],
        "content_pillars": ["Lighting Breakdowns", "Camera Angles", "Visual Rhythm"],
        "topics_to_avoid": ["Gear Drama", "Vague Motivation"],
        "target_audience": "Beginner and aspiring mobile filmmakers.",
        "target_audience_age": "18–24",
        "audience_interests": ["Lighting setups", "Short-form retention"],
        "audience_pain_points": ["Flat mobile lighting", "Shaky footage"],
        "audience_sophistication": "Intermediate",
        "content_tones": ["Cinematic", "Educational"],
        "energy": "Balanced",
        "humor": "Light",
        "storytelling_style": "Example-driven",
        "vocabulary": "Balanced",
        "custom_tone_notes": "Brisk pacing, visual rationale first.",
        "primary_language": "Tanglish",
        "secondary_languages": ["English", "Telugu"],
        "script_preference": "Tanglish / Romanized Telugu",
        "platforms": ["Instagram Reels", "YouTube Shorts"],
        "preferred_aspect_ratio": "9:16",
        "typical_duration": "45 sec",
        "cta_style": "Save",
        "secondary_cta_styles": ["Follow", "Comment"],
        "content_goals": ["Increase retention", "Build personal brand"],
        "brand_positioning": "Practical cinematography mentor for social video.",
        "core_message": "Vision and deliberate lighting matter far more than expensive gear.",
        "words_to_use": ["Cinematic", "Lighting ratio", "Visual depth"],
        "words_to_avoid": ["Smash like", "Secret algorithm hack"],
        "style_rules": ["Show visual proof in first 3s", "Explain practical setups"],
        "liked_examples": ["Side-by-side lighting comparison"],
        "disliked_examples": ["30s intro without payoff"],
    }

    put_res = await async_client.put("/api/v1/profile", json=payload)
    assert put_res.status_code == 200
    data = put_res.json()
    prof = data["profile"]

    assert prof["creator_name"] == "Sai Panga"
    assert prof["display_name"] == "Cineha Shoots"
    assert prof["creator_type"] == "Filmmaker"
    assert prof["location"] == "Hyderabad"
    assert "Mobile Filmmaking" in prof["secondary_niches"]
    assert "Lighting Breakdowns" in prof["content_pillars"]
    assert "Gear Drama" in prof["topics_to_avoid"]
    assert prof["target_audience_age"] == "18–24"
    assert prof["energy"] == "Balanced"
    assert prof["storytelling_style"] == "Example-driven"
    assert prof["cta_style"] == "Save"
    assert "Cinematic" in prof["words_to_use"]
    assert "Smash like" in prof["words_to_avoid"]
    assert "completeness" in prof
    assert prof["completeness"]["score"] == 100


@pytest.mark.asyncio
async def test_list_cleaning_and_deduplication(async_client: AsyncClient):
    payload = {
        "creator_name": "Dedup Test",
        "niche": "Tech",
        "platforms": ["  Instagram Reels  ", "YouTube Shorts", "instagram reels"],  # duplicates & whitespace
        "primary_language": "English",
        "content_tones": ["Bold", "  bold  ", "Direct"],
        "content_goals": ["Growth"],
        "secondary_niches": ["AI", "ai", "  AI  ", "Robotics"],
        "words_to_use": ["Key", "key", "KEY", "Action"],
    }

    put_res = await async_client.put("/api/v1/profile", json=payload)
    assert put_res.status_code == 200
    prof = put_res.json()["profile"]

    # Platforms deduplicated case-insensitively
    assert len(prof["platforms"]) == 2
    assert "Instagram Reels" in prof["platforms"]
    assert "YouTube Shorts" in prof["platforms"]

    # Tones deduplicated
    assert len(prof["content_tones"]) == 2

    # Secondary niches deduplicated
    assert len(prof["secondary_niches"]) == 2
    assert "AI" in prof["secondary_niches"]
    assert "Robotics" in prof["secondary_niches"]

    # Words to use deduplicated
    assert len(prof["words_to_use"]) == 2


@pytest.mark.asyncio
async def test_persona_context_endpoint(async_client: AsyncClient):
    # Ensure profile exists
    await async_client.put(
        "/api/v1/profile",
        json={
            "creator_name": "Persona Test",
            "creator_type": "Educator",
            "niche": "Storytelling",
            "platforms": ["TikTok"],
            "primary_language": "English",
            "content_tones": ["Inspirational"],
            "content_goals": ["Educate creators"],
            "cta_style": "Follow",
        },
    )

    get_res = await async_client.get("/api/v1/profile/persona")
    assert get_res.status_code == 200
    context = get_res.json()

    assert context["creator_name"] == "Persona Test"
    assert context["creator_type"] == "Educator"
    assert context["primary_niche"] == "Storytelling"
    assert context["cta_style"] == "Follow"
    assert "primary_language" in context


@pytest.mark.asyncio
async def test_persona_summary_generation_endpoint(async_client: AsyncClient):
    post_res = await async_client.post(
        "/api/v1/profile/generate-summary",
        json={
            "creator_name": "Sai Panga",
            "creator_type": "Filmmaker",
            "niche": "Mobile Cinematography",
            "target_audience": "Beginner smartphone filmmakers",
            "platforms": ["Instagram Reels"],
            "primary_language": "Telugu",
            "content_tones": ["Cinematic"],
            "content_goals": ["Retention"],
            "cta_style": "Save",
        },
    )
    assert post_res.status_code == 200
    data = post_res.json()

    assert "summary" in data
    assert len(data["summary"]) > 10
    assert "example_hook" in data
    assert "example_intro" in data
    assert "example_cta" in data
    assert "is_ai_generated" in data


@pytest.mark.asyncio
async def test_backward_compatibility_with_legacy_payload(async_client: AsyncClient):
    # Exact legacy schema payload from earlier phases
    legacy_payload = {
        "creator_name": "Legacy Creator",
        "niche": "Photography",
        "target_audience": "Amateur photographers",
        "platforms": ["Instagram Reels", "YouTube Shorts"],
        "primary_language": "English",
        "content_tones": ["Educational", "Casual"],
        "creator_bio": "Just sharing photo tips.",
        "content_goals": ["Build audience"],
    }

    put_res = await async_client.put("/api/v1/profile", json=legacy_payload)
    assert put_res.status_code == 200
    prof = put_res.json()["profile"]

    assert prof["creator_name"] == "Legacy Creator"
    assert prof["niche"] == "Photography"
    # Sensible defaults are assigned for new fields
    assert prof["creator_type"] == "Filmmaker"
    assert prof["secondary_niches"] == []
    assert prof["content_pillars"] == []
    assert prof["completeness"]["score"] > 0
    assert len(prof["completeness"]["recommendations"]) > 0

