import pytest
from httpx import AsyncClient, ASGITransport
from datetime import date, timedelta
from app.main import app
from app.models.content_item import ContentItem
from app.models.script import Script
from app.models.video_analysis import VideoAnalysis
from app.core.database import AsyncSessionLocal

@pytest.mark.asyncio
async def test_calendar_crud_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create content item
        create_payload = {
            "title": "5 Lighting Hacks for Mobile Filmmakers",
            "description": "Quick setup with practical LED lights",
            "scheduled_date": "2026-10-15",
            "scheduled_time": "18:00",
            "status": "Planned",
            "platform": "Instagram Reels",
            "content_type": "Educational",
            "language": "Tanglish",
            "content_pillar": "Mobile Filmmaking",
            "content_goal": "Increase retention",
            "priority": "High",
            "tags": ["lighting", "mobile", "cinematic"],
            "notes": "Bring diffuser kit",
            "cta": "Save this reel",
        }
        res = await client.post("/api/v1/calendar", json=create_payload)
        assert res.status_code == 201
        data = res.json()
        item_id = data["id"]
        assert data["title"] == "5 Lighting Hacks for Mobile Filmmakers"
        assert data["scheduled_date"] == "2026-10-15"
        assert data["status"] == "Planned"
        assert data["platform"] == "Instagram Reels"
        assert data["priority"] == "High"
        assert data["tags"] == ["lighting", "mobile", "cinematic"]

        # 2. Get single item
        get_res = await client.get(f"/api/v1/calendar/{item_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == item_id

        # 3. Update item
        update_payload = {
            "title": "5 Lighting Hacks (Updated Title)",
            "status": "Script Ready",
            "scheduled_time": "19:30",
            "priority": "Urgent",
        }
        put_res = await client.put(f"/api/v1/calendar/{item_id}", json=update_payload)
        assert put_res.status_code == 200
        updated = put_res.json()
        assert updated["title"] == "5 Lighting Hacks (Updated Title)"
        assert updated["status"] == "Script Ready"
        assert updated["scheduled_time"] == "19:30"
        assert updated["priority"] == "Urgent"

        # 4. Duplicate item with +7 days shift
        dup_res = await client.post(f"/api/v1/calendar/{item_id}/duplicate?shift_days=7")
        assert dup_res.status_code == 201
        dup_data = dup_res.json()
        assert dup_data["id"] != item_id
        assert dup_data["title"] == "5 Lighting Hacks (Updated Title) (Copy)"
        assert dup_data["scheduled_date"] == "2026-10-22"
        assert dup_data["status"] == "Planned"

        # 5. Delete duplicate
        del_dup = await client.delete(f"/api/v1/calendar/{dup_data['id']}")
        assert del_dup.status_code == 200
        assert del_dup.json()["deleted"] is True

        # 6. Delete original
        del_res = await client.delete(f"/api/v1/calendar/{item_id}")
        assert del_res.status_code == 200
        assert del_res.json()["deleted"] is True

        # 7. Verify 404
        get_deleted = await client.get(f"/api/v1/calendar/{item_id}")
        assert get_deleted.status_code == 404

@pytest.mark.asyncio
async def test_calendar_filtering_and_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create 3 test items
        item1 = {
            "title": "Camera Angles Breakdown",
            "scheduled_date": "2026-10-10",
            "status": "Planned",
            "platform": "YouTube Shorts",
            "content_type": "Tutorial",
            "content_pillar": "Cinematography",
            "priority": "Medium",
        }
        item2 = {
            "title": "Color Grading in Premiere",
            "scheduled_date": "2026-10-12",
            "status": "In Production",
            "platform": "Instagram Reels",
            "content_type": "Educational",
            "content_pillar": "Editing",
            "priority": "High",
        }
        item3 = {
            "title": "Behind the Scenes Commercial",
            "scheduled_date": "2026-10-20",
            "status": "Published",
            "platform": "Instagram Reels",
            "content_type": "Behind the Scenes",
            "content_pillar": "Cinematography",
            "priority": "Low",
        }

        res1 = await client.post("/api/v1/calendar", json=item1)
        res2 = await client.post("/api/v1/calendar", json=item2)
        res3 = await client.post("/api/v1/calendar", json=item3)

        id1 = res1.json()["id"]
        id2 = res2.json()["id"]
        id3 = res3.json()["id"]

        try:
            # Filter by platform
            p_res = await client.get("/api/v1/calendar?platform=YouTube Shorts")
            assert p_res.status_code == 200
            p_ids = [x["id"] for x in p_res.json()]
            assert id1 in p_ids
            assert id2 not in p_ids

            # Filter by status
            s_res = await client.get("/api/v1/calendar?status=Published")
            assert s_res.status_code == 200
            s_ids = [x["id"] for x in s_res.json()]
            assert id3 in s_ids
            assert id1 not in s_ids

            # Filter by date range
            d_res = await client.get("/api/v1/calendar?start_date=2026-10-11&end_date=2026-10-15")
            assert d_res.status_code == 200
            d_ids = [x["id"] for x in d_res.json()]
            assert id2 in d_ids
            assert id1 not in d_ids
            assert id3 not in d_ids

            # Search by keyword
            search_res = await client.get("/api/v1/calendar?search=Premiere")
            assert search_res.status_code == 200
            search_ids = [x["id"] for x in search_res.json()]
            assert id2 in search_ids
            assert id1 not in search_ids

            # Dashboard stats
            stats_res = await client.get("/api/v1/calendar/stats/dashboard")
            assert stats_res.status_code == 200
            stats = stats_res.json()
            assert stats["total_items"] >= 3
            assert "Instagram Reels" in stats["platform_breakdown"]
        finally:
            # Cleanup
            await client.delete(f"/api/v1/calendar/{id1}")
            await client.delete(f"/api/v1/calendar/{id2}")
            await client.delete(f"/api/v1/calendar/{id3}")

@pytest.mark.asyncio
async def test_calendar_linked_resources():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test script directly in DB
        async with AsyncSessionLocal() as session:
            test_script = Script(
                title="Test Linked Script",
                topic="Cinematic LUTs",
                platform="Instagram Reels",
                language="English",
                duration_seconds=45,
                tone="Educational",
                hook="Did you know this LUT trick?",
                cta="Follow for more",
            )
            session.add(test_script)
            await session.commit()
            await session.refresh(test_script)
            script_id = test_script.id

            test_analysis = VideoAnalysis(
                filename="reel_test.mp4",
                duration_seconds=30.0,
                overall_score=88,
                overall_rating="Strong Performer",
                findings=[{"finding": "Pacing slows down at 12s"}],
            )
            session.add(test_analysis)
            await session.commit()
            await session.refresh(test_analysis)
            analysis_id = test_analysis.id

        try:
            # Create content item linked to both
            create_payload = {
                "title": "Scheduled Item with Linked Resources",
                "scheduled_date": "2026-10-25",
                "script_id": script_id,
                "video_analysis_id": analysis_id,
                "status": "Script Ready",
            }
            res = await client.post("/api/v1/calendar", json=create_payload)
            assert res.status_code == 201
            data = res.json()
            item_id = data["id"]

            assert data["script_id"] == script_id
            assert data["script_summary"] is not None
            assert data["script_summary"]["title"] == "Test Linked Script"
            assert data["script_summary"]["duration_seconds"] == 45

            assert data["video_analysis_id"] == analysis_id
            assert data["video_analysis_summary"] is not None
            assert data["video_analysis_summary"]["filename"] == "reel_test.mp4"
            assert data["video_analysis_summary"]["overall_score"] == 88

            # Test invalid script reference rejected
            bad_payload = {
                "title": "Bad Link",
                "scheduled_date": "2026-10-25",
                "script_id": "non-existent-script-id",
            }
            bad_res = await client.post("/api/v1/calendar", json=bad_payload)
            assert bad_res.status_code == 400

            # Cleanup item
            await client.delete(f"/api/v1/calendar/{item_id}")
        finally:
            async with AsyncSessionLocal() as session:
                s = await session.get(Script, script_id)
                if s:
                    await session.delete(s)
                v = await session.get(VideoAnalysis, analysis_id)
                if v:
                    await session.delete(v)
                await session.commit()

@pytest.mark.asyncio
async def test_generate_content_plan():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        req_payload = {
            "planning_period_days": 7,
            "posting_frequency": "3/week",
            "content_goals": ["Build brand", "Educate viewers"],
            "start_date": "2026-10-15",
        }
        res = await client.post("/api/v1/calendar/generate-plan", json=req_payload)
        assert res.status_code == 200
        data = res.json()

        assert "suggestions" in data
        assert len(data["suggestions"]) >= 3
        first = data["suggestions"][0]
        assert "title" in first
        assert "description" in first
        assert "suggested_date" in first
        assert "content_pillar" in first
        assert "platform" in first
        assert "content_type" in first

@pytest.mark.asyncio
async def test_calendar_validation_rules():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid date format
        bad_date = {
            "title": "Test Title",
            "scheduled_date": "15-10-2026",
        }
        res1 = await client.post("/api/v1/calendar", json=bad_date)
        assert res1.status_code == 422

        # Invalid status
        bad_status = {
            "title": "Test Title",
            "scheduled_date": "2026-10-15",
            "status": "NonExistentStatus",
        }
        res2 = await client.post("/api/v1/calendar", json=bad_status)
        assert res2.status_code == 422

        # Empty title
        bad_title = {
            "title": "",
            "scheduled_date": "2026-10-15",
        }
        res3 = await client.post("/api/v1/calendar", json=bad_title)
        assert res3.status_code == 422
