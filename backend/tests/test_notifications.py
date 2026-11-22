import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_notifications_rejected(async_client: AsyncClient):
    resp = await async_client.get("/api/v1/notifications")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_notifications_seeded_and_list(async_client: AsyncClient, auth_headers_user1: dict):
    resp = await async_client.get("/api/v1/notifications", headers=auth_headers_user1)
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["success"] is True
    notifications = json_data["data"]
    assert len(notifications) >= 3
    types = [n["notification_type"] for n in notifications]
    assert "PLATFORM_ANNOUNCEMENT" in types


@pytest.mark.asyncio
async def test_unread_count_endpoint(async_client: AsyncClient, auth_headers_user1: dict):
    resp = await async_client.get("/api/v1/notifications/unread-count", headers=auth_headers_user1)
    assert resp.status_code == 200
    counts = resp.json()["data"]
    assert counts["total_unread"] >= 1
    assert "unread_by_type" in counts


@pytest.mark.asyncio
async def test_mark_notification_read(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. List notifications
    list_res = await async_client.get("/api/v1/notifications?limit=1", headers=auth_headers_user1)
    notif = list_res.json()["data"][0]
    notif_id = notif["id"]

    # 2. Mark as read
    patch_res = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=auth_headers_user1)
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["marked_as_read"] is True

    # 3. Verify unread count decreased or single item shows read
    verify_res = await async_client.get(f"/api/v1/notifications?limit=5", headers=auth_headers_user1)
    matched = [n for n in verify_res.json()["data"] if n["id"] == notif_id]
    assert len(matched) == 1
    assert matched[0]["is_read"] is True


@pytest.mark.asyncio
async def test_mark_all_notifications_as_read(async_client: AsyncClient, auth_headers_user1: dict):
    # Ensure notifications are seeded first
    list_res = await async_client.get("/api/v1/notifications", headers=auth_headers_user1)
    assert list_res.status_code == 200

    resp = await async_client.post("/api/v1/notifications/mark-all-read", headers=auth_headers_user1)
    assert resp.status_code == 200
    assert "marked_count" in resp.json()["data"]
    assert resp.json()["data"]["marked_count"] >= 1

    # Count should now be 0
    count_res = await async_client.get("/api/v1/notifications/unread-count", headers=auth_headers_user1)
    assert count_res.json()["data"]["total_unread"] == 0


@pytest.mark.asyncio
async def test_delete_notification(async_client: AsyncClient, auth_headers_user1: dict):
    list_res = await async_client.get("/api/v1/notifications?limit=1", headers=auth_headers_user1)
    notif = list_res.json()["data"][0]
    notif_id = notif["id"]

    del_res = await async_client.delete(f"/api/v1/notifications/{notif_id}", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True

    # Cannot delete again (404)
    del_again = await async_client.delete(f"/api/v1/notifications/{notif_id}", headers=auth_headers_user1)
    assert del_again.status_code == 404


@pytest.mark.asyncio
async def test_notification_preferences_get_and_update(async_client: AsyncClient, auth_headers_user1: dict):
    # 1. Get default preferences
    get_res = await async_client.get("/api/v1/notifications/preferences", headers=auth_headers_user1)
    assert get_res.status_code == 200
    prefs = get_res.json()["data"]
    assert prefs["in_app_enabled"] is True
    assert prefs["default_reminder_minutes"] == 60

    # 2. Update preferences
    patch_res = await async_client.patch(
        "/api/v1/notifications/preferences",
        json={
            "quiet_hours_enabled": True,
            "quiet_hours_start": "23:00",
            "quiet_hours_end": "07:00",
            "default_reminder_minutes": 15,
        },
        headers=auth_headers_user1,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()["data"]
    assert updated["quiet_hours_enabled"] is True
    assert updated["quiet_hours_start"] == "23:00"
    assert updated["default_reminder_minutes"] == 15


@pytest.mark.asyncio
async def test_push_subscription_lifecycle(async_client: AsyncClient, auth_headers_user1: dict):
    endpoint = "https://fcm.googleapis.com/fcm/send/test-token-player1"
    sub_res = await async_client.post(
        "/api/v1/notifications/push/subscribe",
        json={
            "endpoint": endpoint,
            "p256dh": "mock-p256dh-key-base64",
            "auth": "mock-auth-secret",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        headers=auth_headers_user1,
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["data"]["is_active"] is True

    # Unsubscribe
    unsub_res = await async_client.delete(
        f"/api/v1/notifications/push/unsubscribe?endpoint={endpoint}",
        headers=auth_headers_user1,
    )
    assert unsub_res.status_code == 200
    assert unsub_res.json()["data"]["unsubscribed"] is True


@pytest.mark.asyncio
async def test_player_notification_isolation(
    async_client: AsyncClient,
    auth_headers_user1: dict,
    auth_headers_user2: dict,
):
    # User 1 has notifications
    u1_res = await async_client.get("/api/v1/notifications", headers=auth_headers_user1)
    u1_notif_id = u1_res.json()["data"][0]["id"]

    # User 2 cannot mark User 1's notification as read
    cross_read = await async_client.patch(
        f"/api/v1/notifications/{u1_notif_id}/read",
        headers=auth_headers_user2,
    )
    assert cross_read.status_code == 404

    # User 2 cannot delete User 1's notification
    cross_del = await async_client.delete(
        f"/api/v1/notifications/{u1_notif_id}",
        headers=auth_headers_user2,
    )
    assert cross_del.status_code == 404
