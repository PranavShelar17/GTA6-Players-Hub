import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.models.community import CommunityBookmark, CommunityCategory, CommunityPost
from app.models.event import Event, EventCategory, SavedEvent
from app.models.news import NewsArticle, NewsBookmark, NewsCategory
from app.models.price import PriceProduct, PriceWishlist
from app.models.search import SearchIndex, UserSearchHistory
from tests.conftest import TestingSessionLocal

USER1_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.mark.asyncio
async def test_search_categories_stats(async_client: AsyncClient):
    """Test retrieving global search category statistics."""
    response = await async_client.get("/api/v1/search/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "all" in data["data"]
    assert "news" in data["data"]
    assert "deals" in data["data"]
    assert "events" in data["data"]
    assert "community" in data["data"]
    assert "help" in data["data"]


@pytest.mark.asyncio
async def test_search_suggestions(async_client: AsyncClient):
    """Test autocomplete search suggestions and popular queries."""
    async with TestingSessionLocal() as session:
        item = SearchIndex(
            content_type="NEWS",
            content_id=str(uuid.uuid4()),
            title="Official GTA 6 Vice City Map Deep Dive",
            description="Comprehensive analysis of Vice City geography.",
            searchable_text="official gta 6 vice city map deep dive geography leonida",
            category="Official News",
            url_path="/news/vice-city-map",
            verification_status="OFFICIAL",
            is_public=True,
        )
        session.add(item)
        await session.commit()

    response = await async_client.get("/api/v1/search/suggestions?q=Vice")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["suggestions"]) >= 1
    assert any("Vice City" in s["title"] for s in data["data"]["suggestions"])
    assert len(data["data"]["popular"]) > 0


@pytest.mark.asyncio
async def test_search_reindex_and_query(async_client: AsyncClient):
    """Test search index rebuild and global search execution."""
    # 1. Trigger re-indexing
    reindex_resp = await async_client.post(
        "/api/v1/search/reindex",
        headers={"X-Automation-Key": settings.AUTOMATION_API_KEY},
    )
    assert reindex_resp.status_code == 200
    reindex_data = reindex_resp.json()
    assert reindex_data["success"] is True
    assert "indexed_items_count" in reindex_data["data"]

    # 2. Query search
    search_resp = await async_client.get("/api/v1/search?q=GTA&category=ALL&sort=relevant")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert search_data["success"] is True
    assert "items" in search_data["data"]
    assert search_data["data"]["page"] == 1


@pytest.mark.asyncio
async def test_search_filtering_and_sorting(async_client: AsyncClient):
    """Test filtering by category and sorting parameters."""
    async with TestingSessionLocal() as session:
        item_deals = SearchIndex(
            content_type="DEALS",
            content_id=str(uuid.uuid4()),
            title="GTA 6 Special Edition Pre-Order",
            description="Includes bonus digital items and physical steelbook.",
            searchable_text="gta 6 special edition pre-order steelbook",
            category="PlayStation 5",
            url_path="/price-deals/special-edition",
            verification_status="VERIFIED",
            price_amount=89.99,
            currency_code="USD",
            is_public=True,
        )
        session.add(item_deals)
        await session.commit()

    # Query DEALS category
    resp = await async_client.get("/api/v1/search?q=Special&category=DEALS&sort=price_desc")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["items"]) >= 1
    assert data["items"][0]["content_type"] == "DEALS"
    assert data["items"][0]["price_display"] == "$89.99"


@pytest.mark.asyncio
async def test_user_search_history_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    """Test recording, listing, and clearing private search history."""
    # 1. Record a search query
    record_resp = await async_client.post(
        "/api/v1/search/recent",
        headers=auth_headers_user1,
        json={"query": "Vice City Leaks", "category_filter": "NEWS", "results_count": 5},
    )
    assert record_resp.status_code == 200
    assert record_resp.json()["data"]["recorded"] is True

    # 2. Retrieve recent queries
    get_resp = await async_client.get("/api/v1/search/recent?limit=5", headers=auth_headers_user1)
    assert get_resp.status_code == 200
    recent = get_resp.json()["data"]
    assert len(recent) >= 1
    assert any(r["query"] == "Vice City Leaks" for r in recent)

    # 3. Clear recent queries
    del_resp = await async_client.delete("/api/v1/search/recent", headers=auth_headers_user1)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["cleared"] is True

    # Verify cleared
    get_after = await async_client.get("/api/v1/search/recent", headers=auth_headers_user1)
    assert len(get_after.json()["data"]) == 0


