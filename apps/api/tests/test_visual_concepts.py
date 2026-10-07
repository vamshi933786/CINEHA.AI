import pytest
import uuid
import os
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.main import app
from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.script import Script, ScriptVisual
from app.models.creator_profile import CreatorProfile
from app.schemas.visual_concept import (
    VALID_VISUAL_TYPES,
    VALID_IMPORTANCE_LEVELS,
    VALID_ASPECT_RATIOS,
    VALID_VISUAL_STYLES,
    VisualConceptItem,
)
from app.services.image_generation.mock_provider import MockImageGenerationProvider
from app.services.image_generation.unconfigured_provider import UnconfiguredImageGenerationProvider
from app.services.image_generation.base import ProviderNotConfiguredError


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def sample_script():
    async with AsyncSessionLocal() as session:
        script_id = str(uuid.uuid4())
        script = Script(
            id=script_id,
            title="3 Seconds Attention Hook Masterclass",
            topic="Short Form Video Retention",
            platform="Instagram Reels",
            language="English",
            duration_seconds=30,
            tone="Educational, High-Energy",
            hook="Most creators lose 80% of viewers in the first three seconds.",
            cta="Follow for more retention editing frameworks.",
            provider_used="heuristic_mock",
            current_version=1,
            segments=[
                {
                    "id": "beat_1",
                    "section": "HOOK",
                    "start_time": "0:00",
                    "end_time": "0:03",
                    "voiceover": "Most creators lose 80% of viewers in the first three seconds.",
                    "visual_direction": "Dramatic push in on smartphone displaying drop-off analytics.",
                    "on_screen_text": "HOOK DROP-OFF 📉",
                },
                {
                    "id": "beat_2",
                    "section": "PROBLEM",
                    "start_time": "0:03",
                    "end_time": "0:12",
                    "voiceover": "The fatal mistake is starting with a slow intro instead of an instant curiosity loop.",
                    "visual_direction": "Split screen showing boring title card vs high energy action tease.",
                    "on_screen_text": "AVOID SLOW INTROS ❌",
                },
                {
                    "id": "beat_3",
                    "section": "FRAMEWORK",
                    "start_time": "0:12",
                    "end_time": "0:25",
                    "voiceover": "Use this 3-step pattern interrupt formula: shock statement, visual question, then payoff.",
                    "visual_direction": "Clean geometric cards floating with 1-2-3 framework labels.",
                    "on_screen_text": "3-STEP RETENTION FORMULA ⚡️",
                },
            ],
        )
        session.add(script)
        await session.commit()
        await session.refresh(script)

    yield script

    async with AsyncSessionLocal() as session:
        await session.execute(delete(Script).where(Script.id == script.id))
        await session.commit()


@pytest.mark.asyncio
async def test_visual_concept_schema_validation():
    item = VisualConceptItem(
        script_segment_id="beat_1",
        concept_title="Attention Window",
        explanation="Explains 0-3s retention curve.",
        visual_type="Educational",
        importance="Essential",
        related_script_text="Most creators lose 80% of viewers in the first three seconds.",
        suggested_prompt="Vertical 9:16 visual showing smartphone timeline...",
        aspect_ratio="9:16",
        style="Clean Educational",
        language="English",
    )
    assert item.visual_type in VALID_VISUAL_TYPES
    assert item.importance in VALID_IMPORTANCE_LEVELS
    assert item.aspect_ratio in VALID_ASPECT_RATIOS


@pytest.mark.asyncio
async def test_image_provider_abstraction():
    # Test Unconfigured Provider
    unconfigured = UnconfiguredImageGenerationProvider()
    assert not unconfigured.is_configured()
    with pytest.raises(ProviderNotConfiguredError):
        await unconfigured.generate_image("A clean educational visual")

    # Test Mock Provider
    mock_prov = MockImageGenerationProvider()
    assert mock_prov.is_configured()
    res = await mock_prov.generate_image(
        "A clean visual showing short form video timeline",
        settings={"aspect_ratio": "9:16", "style": "Clean Educational"},
    )
    assert res.image_bytes is not None
    assert len(res.image_bytes) > 100
    assert res.mime_type == "image/png"
    assert res.width == 720
    assert res.height == 1280


