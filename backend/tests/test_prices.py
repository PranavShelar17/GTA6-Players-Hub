import pytest
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

from app.services.price_service import (
    calculate_discount_percentage,
    check_verification_status,
)


@pytest.mark.asyncio
async def test_get_price_regions(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/prices/regions")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) >= 5
    codes = [r["country_code"] for r in data]
    assert "IND" in codes
    assert "USA" in codes
    assert "GBR" in codes
    assert "EUR" in codes
    assert "ARE" in codes


@pytest.mark.asyncio
async def test_get_price_stores(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/prices/stores")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) >= 4
    names = [s["store_name"] for s in data]
    assert "PlayStation Store" in names
    assert "Xbox Marketplace" in names


@pytest.mark.asyncio
async def test_get_price_stats(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/prices/stats")
    assert resp.status_code == 200
    stats = resp.json()["data"]
    assert stats["total_products"] >= 5
    assert stats["total_observations"] > 0
    assert stats["supported_regions"] >= 5
    assert stats["supported_stores"] >= 4


@pytest.mark.asyncio
async def test_list_products_and_filter(async_client: AsyncClient):
    # All products
    resp = await async_client.get("/api/v1/prices/products")
    assert resp.status_code == 200
    products = resp.json()["data"]
    assert len(products) >= 5

    # Filter by platform
    resp_ps5 = await async_client.get("/api/v1/prices/products?platform=PLAYSTATION_5")
    assert resp_ps5.status_code == 200
    ps5_prods = resp_ps5.json()["data"]
    assert len(ps5_prods) >= 2
    for p in ps5_prods:
        assert p["platform"] == "PLAYSTATION_5"

    # PC Product shows unannounced status notice
    resp_pc = await async_client.get("/api/v1/prices/products?platform=PC")
    assert resp_pc.status_code == 200
    pc_prods = resp_pc.json()["data"]
    assert len(pc_prods) >= 1
    assert pc_prods[0]["pc_pricing_available"] is False
    assert "Official PC pricing" in pc_prods[0]["pc_status_notice"]


@pytest.mark.asyncio
async def test_get_product_detail_success_and_pc(async_client: AsyncClient):
    # Console edition
    slug = "gta-6-standard-edition-ps5"
    resp = await async_client.get(f"/api/v1/prices/products/{slug}?country_code=USA")
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["slug"] == slug
    assert detail["platform"] == "PLAYSTATION_5"
    assert detail["pc_pricing_available"] is True
    assert float(detail["lowest_verified_price"]) > 0

    # PC edition
    pc_slug = "gta-6-pc-edition"
    resp_pc = await async_client.get(f"/api/v1/prices/products/{pc_slug}")
    assert resp_pc.status_code == 200
    pc_detail = resp_pc.json()["data"]
    assert pc_detail["pc_pricing_available"] is False
    assert "Official PC pricing is not currently available" in pc_detail["pc_status_notice"]


@pytest.mark.asyncio
async def test_compare_prices_and_best_offer(async_client: AsyncClient):
    slug = "gta-6-standard-edition-ps5"
    resp = await async_client.get(f"/api/v1/prices/compare?slug={slug}&country_code=USA")
    assert resp.status_code == 200
    comp = resp.json()["data"]
    assert comp["slug"] == slug
    assert comp["region"]["country_code"] == "USA"
    assert len(comp["offers"]) >= 2
    assert comp["best_offer"] is not None
    assert comp["best_offer"]["is_best_price"] is True
    # Best offer in USA seed is Best Buy promo at $64.99 vs $69.99
    assert float(comp["best_offer"]["current_price"]) <= float(comp["offers"][-1]["current_price"])


@pytest.mark.asyncio
async def test_get_deals_endpoint(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/prices/deals")
    assert resp.status_code == 200
    deals = resp.json()["data"]
    assert len(deals) >= 1
    for d in deals:
        assert float(d["discount_percentage"]) > 0
        assert float(d["original_price"]) >= float(d["current_price"])


@pytest.mark.asyncio
async def test_price_history_endpoint(async_client: AsyncClient):
    slug = "gta-6-standard-edition-ps5"
    resp = await async_client.get(f"/api/v1/prices/products/{slug}/history?country_code=USA")
    assert resp.status_code == 200
    hist = resp.json()["data"]
    assert hist["slug"] == slug
    assert hist["total_observations"] >= 2
    assert float(hist["historical_lowest_price"]) > 0
    assert float(hist["historical_highest_price"]) >= float(hist["historical_lowest_price"])
    assert len(hist["data_points"]) >= 2


@pytest.mark.asyncio
async def test_wishlist_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Unauthenticated wishlist access rejected
    unauth_resp = await async_client.get("/api/v1/prices/wishlist")
    assert unauth_resp.status_code == 401

    # 2. Get product id
    prod_resp = await async_client.get("/api/v1/prices/products")
    product_id = prod_resp.json()["data"][0]["id"]

    # 3. Add to wishlist
    add_resp = await async_client.post(f"/api/v1/prices/wishlist/{product_id}", headers=auth_headers_user1)
    assert add_resp.status_code == 200
    assert add_resp.json()["data"]["is_wishlisted"] is True

    # 4. View wishlist
    list_resp = await async_client.get("/api/v1/prices/wishlist", headers=auth_headers_user1)
    assert list_resp.status_code == 200
    items = list_resp.json()["data"]
    assert len(items) == 1
    assert items[0]["product_id"] == product_id

    # 5. Remove from wishlist
    del_resp = await async_client.delete(f"/api/v1/prices/wishlist/{product_id}", headers=auth_headers_user1)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["is_wishlisted"] is False

    # 6. Verify empty wishlist
    empty_resp = await async_client.get("/api/v1/prices/wishlist", headers=auth_headers_user1)
    assert len(empty_resp.json()["data"]) == 0


@pytest.mark.asyncio
async def test_price_alerts_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Unauthenticated alert creation rejected
    unauth_resp = await async_client.post("/api/v1/prices/alerts", json={})
    assert unauth_resp.status_code == 401

    # 2. Get product and region IDs
    prod_resp = await async_client.get("/api/v1/prices/products")
    product_id = prod_resp.json()["data"][0]["id"]

    reg_resp = await async_client.get("/api/v1/prices/regions")
    region_id = reg_resp.json()["data"][0]["id"]
    currency_code = reg_resp.json()["data"][0]["currency_code"]

    # 3. Invalid target price (<= 0) rejected
    bad_resp = await async_client.post(
        "/api/v1/prices/alerts",
        json={
            "product_id": product_id,
            "region_id": region_id,
            "target_price": -10.00,
            "currency_code": currency_code
        },
        headers=auth_headers_user1
    )
    assert bad_resp.status_code == 422

    # 4. Create valid alert
    create_resp = await async_client.post(
        "/api/v1/prices/alerts",
        json={
            "product_id": product_id,
            "region_id": region_id,
            "target_price": 4999.00,
            "currency_code": currency_code
        },
        headers=auth_headers_user1
    )
    assert create_resp.status_code == 200
    alert_id = create_resp.json()["data"]["id"]
    assert float(create_resp.json()["data"]["target_price"]) == 4999.00

    # 5. List player alerts
    list_resp = await async_client.get("/api/v1/prices/alerts", headers=auth_headers_user1)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) == 1

    # 6. Update alert target price
    patch_resp = await async_client.patch(
        f"/api/v1/prices/alerts/{alert_id}",
        json={"target_price": 5200.00},
        headers=auth_headers_user1
    )
    assert patch_resp.status_code == 200
    assert float(patch_resp.json()["data"]["target_price"]) == 5200.00

    # 7. Delete alert
    del_resp = await async_client.delete(f"/api/v1/prices/alerts/{alert_id}", headers=auth_headers_user1)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["deleted"] is True


def test_discount_calculation_helper():
    # Regular discount
    disc = calculate_discount_percentage(Decimal("64.99"), Decimal("69.99"))
    assert disc == Decimal("7.14")

    # No discount
    disc_none = calculate_discount_percentage(Decimal("69.99"), None)
    assert disc_none == Decimal("0.00")

    # Original equal to current
    disc_eq = calculate_discount_percentage(Decimal("69.99"), Decimal("69.99"))
    assert disc_eq == Decimal("0.00")

    # Invalid original lower than current
    disc_inv = calculate_discount_percentage(Decimal("69.99"), Decimal("50.00"))
    assert disc_inv == Decimal("0.00")


def test_freshness_status_helper():
    now = datetime.now(timezone.utc)
    recent = now - timedelta(hours=2)
    assert check_verification_status("VERIFIED", recent) == "VERIFIED"

    stale = now - timedelta(hours=80)
    assert check_verification_status("VERIFIED", stale) == "STALE"

    # Statuses preserved
    assert check_verification_status("UNAVAILABLE", recent) == "UNAVAILABLE"
    assert check_verification_status("UNVERIFIED", recent) == "UNVERIFIED"