@pytest.mark.asyncio
async def test_unified_saved_content(async_client: AsyncClient, auth_headers_user1: dict):
    """Test unified saved content aggregation and item removal across modules."""
    async with TestingSessionLocal() as session:
        # 1. Create a News Category & Article
        now = datetime.now(timezone.utc)
        cat = NewsCategory(name="Leaks & Rumours", slug=f"leaks-{uuid.uuid4().hex[:6]}")
        session.add(cat)
        await session.flush()

        art = NewsArticle(
            title="Vice City Marina Location Discovered",
            slug=f"marina-{uuid.uuid4().hex[:6]}",
            summary="Detailed analysis of Vice City boat slip.",
            content="Full breakdown of coordinates.",
            category_id=cat.id,
            original_article_url="https://example.com/art",
            canonical_url="https://example.com/canon",
            verification_status="VERIFIED",
            publication_status="PUBLISHED",
            original_published_at=now,
        )
        session.add(art)
        await session.flush()

        # Bookmark the article
        bm = NewsBookmark(player_id=USER1_ID, article_id=art.id)
        session.add(bm)

        # 2. Create a Price Product & Wishlist entry
        prod = PriceProduct(
            name="Grand Theft Auto VI",
            slug=f"gta6-{uuid.uuid4().hex[:6]}",
            edition="Collector's Edition",
            platform="PC",
        )
        session.add(prod)
        await session.flush()

        wl = PriceWishlist(player_id=USER1_ID, product_id=prod.id)
        session.add(wl)

        await session.commit()
        bm_id = str(bm.id)

    # 3. Fetch Unified Saved Content
    saved_resp = await async_client.get("/api/v1/users/me/saved?type=ALL", headers=auth_headers_user1)
    assert saved_resp.status_code == 200
    saved_data = saved_resp.json()["data"]
    assert saved_data["total"] >= 2
    assert saved_data["counts_by_type"]["NEWS"] >= 1
    assert saved_data["counts_by_type"]["DEALS"] >= 1

    # Verify item contents
    item_titles = [i["title"] for i in saved_data["items"]]
    assert "Vice City Marina Location Discovered" in item_titles

    # 4. Remove the news bookmark via unified endpoint
    del_resp = await async_client.delete(f"/api/v1/users/me/saved/NEWS/{bm_id}", headers=auth_headers_user1)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["removed"] is True

    # Verify removal
    saved_after = await async_client.get("/api/v1/users/me/saved?type=NEWS", headers=auth_headers_user1)
    assert saved_after.json()["data"]["total"] == 0


@pytest.mark.asyncio
async def test_personalisation_preferences(async_client: AsyncClient, auth_headers_user1: dict):
    """Test updating and reading player personalization preferences."""
    # Ensure profile and preferences are initialized
    init_resp = await async_client.get("/api/v1/users/me", headers=auth_headers_user1)
    assert init_resp.status_code == 200

    # 1. Update preferences with new Phase 11 fields
    update_payload = {
        "preferred_country": "CAN",
        "preferred_currency": "CAD",
        "preferred_platform": "PC",
        "preferred_edition": "Ultimate Edition",
        "preferred_categories": "OFFICIAL,VERIFIED,DEALS",
        "theme": "dark",
        "content_density": "compact",
    }

    put_resp = await async_client.put(
        "/api/v1/users/me/preferences",
        headers=auth_headers_user1,
        json=update_payload,
    )
    assert put_resp.status_code == 200
    put_data = put_resp.json()
    assert put_data["success"] is True
    assert put_data["data"]["preferred_categories"] == "OFFICIAL,VERIFIED,DEALS"
    assert put_data["data"]["theme"] == "dark"
    assert put_data["data"]["content_density"] == "compact"

    # 2. Get preferences
    get_resp = await async_client.get("/api/v1/users/me/preferences", headers=auth_headers_user1)
    assert get_resp.status_code == 200
    get_data = get_resp.json()["data"]
    assert get_data["preferred_categories"] == "OFFICIAL,VERIFIED,DEALS"
    assert get_data["theme"] == "dark"
    assert get_data["content_density"] == "compact"
