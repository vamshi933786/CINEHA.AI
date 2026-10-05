import pytest
from httpx import AsyncClient
from app.core.config import settings

@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["docs"] == "/docs"

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["max_video_size_mb"] == 100
    assert data["active_provider"] == settings.AI_PROVIDER
    assert "gemini_configured" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_health_providers_diagnostic(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health/providers")
    assert response.status_code == 200
    data = response.json()
    assert data["active_provider"] == settings.AI_PROVIDER
    assert "gemini" in data
    assert data["gemini"]["provider_class"] == "GeminiLLMProvider"
    assert "local_whisper" in data
    assert "available" in data["local_whisper"]
    assert "caption_transcription" in data
    # Ensure sensitive credentials are never leaked
    raw_text = response.text
    assert "key=" not in raw_text.lower()
    assert "bearer" not in raw_text.lower()
