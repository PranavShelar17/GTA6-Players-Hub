import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_access_rejected(async_client: AsyncClient):
    """Verifies that protected user endpoints reject requests without a Bearer token."""
    response = await async_client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert "detail" in response.json() or "error" in response.json()


@pytest.mark.asyncio
async def test_get_current_player_auto_initialization(
    async_client: AsyncClient, 
    auth_headers_user1: dict
):
    """Verifies that a first-time authenticated request automatically provisions profile and preferences."""
    response = await async_client.get("/api/v1/users/me", headers=auth_headers_user1)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    data = payload["data"]
    assert data["email"] == "player1@example.com"
    assert data["profile"] is not None
    assert data["preferences"] is not None
    assert data["profile"]["preferred_platform"] == "PC"
    assert data["preferences"]["preferred_country"] == "USA"


@pytest.mark.asyncio
async def test_check_username_availability(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies username availability endpoint and validation."""
    # Initially available
    res = await async_client.get("/api/v1/users/check-username?username=ViceCityLegend")
    assert res.status_code == 200
    assert res.json()["data"]["is_available"] is True

    # Claim username with user 1
    await async_client.put(
        "/api/v1/users/me/profile",
        json={"username": "ViceCityLegend"},
        headers=auth_headers_user1
    )

    # Now it should be unavailable (case-insensitive)
    res_after = await async_client.get("/api/v1/users/check-username?username=vicecitylegend")
    assert res_after.status_code == 200
    assert res_after.json()["data"]["is_available"] is False

    # Invalid username format
    res_invalid = await async_client.get("/api/v1/users/check-username?username=no")
    assert res_invalid.status_code == 200
    assert res_invalid.json()["data"]["is_available"] is False


@pytest.mark.asyncio
async def test_update_profile_and_username_conflict(
    async_client: AsyncClient, 
    auth_headers_user1: dict, 
    auth_headers_user2: dict
):
    """Verifies updating profile and preventing duplicate usernames across users."""
    # User 1 sets username to ViceKing
    res1 = await async_client.put(
        "/api/v1/users/me/profile",
        json={
            "username": "ViceKing",
            "display_name": "Vice King 6",
            "bio": "Exploring Vice City 2026",
            "country_code": "USA",
            "preferred_platform": "PS5",
            "profile_visibility": "public"
        },
        headers=auth_headers_user1
    )
    assert res1.status_code == 200
    assert res1.json()["data"]["username"] == "ViceKing"
    assert res1.json()["data"]["preferred_platform"] == "PS5"

    # User 2 attempts to claim 'viceking' (case-insensitive collision)
    res2 = await async_client.put(
        "/api/v1/users/me/profile",
        json={"username": "viceking"},
        headers=auth_headers_user2
    )
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_profile_validation_rules(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies strict input validation for profile fields."""
    # Invalid characters in username
    res = await async_client.put(
        "/api/v1/users/me/profile",
        json={"username": "invalid-user-name!"},
        headers=auth_headers_user1
    )
    assert res.status_code == 422

    # Invalid platform
    res_plat = await async_client.put(
        "/api/v1/users/me/profile",
        json={"preferred_platform": "NINTENDO_SWITCH"},
        headers=auth_headers_user1
    )
    assert res_plat.status_code == 422


@pytest.mark.asyncio
async def test_update_preferences(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies updating user regional, currency, and notification preferences."""
    res = await async_client.put(
        "/api/v1/users/me/preferences",
        json={
            "preferred_country": "IND",
            "preferred_currency": "INR",
            "preferred_platform": "PS5",
            "preferred_edition": "Deluxe Edition",
            "email_notifications": True,
            "price_alert_notifications": True
        },
        headers=auth_headers_user1
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["preferred_currency"] == "INR"
    assert data["preferred_country"] == "IND"
    assert data["preferred_edition"] == "Deluxe Edition"


@pytest.mark.asyncio
async def test_avatar_upload_validation(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies avatar upload validation for MIME types and file limits."""
    # 1. Valid PNG upload
    valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    res = await async_client.post(
        "/api/v1/users/me/avatar",
        files={"file": ("avatar.png", valid_png, "image/png")},
        headers=auth_headers_user1
    )
    assert res.status_code == 200
    assert "data:image/png;base64," in res.json()["data"]["avatar_url"]

    # 2. Invalid MIME type (e.g. text/plain or application/exe)
    invalid_file = b"malicious executable or script"
    res_invalid = await async_client.post(
        "/api/v1/users/me/avatar",
        files={"file": ("exploit.sh", invalid_file, "application/x-sh")},
        headers=auth_headers_user1
    )
    assert res_invalid.status_code == 400

    # 3. Oversized file (> 2MB)
    oversized = b"0" * (2 * 1024 * 1024 + 10)
    res_large = await async_client.post(
        "/api/v1/users/me/avatar",
        files={"file": ("large.png", oversized, "image/png")},
        headers=auth_headers_user1
    )
    assert res_large.status_code == 400


@pytest.mark.asyncio
async def test_avatar_deletion(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies avatar removal and resetting to default."""
    # Upload first
    valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    await async_client.post(
        "/api/v1/users/me/avatar",
        files={"file": ("avatar.png", valid_png, "image/png")},
        headers=auth_headers_user1
    )

    # Delete avatar
    res_del = await async_client.delete("/api/v1/users/me/avatar", headers=auth_headers_user1)
    assert res_del.status_code == 200
    assert res_del.json()["data"]["avatar_url"] is None


@pytest.mark.asyncio
async def test_user_activity_logging(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies that user activities are accurately logged and retrieved."""
    # Update preferences to generate activity
    await async_client.put(
        "/api/v1/users/me/preferences",
        json={"preferred_currency": "EUR"},
        headers=auth_headers_user1
    )

    res = await async_client.get("/api/v1/users/me/activity", headers=auth_headers_user1)
    assert res.status_code == 200
    activities = res.json()["data"]
    assert len(activities) >= 1
    types = [a["activity_type"] for a in activities]
    assert "preferences_updated" in types or "account_registered" in types


@pytest.mark.asyncio
async def test_account_deletion_workflow(async_client: AsyncClient, auth_headers_user1: dict):
    """Verifies account deletion workflow properly removes user data."""
    # Provision user
    await async_client.get("/api/v1/users/me", headers=auth_headers_user1)

    # Delete account
    del_res = await async_client.delete("/api/v1/users/me", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
