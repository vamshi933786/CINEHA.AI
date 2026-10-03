import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, Response, Request
from app.core.config import settings
from app.services.llm_provider import (
    GeminiLLMProvider,
    OfflineHeuristicMockProvider,
    get_llm_provider,
)
from app.agents.hook_agent import HookAgent
from app.agents.script_agent import ScriptAgent
from app.agents.retention_analyzer_agent import RetentionAnalyzerAgent
from app.agents.script_optimizer_agent import ScriptOptimizerAgent
from app.schemas.hook import HookGenerationRequest
from app.schemas.script import ScriptGenerationRequest
from app.schemas.optimizer import ScriptOptimizationRequest
from app.schemas.analyzer import ScriptAnalysisRequest


@pytest.mark.asyncio
async def test_gemini_key_detection():
    """Verify Gemini API key is properly loaded and detectable from settings."""
    # Never print or assert the secret value itself
    assert hasattr(settings, "GEMINI_API_KEY")
    assert isinstance(settings.GEMINI_API_KEY, str)
    assert settings.AI_PROVIDER == "gemini"
    assert settings.GEMINI_MODEL == "gemini-3.5-flash-lite"


@pytest.mark.asyncio
async def test_get_llm_provider_selection():
    """Verify get_llm_provider returns GeminiLLMProvider when configured, and falls back when key is missing."""
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        with patch.object(settings, "GEMINI_API_KEY", "dummy_test_key"):
            provider = get_llm_provider()
            assert isinstance(provider, GeminiLLMProvider)
            assert provider.model == "gemini-3.5-flash-lite"

    # Missing key fallback
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        with patch.object(settings, "GEMINI_API_KEY", ""):
            provider = get_llm_provider()
            assert isinstance(provider, OfflineHeuristicMockProvider)

    # Heuristic mock provider override
    with patch.object(settings, "AI_PROVIDER", "heuristic_mock"):
        provider = get_llm_provider()
        assert isinstance(provider, OfflineHeuristicMockProvider)


@pytest.mark.asyncio
async def test_gemini_provider_fallback_when_api_fails():
    """Verify that GeminiLLMProvider falls back gracefully to OfflineHeuristicMockProvider on API errors."""
    import httpx
    provider = GeminiLLMProvider(api_key="invalid_or_broken_key", model="gemini-3.5-flash-lite")

    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Simulated network outage")):
        # 1. Fallback for generate_hooks
        hooks = await provider.generate_hooks(
            topic="Cinematic Drone Shots",
            niche="Filmmaking",
            platform="Instagram Reels",
            language="English",
            tones=["Cinematic"],
            goals=["Reach"],
            audience="Creators",
            categories=["Curiosity"],
            count=2,
        )
        assert len(hooks) == 2
        assert any("drone" in h.hook_text.lower() or "cinematic" in h.hook_text.lower() for h in hooks)

        # 2. Fallback for generate_script
        script = await provider.generate_script(
            topic="Lighting Setup",
            platform="Instagram Reels",
            language="English",
            duration_seconds=30,
            tone="Educational",
            hook="Stop using direct flash!",
            cta="Follow for more tips",
        )
        assert script["title"] is not None
        assert len(script["segments"]) >= 4
        assert script["provider_used"] == "heuristic_mock"

        # 3. Fallback for analyze_script_retention
        analysis = await provider.analyze_script_retention(
            title="Lighting Setup",
            topic="Lighting Setup",
            platform="Instagram Reels",
            language="English",
            duration_seconds=30,
            hook="Stop using direct flash!",
            segments=script["segments"],
            cta="Follow for more tips",
        )
        assert analysis["overall_score"] > 0
        assert analysis["provider_used"] == "heuristic_mock"

        # 4. Fallback for optimize_script
        optimized = await provider.optimize_script(
            title="Lighting Setup",
            topic="Lighting Setup",
            platform="Instagram Reels",
            language="English",
            duration_seconds=30,
            tone="Educational",
            hook="Stop using direct flash!",
            segments=script["segments"],
            cta="Follow for more tips",
            goals=["Increase retention"],
        )
        assert optimized["title"] is not None
        assert len(optimized["segments"]) >= 4
        assert optimized["provider_used"] == "heuristic_mock"


@pytest.mark.asyncio
async def test_gemini_provider_mocked_success():
    """Verify that GeminiLLMProvider correctly parses and returns structured responses when API succeeds."""
    provider = GeminiLLMProvider(api_key="valid_key", model="gemini-3.5-flash-lite")

    mock_gemini_hook_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '[{"hook_text": "The 1 lens you need for cinematic videos.", '
                                '"category": "Pattern Interrupt", "delivery_style": "High Energy", '
                                '"visual_framing": "Close-up", "retention_intent": "Stop scroll"}]'
                            )
                        }
                    ]
                }
            }
        ]
    }

    dummy_request = Request("POST", "https://generativelanguage.googleapis.com")
    success_response = Response(status_code=200, json=mock_gemini_hook_response, request=dummy_request)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = success_response
        hooks = await provider.generate_hooks(
            topic="Lens selection",
            niche="Filmmaking",
            platform="Instagram Reels",
            language="English",
            tones=["High Energy"],
            goals=["Viral"],
            audience="Creators",
            categories=["Pattern Interrupt"],
            count=1,
        )
        assert len(hooks) == 1
        assert hooks[0].hook_text == "The 1 lens you need for cinematic videos."
        assert hooks[0].category == "Pattern Interrupt"


@pytest.mark.asyncio
async def test_gemini_safe_provider_diagnostics(async_client: AsyncClient):
    """Verify safe diagnostics endpoint reports provider details without leaking credentials."""
    response = await async_client.get("/api/v1/health/providers")
    assert response.status_code == 200
    data = response.json()

    assert data["active_provider"] == "gemini"
    assert data["selected_llm_provider"] in ["GeminiLLMProvider", "OfflineHeuristicMockProvider"]
    assert "gemini" in data
    assert data["gemini"]["provider_class"] == "GeminiLLMProvider"
    assert data["gemini"]["model"] == "gemini-3.5-flash-lite"
    assert "hook_generator" in data["gemini"]["supported_features"]
    assert "script_generator" in data["gemini"]["supported_features"]
    assert "retention_analyzer" in data["gemini"]["supported_features"]
    assert "script_optimizer" in data["gemini"]["supported_features"]

    # Crucial check: Caption Studio speech transcription must remain OpenAI Whisper
    assert data["caption_transcription"]["engine"].startswith("OpenAI Whisper")
    assert data["caption_transcription"]["model"] == settings.WHISPER_MODEL

    # Ensure no secrets or API keys leaked
    raw_response = response.text
    assert "key=" not in raw_response.lower()
    assert "bearer" not in raw_response.lower()
