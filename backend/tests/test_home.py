import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_homepage_aggregated_feed(async_client: AsyncClient):
    """Verifies that the aggregated homepage feed returns news, deals, events, and community items."""
    response = await async_client.get("/api/v1/home")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["error"] is None
    data = payload["data"]
    assert "news" in data and len(data["news"]) >= 1
    assert "deals" in data and len(data["deals"]) >= 1
    assert "events" in data and len(data["events"]) >= 1
    assert "community" in data and len(data["community"]) >= 1
    assert "disclaimer" in data


@pytest.mark.asyncio
async def test_get_homepage_feed_localized_preferences(async_client: AsyncClient):
    """Verifies that the homepage feed can filter deals by country and currency."""
    response = await async_client.get("/api/v1/home?country_code=IND&currency=INR")
    assert response.status_code == 200
    data = response.json()["data"]
    for deal in data["deals"]:
        assert deal["currency"] == "INR"
        assert deal["country_code"] == "IND"


@pytest.mark.asyncio
async def test_get_home_news_endpoint(async_client: AsyncClient):
    """Verifies the standalone /api/v1/home/news endpoint."""
    response = await async_client.get("/api/v1/home/news")
    assert response.status_code == 200
    news = response.json()["data"]
    assert len(news) >= 1
    first = news[0]
    assert "verification_status" in first
    assert first["verification_status"] in ["OFFICIAL", "VERIFIED", "RUMOUR", "UNCONFIRMED"]


@pytest.mark.asyncio
async def test_get_home_deals_endpoint(async_client: AsyncClient):
    """Verifies the standalone /api/v1/home/deals endpoint."""
    response = await async_client.get("/api/v1/home/deals?platform=PS5")
    assert response.status_code == 200
    deals = response.json()["data"]
    for deal in deals:
        assert deal["platform"] == "PS5"


@pytest.mark.asyncio
async def test_get_home_events_endpoint(async_client: AsyncClient):
    """Verifies the standalone /api/v1/home/events endpoint."""
    response = await async_client.get("/api/v1/home/events")
    assert response.status_code == 200
    events = response.json()["data"]
    assert len(events) >= 1
    assert "event_name" in events[0]
    assert "timezone" in events[0]


@pytest.mark.asyncio
async def test_get_home_community_endpoint(async_client: AsyncClient):
    """Verifies the standalone /api/v1/home/community endpoint."""
    response = await async_client.get("/api/v1/home/community")
    assert response.status_code == 200
    posts = response.json()["data"]
    assert len(posts) >= 1
    assert "author_username" in posts[0]
    assert "replies_count" in posts[0]
