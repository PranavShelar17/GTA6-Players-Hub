import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from app.services.event_service import format_in_timezone


@pytest.mark.asyncio
async def test_get_event_categories(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/events/categories")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["success"] is True
    categories = json_data["data"]
    assert len(categories) >= 4
    slugs = [c["slug"] for c in categories]
    assert "official-broadcasts" in slugs
    assert "corporate-financial" in slugs


@pytest.mark.asyncio
async def test_list_events_and_filters(async_client: AsyncClient):
    # 1. Default upcoming
    resp = await async_client.get("/api/v1/events?timeframe=upcoming")
    assert resp.status_code == 200
    events = resp.json()["data"]
    assert len(events) >= 1

    # 2. Filter by status
    resp_official = await async_client.get("/api/v1/events?status=OFFICIAL&timeframe=all")
    assert resp_official.status_code == 200
    official_events = resp_official.json()["data"]
    for ev in official_events:
        assert ev["verification_status"] == "OFFICIAL"

    # 3. Filter by category
    resp_cat = await async_client.get("/api/v1/events?category=corporate-financial&timeframe=all")
    assert resp_cat.status_code == 200
    cat_events = resp_cat.json()["data"]
    assert len(cat_events) >= 1
    assert cat_events[0]["category_slug"] == "corporate-financial"

    # 4. Search filter
    resp_search = await async_client.get("/api/v1/events?search=Earnings&timeframe=all")
    assert resp_search.status_code == 200
    search_events = resp_search.json()["data"]
    assert len(search_events) >= 1
    assert "Earnings" in search_events[0]["title"] or "Earnings" in search_events[0]["description"]


@pytest.mark.asyncio
async def test_get_event_detail_success(async_client: AsyncClient):
    slug = "take-two-q3-fy2027-earnings"
    resp = await async_client.get(f"/api/v1/events/{slug}")
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["slug"] == slug
    assert detail["verification_status"] == "OFFICIAL"
    assert "description" in detail
    assert "Take-Two" in detail["organizer_name"]


@pytest.mark.asyncio
async def test_get_event_detail_not_found(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/events/non-existent-event-slug-12345")
    assert resp.status_code == 404
    assert resp.json()["success"] is False


@pytest.mark.asyncio
async def test_unauthenticated_save_rejected(async_client: AsyncClient):
    resp = await async_client.post("/api/v1/events/00000000-0000-0000-0000-000000000001/save")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_saved_events_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Fetch an event
    list_res = await async_client.get("/api/v1/events?timeframe=all&limit=1")
    event_id = list_res.json()["data"][0]["id"]

    # 2. Save event
    save_res = await async_client.post(
        f"/api/v1/events/{event_id}/save",
        json={"notes": "Must watch investor call for GTA 6 updates"},
        headers=auth_headers_user1,
    )
    assert save_res.status_code == 200
    assert save_res.json()["data"]["is_saved"] is True

    # 3. Retrieve saved events
    saved_list = await async_client.get("/api/v1/events/saved", headers=auth_headers_user1)
    assert saved_list.status_code == 200
    saved_items = saved_list.json()["data"]
    assert any(s["event_id"] == event_id for s in saved_items)

    # 4. Unsave event
    unsave_res = await async_client.delete(f"/api/v1/events/{event_id}/save", headers=auth_headers_user1)
    assert unsave_res.status_code == 200
    assert unsave_res.json()["data"]["is_saved"] is False

    # 5. Verify removed
    verify_list = await async_client.get("/api/v1/events/saved", headers=auth_headers_user1)
    assert not any(s["event_id"] == event_id for s in verify_list.json()["data"])


@pytest.mark.asyncio
async def test_event_reminders_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Fetch an event
    list_res = await async_client.get("/api/v1/events?timeframe=all&limit=1")
    event_id = list_res.json()["data"][0]["id"]

    # 2. Set reminder
    rem_res = await async_client.post(
        f"/api/v1/events/{event_id}/reminders",
        json={"lead_time_minutes": 60, "channel": "IN_APP"},
        headers=auth_headers_user1,
    )
    assert rem_res.status_code == 200
    reminder = rem_res.json()["data"]
    reminder_id = reminder["id"]
    assert reminder["lead_time_minutes"] == 60
    assert reminder["channel"] == "IN_APP"

    # 3. Get player reminders
    list_rem = await async_client.get("/api/v1/events/reminders", headers=auth_headers_user1)
    assert list_rem.status_code == 200
    reminders = list_rem.json()["data"]
    assert any(r["id"] == reminder_id for r in reminders)

    # 4. Delete reminder
    del_res = await async_client.delete(f"/api/v1/events/reminders/{reminder_id}", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True


def test_timezone_conversion_logic():
    # Test safe conversion across zones (UTC, US/Eastern, Asia/Kolkata)
    utc_dt = datetime(2027, 2, 5, 21, 30, tzinfo=timezone.utc)

    # US/Eastern (EST is UTC-5 in Feb)
    ny_dt = format_in_timezone(utc_dt, "America/New_York")
    assert ny_dt.hour == 16
    assert ny_dt.minute == 30

    # Asia/Kolkata (IST is UTC+5:30)
    ist_dt = format_in_timezone(utc_dt, "Asia/Kolkata")
    assert ist_dt.hour == 3  # Next day 03:00
    assert ist_dt.day == 6

    # Invalid timezone string falls back safely to UTC
    fallback_dt = format_in_timezone(utc_dt, "Invalid/Timezone")
    assert fallback_dt.tzinfo == timezone.utc