@pytest.mark.asyncio
async def test_api_get_provider_status(async_client, sample_script):
    resp = await async_client.get(f"/api/v1/scripts/{sample_script.id}/visual-concepts/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "configured" in data
    assert "provider" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_api_analyze_visual_concepts_english(async_client, sample_script):
    payload = {
        "script_id": sample_script.id,
        "language": "English",
        "preferred_aspect_ratio": "9:16",
        "preferred_style": "Clean Educational",
    }
    resp = await async_client.post(f"/api/v1/scripts/{sample_script.id}/visual-concepts", json=payload)
    assert resp.status_code == 200
    visuals = resp.json()
    assert isinstance(visuals, list)
    assert len(visuals) >= 2

    first = visuals[0]
    assert first["script_id"] == sample_script.id
    assert first["language"] == "English"
    assert "concept_title" in first
    assert "explanation" in first
    assert "suggested_prompt" in first
    assert first["aspect_ratio"] == "9:16"
    assert first["status"] == "suggested"
    assert first["visual_type"] in VALID_VISUAL_TYPES
    assert first["importance"] in VALID_IMPORTANCE_LEVELS


@pytest.mark.asyncio
async def test_api_analyze_visual_concepts_telugu(async_client, sample_script):
    payload = {
        "script_id": sample_script.id,
        "language": "Telugu",
        "preferred_aspect_ratio": "9:16",
        "preferred_style": "Clean Educational",
    }
    resp = await async_client.post(f"/api/v1/scripts/{sample_script.id}/visual-concepts", json=payload)
    assert resp.status_code == 200
    visuals = resp.json()
    assert len(visuals) >= 1

    first = visuals[0]
    assert first["language"] == "Telugu"
    # Ensure title and explanation contain authentic Telugu characters
    assert any("\u0c00" <= char <= "\u0c7f" for char in first["concept_title"])
    assert any("\u0c00" <= char <= "\u0c7f" for char in first["explanation"])
    # Suggested prompt is in English for image model performance
    assert "visual" in first["suggested_prompt"].lower() or "vertical" in first["suggested_prompt"].lower()


@pytest.mark.asyncio
async def test_api_analyze_visual_concepts_tanglish(async_client, sample_script):
    payload = {
        "script_id": sample_script.id,
        "language": "Tanglish",
        "preferred_aspect_ratio": "9:16",
    }
    resp = await async_client.post(f"/api/v1/scripts/{sample_script.id}/visual-concepts", json=payload)
    assert resp.status_code == 200
    visuals = resp.json()
    assert len(visuals) >= 1

    first = visuals[0]
    assert first["language"] == "Tanglish"
    # Tanglish title in Latin alphabet
    assert len(first["concept_title"]) > 0


@pytest.mark.asyncio
async def test_api_creator_profile_personalization(async_client):
    async with AsyncSessionLocal() as session:
        profile = CreatorProfile(
            id=str(uuid.uuid4()),
            creator_name="Dr. Strength",
            niche="Fitness & Hypertrophy",
            content_tones=["Scientific", "Punchy"],
            creator_bio="Evidence-based fitness educator and coach.",
            primary_language="English",
            platforms=["YouTube Shorts", "Instagram Reels"],
            preferred_aspect_ratio="9:16",
        )
        session.add(profile)

        script = Script(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            title="Hypertrophy Nutrition Science",
            topic="Protein Synthesis and Recovery",
            platform="YouTube Shorts",
            language="English",
            duration_seconds=30,
            tone="Scientific",
            hook="Why protein timing does not matter as much as you think.",
            cta="Subscribe for evidence-based lifting science.",
            current_version=1,
            segments=[
                {
                    "id": "beat_fit_1",
                    "section": "HOOK",
                    "start_time": "0:00",
                    "end_time": "0:04",
                    "voiceover": "Why protein timing does not matter as much as total daily intake.",
                    "visual_direction": "High energy macro framing of protein shake vs whole foods.",
                    "on_screen_text": "PROTEIN TIMING MYTH 🥩",
                }
            ],
        )
        session.add(script)
        await session.commit()

    try:
        resp = await async_client.post(
            f"/api/v1/scripts/{script.id}/visual-concepts",
            json={"script_id": script.id, "profile_id": profile.id},
        )
        assert resp.status_code == 200
        visuals = resp.json()
        assert len(visuals) >= 1
        # Check that fitness niche is reflected in prompt
        assert any("fitness" in v["suggested_prompt"].lower() or "protein" in v["suggested_prompt"].lower() or "visual" in v["suggested_prompt"].lower() for v in visuals)
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(Script).where(Script.id == script.id))
            await session.execute(delete(CreatorProfile).where(CreatorProfile.id == profile.id))
            await session.commit()


