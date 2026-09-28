import pytest
from httpx import AsyncClient
from app.core.config import settings

@pytest.mark.asyncio
async def test_configuration_guardrails():
    assert settings.MAX_VIDEO_SIZE_MB == 100
    assert "http://localhost:3000" in settings.cors_origins
    assert settings.PORT == 8000
    assert settings.DATABASE_URL.startswith("sqlite")

@pytest.mark.asyncio
async def test_cors_preflight(async_client: AsyncClient):
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = await async_client.options("/api/v1/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

@pytest.mark.asyncio
async def test_not_found_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/non_existent_route")
    assert response.status_code == 404
