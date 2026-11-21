import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_news_categories(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/categories")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)
    assert len(json_data["data"]) >= 6
    first_cat = json_data["data"][0]
    assert "slug" in first_cat
    assert "articles_count" in first_cat


@pytest.mark.asyncio
async def test_get_news_sources(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/sources")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)
    assert len(json_data["data"]) >= 4
    source_names = [s["name"] for s in json_data["data"]]
    assert "Take-Two Interactive IR" in source_names or "Rockstar Games Newswire" in source_names


@pytest.mark.asyncio
async def test_get_news_stats(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/stats")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    stats = json_data["data"]
    assert stats["total_articles"] >= 5
    assert stats["official_count"] >= 1
    assert stats["verified_count"] >= 1


@pytest.mark.asyncio
async def test_get_news_list_pagination(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news?page=1&page_size=3")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    data = json_data["data"]
    assert len(data["items"]) <= 3
    assert data["page"] == 1
    assert data["total"] >= 5
    assert data["total_pages"] >= 2


@pytest.mark.asyncio
async def test_get_news_search_filter(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news?q=Take-Two")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    items = json_data["data"]["items"]
    assert len(items) >= 1
    assert "take-two" in items[0]["title"].lower() or "take-two" in items[0]["summary"].lower()


@pytest.mark.asyncio
async def test_get_news_category_filter(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news?category=official-announcements")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    items = json_data["data"]["items"]
    assert len(items) >= 1
    for item in items:
        assert item["category_slug"] == "official-announcements"


@pytest.mark.asyncio
async def test_get_news_verification_status_filter(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news?verification_status=OFFICIAL")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    items = json_data["data"]["items"]
    assert len(items) >= 1
    for item in items:
        assert item["verification_status"] == "OFFICIAL"


@pytest.mark.asyncio
async def test_get_news_sorting(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news?sort=oldest")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    items = json_data["data"]["items"]
    assert len(items) >= 2
    # Verify chronological ascending order
    assert items[0]["original_published_at"] <= items[-1]["original_published_at"]


@pytest.mark.asyncio
async def test_get_featured_news(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/featured")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    featured = json_data["data"]
    assert featured is not None
    assert "title" in featured
    assert "slug" in featured
    assert featured["is_featured"] is True or featured["verification_status"] == "OFFICIAL"


@pytest.mark.asyncio
async def test_get_news_detail_success(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/take-two-reconfirms-gta6-fall-2025")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    article = json_data["data"]
    assert article["slug"] == "take-two-reconfirms-gta6-fall-2025"
    assert "content" in article
    assert len(article["content"]) > 100
    assert "related_articles" in article


@pytest.mark.asyncio
async def test_get_news_detail_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/non-existent-article-slug-xyz")
    assert response.status_code == 404
    json_data = response.json()
    assert json_data["success"] is False
    assert "not found" in json_data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_get_related_news(async_client: AsyncClient):
    response = await async_client.get("/api/v1/news/take-two-reconfirms-gta6-fall-2025/related?limit=2")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert isinstance(json_data["data"], list)


@pytest.mark.asyncio
async def test_unauthenticated_bookmark_rejected(async_client: AsyncClient):
    # Non-authenticated user cannot bookmark
    response = await async_client.post("/api/v1/news/00000000-0000-0000-0000-000000000001/bookmark")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_bookmark_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Get an existing article
    list_res = await async_client.get("/api/v1/news?page_size=1")
    article = list_res.json()["data"]["items"][0]
    article_id = article["id"]

    # 2. Add bookmark
    add_res = await async_client.post(f"/api/v1/news/{article_id}/bookmark", headers=auth_headers_user1)
    assert add_res.status_code == 200
    assert add_res.json()["data"]["is_bookmarked"] is True

    # 3. Retrieve user bookmarks
    get_res = await async_client.get("/api/v1/news/bookmarks", headers=auth_headers_user1)
    assert get_res.status_code == 200
    bookmarks = get_res.json()["data"]
    assert any(b["article"]["id"] == article_id for b in bookmarks)

    # 4. Remove bookmark
    del_res = await async_client.delete(f"/api/v1/news/{article_id}/bookmark", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert del_res.json()["data"]["is_bookmarked"] is False

    # 5. Verify removed
    verify_res = await async_client.get("/api/v1/news/bookmarks", headers=auth_headers_user1)
    assert not any(b["article"]["id"] == article_id for b in verify_res.json()["data"])


@pytest.mark.asyncio
async def test_trigger_news_collection(async_client: AsyncClient):
    response = await async_client.post("/api/v1/news/collect")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    result = json_data["data"]
    assert result["sources_checked"] >= 1