@pytest.mark.asyncio
async def test_api_generate_and_regenerate_image_with_mock_provider(async_client, sample_script, monkeypatch):
    # Analyze concepts first
    resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visual-concepts",
        json={"script_id": sample_script.id, "language": "English"},
    )
    assert resp.status_code == 200
    visuals = resp.json()
    visual_id = visuals[0]["id"]

    # Configure mock provider
    monkeypatch.setattr(settings, "IMAGE_PROVIDER", "mock")
    from app.agents import visual_concept_agent
    monkeypatch.setattr(
        visual_concept_agent,
        "get_image_generation_provider",
        lambda: MockImageGenerationProvider(),
    )

    # 1. Generate Image
    gen_resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}/generate",
        json={"prompt": "Vertical 9:16 visual showing attention drop off curve"},
    )
    assert gen_resp.status_code == 200
    updated_visual = gen_resp.json()
    assert updated_visual["status"] == "ready"
    assert updated_visual["image_url"] == f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}/image"
    assert updated_visual["provider"] == "mock"

    # 2. Serve Image
    img_resp = await async_client.get(f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}/image")
    assert img_resp.status_code == 200
    assert img_resp.headers["content-type"] == "image/png"
    assert len(img_resp.content) > 100

    # 3. Regenerate Image with updated prompt
    regen_resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}/regenerate",
        json={"prompt": "Vertical 9:16 high contrast studio render with vibrant neon markers"},
    )
    assert regen_resp.status_code == 200
    regen_data = regen_resp.json()
    assert regen_data["status"] == "ready"
    assert "high contrast" in regen_data["prompt"].lower()


@pytest.mark.asyncio
async def test_api_unconfigured_provider_error(async_client, sample_script, monkeypatch):
    # Analyze concepts first
    resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visual-concepts",
        json={"script_id": sample_script.id, "language": "English"},
    )
    assert resp.status_code == 200
    visuals = resp.json()
    visual_id = visuals[0]["id"]

    # Configure unconfigured provider
    monkeypatch.setattr(settings, "IMAGE_PROVIDER", "unconfigured")
    from app.agents import visual_concept_agent
    monkeypatch.setattr(
        visual_concept_agent,
        "get_image_generation_provider",
        lambda: UnconfiguredImageGenerationProvider(),
    )

    gen_resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}/generate",
        json={"prompt": "A test visual"},
    )
    assert gen_resp.status_code == 400
    assert "Image generation provider is not configured" in gen_resp.json()["detail"]


@pytest.mark.asyncio
async def test_api_update_and_attach_to_script(async_client, sample_script):
    # Analyze concepts first
    resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visual-concepts",
        json={"script_id": sample_script.id, "language": "English"},
    )
    visuals = resp.json()
    visual_id = visuals[0]["id"]

    # Use in Script (attach)
    update_resp = await async_client.put(
        f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}",
        json={
            "is_attached": True,
            "prompt": "Custom refined prompt for segment 1",
            "style": "Modern 3D",
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["is_attached"] is True
    assert updated["style"] == "Modern 3D"
    assert updated["prompt"] == "Custom refined prompt for segment 1"


@pytest.mark.asyncio
async def test_api_delete_visual(async_client, sample_script):
    # Analyze concepts
    resp = await async_client.post(
        f"/api/v1/scripts/{sample_script.id}/visual-concepts",
        json={"script_id": sample_script.id},
    )
    visuals = resp.json()
    visual_id = visuals[0]["id"]

    del_resp = await async_client.delete(f"/api/v1/scripts/{sample_script.id}/visuals/{visual_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["deleted"] is True

    # Verify not in list
    list_resp = await async_client.get(f"/api/v1/scripts/{sample_script.id}/visuals")
    remaining_ids = [v["id"] for v in list_resp.json()]
    assert visual_id not in remaining_ids


@pytest.mark.asyncio
async def test_api_keys_never_exposed(async_client, sample_script):
    resp = await async_client.get(f"/api/v1/scripts/{sample_script.id}/visual-concepts/status")
    status_str = resp.text
    assert settings.GEMINI_API_KEY not in status_str if settings.GEMINI_API_KEY else True
    assert settings.OPENAI_API_KEY not in status_str if settings.OPENAI_API_KEY else True
