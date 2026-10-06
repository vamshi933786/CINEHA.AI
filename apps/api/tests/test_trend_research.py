import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.trend_research import calculate_overall_score
from app.services.script_language_detector import TELUGU_UNICODE_PATTERN, TANGLISH_KEYWORDS


@pytest.mark.asyncio
async def test_calculate_overall_score_formula():
    """Verify transparent weighted scoring formula: 20% M + 25% A + 25% C + 20% O + 10% U."""
    # Example: M=90, A=80, C=100, O=70, U=60
    # Expected: 0.20*90 + 0.25*80 + 0.25*100 + 0.20*70 + 0.10*60 = 18 + 20 + 25 + 14 + 6 = 83
    score = calculate_overall_score(
        momentum=90,
        audience_fit=80,
        creator_fit=100,
        content_opportunity=70,
        urgency=60,
    )
    assert score == 83

    # Clamping boundaries [0, 100]
    assert calculate_overall_score(100, 100, 100, 100, 100) == 100
    assert calculate_overall_score(0, 0, 0, 0, 0) == 0


@pytest.mark.asyncio
async def test_trend_research_english_generation():
    """Verify English trend research returns valid scored opportunities and transparent sources."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "niche": "Cinematography",
            "target_audience": "Aspiring smartphone creators",
            "platform": "Instagram Reels",
            "language": "English",
            "research_depth": "Deep Dive",
            "time_horizon": "Current Momentum",
            "count": 5,
        }
        res = await ac.post("/api/v1/trend-research", json=payload)
        assert res.status_code == 201
        data = res.json()

        assert "id" in data
        assert data["language"] == "English"
        assert data["niche"] == "Cinematography"
        assert len(data["opportunities"]) >= 3

        for opp in data["opportunities"]:
            assert "id" in opp
            assert opp["topic"]
            assert opp["why_it_matters"]
            assert len(opp["angle_ideas"]) >= 2
            assert len(opp["recommended_hooks"]) >= 2
            assert len(opp["talking_points"]) >= 2
            assert opp["recommended_format"]
            assert opp["recommended_cta"]

            # Scores check
            scores = opp["scores"]
            assert 0 <= scores["momentum"] <= 100
            assert 0 <= scores["audience_fit"] <= 100
            assert 0 <= scores["creator_fit"] <= 100
            assert 0 <= scores["content_opportunity"] <= 100
            assert 0 <= scores["urgency"] <= 100
            expected_overall = calculate_overall_score(
                scores["momentum"],
                scores["audience_fit"],
                scores["creator_fit"],
                scores["content_opportunity"],
                scores["urgency"],
            )
            assert scores["overall_score"] == expected_overall

            # Source attribution check (transparent, no fake live metrics)
            source = opp["source"]
            assert source["type"] in ["ai_opportunity_research", "creator_profile_analysis", "heuristic_opportunity"]
            assert source["verified"] is False
            assert "Synthesized" in source["citation"]
            # Verify no fake claims
            assert "views" not in opp
            assert "rank" not in opp


@pytest.mark.asyncio
async def test_trend_research_telugu_unicode():
    """Verify Telugu trend research generates authentic Telugu Unicode script."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "niche": "Cinematography",
            "language": "Telugu",
            "platform": "Instagram Reels",
            "count": 4,
        }
        res = await ac.post("/api/v1/trend-research", json=payload)
        assert res.status_code == 201
        data = res.json()

        assert data["language"] == "Telugu"
        assert len(data["opportunities"]) >= 3

        telugu_chars_found = False
        for opp in data["opportunities"]:
            full_text = f"{opp['topic']} {opp['why_it_matters']} {' '.join(opp['recommended_hooks'])}"
            if TELUGU_UNICODE_PATTERN.search(full_text):
                telugu_chars_found = True
            assert opp["scores"]["overall_score"] > 0

        assert telugu_chars_found, "Telugu research must contain authentic Telugu Unicode script"


@pytest.mark.asyncio
async def test_trend_research_tanglish():
    """Verify Tanglish trend research generates authentic Romanized Telugu (te-Latn)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "niche": "Cinematography",
            "language": "Tanglish",
            "platform": "Instagram Reels",
            "count": 4,
        }
        res = await ac.post("/api/v1/trend-research", json=payload)
        assert res.status_code == 201
        data = res.json()

        assert data["language"] == "Tanglish"
        assert len(data["opportunities"]) >= 3

        tanglish_keyword_found = False
        for opp in data["opportunities"]:
            combined_text = f"{opp['topic']} {opp['why_it_matters']} {' '.join(opp['recommended_hooks'])}".lower()
            if any(k in combined_text for k in TANGLISH_KEYWORDS):
                tanglish_keyword_found = True

        assert tanglish_keyword_found, "Tanglish research must contain authentic Tanglish vocabulary markers"


@pytest.mark.asyncio
async def test_trend_research_with_custom_seed_topic():
    """Verify custom user-provided seed query generates targeted, personalized concepts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "topic": "iPhone Log Color Grading",
            "niche": "Mobile Filmmaking",
            "language": "English",
            "count": 3,
        }
        res = await ac.post("/api/v1/trend-research", json=payload)
        assert res.status_code == 201
        data = res.json()

        assert data["query_topic"] == "iPhone Log Color Grading"
        assert len(data["opportunities"]) == 3
        first_opp = data["opportunities"][0]
        assert "iPhone Log Color Grading" in first_opp["topic"]


@pytest.mark.asyncio
async def test_trend_research_history_lifecycle():
    """Verify complete CRUD lifecycle: create, list history, fetch by ID, refresh, and delete."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create session
        create_res = await ac.post("/api/v1/trend-research", json={
            "niche": "Cinematography",
            "language": "English",
            "count": 3,
        })
        assert create_res.status_code == 201
        session_id = create_res.json()["id"]

        # 2. List history
        history_res = await ac.get("/api/v1/trend-research")
        assert history_res.status_code == 200
        history_data = history_res.json()
        assert history_data["total"] >= 1
        session_ids = [s["id"] for s in history_data["sessions"]]
        assert session_id in session_ids

        # 3. Get session by ID
        get_res = await ac.get(f"/api/v1/trend-research/{session_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == session_id

        # 4. Refresh session
        refresh_res = await ac.post(f"/api/v1/trend-research/{session_id}/refresh")
        assert refresh_res.status_code == 200
        assert len(refresh_res.json()["opportunities"]) > 0

        # 5. Delete session
        del_res = await ac.delete(f"/api/v1/trend-research/{session_id}")
        assert del_res.status_code == 204

        # 6. Verify 404 after delete
        not_found_res = await ac.get(f"/api/v1/trend-research/{session_id}")
        assert not_found_res.status_code == 404
