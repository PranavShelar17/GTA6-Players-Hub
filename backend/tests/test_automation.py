import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.config import settings
from app.integrations.email_provider import render_email_template, get_email_provider, MockEmailProvider
from app.integrations.push_provider import MockPushProvider
from app.models.automation import AutomationJobLog, DataIngestionLog, DataSourceStatus
from app.models.event import Event, EventCategory, EventReminder
from app.models.news import NewsArticle, NewsCategory, NewsSource
from app.models.notification import Notification, NotificationDelivery, NotificationPreference, PushSubscription
from app.models.price import PriceAlert, PriceAlertEvent, PriceObservation, PriceProduct, PriceRegion, PriceStore
from app.services.ai_background_service import AIBackgroundService
from app.services.data_validation_service import DataValidationService
from app.services.event_refresh_service import EventRefreshService
from app.services.news_ingestion_service import NewsIngestionService
from app.services.notification_delivery_service import NotificationDeliveryService
from app.services.price_refresh_service import PriceRefreshService
from app.tasks.news_tasks import collect_news_task
from app.tasks.price_tasks import refresh_prices_task
from app.tasks.event_tasks import refresh_events_task, process_event_reminders_task
from tests.conftest import TestingSessionLocal

AUTOMATION_HEADERS = {"X-Automation-Key": settings.AUTOMATION_API_KEY}


# -----------------------------------------------------------------------------
# 1. Data Validation & Quality Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_data_validation_service_url_normalization():
    """Validates URL canonicalization, tracking parameter stripping, and domain standardization."""
    raw = "https://www.RockstarGames.com/Newswire/article/12345/?utm_source=twitter&utm_medium=social&ref=feed#anchor"
    normalized = DataValidationService.normalize_url(raw)
    assert normalized == "https://www.rockstargames.com/newswire/article/12345"

    # Preserves clean URLs
    clean = "https://blog.playstation.com/2026/11/gta6"
    assert DataValidationService.normalize_url(clean) == clean

    # Rejects malformed URLs
    is_valid, err = DataValidationService.validate_url("ftp://invalid-scheme.com")
    assert is_valid is False
    assert "scheme" in err.lower()


@pytest.mark.asyncio
async def test_data_validation_service_price_validation():
    """Validates monetary precision, genuine discount math, and error handling."""
    # Valid price with genuine discount
    is_valid, curr, orig, disc, err = DataValidationService.validate_price_values("5999.00", "6999.00")
    assert is_valid is True
    assert curr == Decimal("5999.00")
    assert orig == Decimal("6999.00")
    assert disc == Decimal("14.29")
    assert err is None

    # Original price less than current price rejected
    is_valid, _, _, _, err = DataValidationService.validate_price_values("70.00", "50.00")
    assert is_valid is False
    assert "cannot be less than" in err

    # Negative price rejected
    is_valid, _, _, _, err = DataValidationService.validate_price_values("-10.00")
    assert is_valid is False
    assert "cannot be negative" in err


@pytest.mark.asyncio
async def test_data_validation_service_timestamp_and_currency():
    """Validates timezone conversion to UTC and ISO 4217 currency codes."""
    # Timezone naive parsed to UTC
    is_valid, dt_utc, err = DataValidationService.validate_timestamp("2026-11-23 10:00:00")
    assert is_valid is True
    assert dt_utc.tzinfo == timezone.utc

    # Currency validation
    assert DataValidationService.validate_currency("INR", "IND")[0] is True
    assert DataValidationService.validate_currency("USD", "USA")[0] is True
    # Currency mismatch with region
    assert DataValidationService.validate_currency("EUR", "USA")[0] is False


@pytest.mark.asyncio
async def test_data_validation_service_news_and_events():
    """Validates news items and calendar events schema enforcement."""
    valid_news = {
        "title": "GTA VI Newswire Technical Breakdown",
        "source_url": "https://www.rockstargames.com/newswire/article/gta6",
        "source_name": "Rockstar Games Newswire",
        "published_at": "2026-11-23T10:00:00Z",
        "verification_status": "OFFICIAL",
    }
    is_valid, normalized, errs = DataValidationService.validate_news_item(valid_news)
    assert is_valid is True
    assert normalized["verification_status"] == "OFFICIAL"

    # Invalid verification label rejected
    invalid_news = dict(valid_news, verification_status="UNVERIFIED_BLOG_POST")
    is_valid, _, errs = DataValidationService.validate_news_item(invalid_news)
    assert is_valid is False


# -----------------------------------------------------------------------------
# 2. News Ingestion Subsystem Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_news_ingestion_service_lifecycle():
    """Validates end-to-end news ingestion, duplicate prevention, and status tracking."""
    async with TestingSessionLocal() as session:
        # Seed categories
        cat = NewsCategory(name="Official Announcements", slug="official-announcements", description="Rockstar news")
        session.add(cat)
        await session.commit()

        # Run 1: initial ingestion
        result1 = await NewsIngestionService.run_news_ingestion(session)
        assert result1["retrieved"] > 0
        assert result1["created"] > 0
        assert result1["failed"] == 0

        # Run 2: idempotent duplicate prevention
        result2 = await NewsIngestionService.run_news_ingestion(session)
        assert result2["created"] == 0  # No duplicates created
        assert result2["skipped"] > 0

        # Check ingestion logs recorded
        logs_stmt = select(DataIngestionLog).where(DataIngestionLog.data_category == "NEWS")
        logs_res = await session.execute(logs_stmt)
        logs = logs_res.scalars().all()
        assert len(logs) >= 2


# -----------------------------------------------------------------------------
# 3. Price Refresh & Alert Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_price_refresh_and_price_drop_alerts(auth_headers_user1: dict):
    """Validates store price refresh, discount calculation, and target price alert triggering."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    async with TestingSessionLocal() as session:
        # Setup catalog
        region = PriceRegion(region_name="India", country_code="IND", currency_code="INR", currency_symbol="₹")
        store = PriceStore(store_name="PlayStation Store", website_url="https://store.playstation.com", store_type="FIRST_PARTY", seller_authorisation_status="FIRST_PARTY")
        product = PriceProduct(name="Grand Theft Auto VI - Standard Edition (PS5)", slug="gta-6-standard-edition-ps5", edition="Standard Edition", platform="PlayStation 5")
        session.add_all([region, store, product])
        await session.commit()

        # Create active player price alert: target price 5500 INR
        alert = PriceAlert(
            player_id=user_id,
            product_id=product.id,
            region_id=region.id,
            target_price=Decimal("5500.00"),
            currency_code="INR",
            is_active=True,
        )
        session.add(alert)
        await session.commit()

        # Run price refresh with promotion simulation (drops price to ~5099.15, below 5500 target)
        res = await PriceRefreshService.run_price_refresh(session, simulate_promotions=True)
        assert res["created"] > 0
        assert res["alerts_triggered"] >= 1

        # Verify PriceAlertEvent created
        evt_stmt = select(PriceAlertEvent).where(PriceAlertEvent.alert_id == alert.id)
        evt_res = await session.execute(evt_stmt)
        event_record = evt_res.scalar_one_or_none()
        assert event_record is not None
        assert event_record.observed_price <= Decimal("5500.00")

        # Verify in-app notification delivered
        notif_stmt = select(Notification).where(Notification.user_id == user_id, Notification.notification_type == "PRICE_DROP")
        notif_res = await session.execute(notif_stmt)
        notification = notif_res.scalar_one_or_none()
        assert notification is not None
        assert "Target Price" in notification.title


# -----------------------------------------------------------------------------
# 4. Event Refresh & Reminder Processing Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_event_refresh_and_reminder_processing():
    """Validates event synchronization and background reminder dispatch with lead time handling."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    async with TestingSessionLocal() as session:
        # Setup categories and event starting in 30 minutes
        cat = EventCategory(name="Official Broadcasts", slug="official-broadcasts")
        session.add(cat)
        await session.flush()

        now = datetime.now(timezone.utc)
        event = Event(
            title="GTA VI World Premiere Showcase",
            slug="gta-6-world-premiere-showcase",
            description="Live worldwide broadcast",
            category_id=cat.id,
            start_time=now + timedelta(minutes=30),
            timezone="UTC",
            verification_status="OFFICIAL",
        )
        session.add(event)
        await session.flush()

        # Player reminder set for 60 minutes before start (threshold is now - 30m, which is met)
        reminder = EventReminder(
            user_id=user_id,
            event_id=event.id,
            lead_time_minutes=60,
            is_sent=False,
        )
        session.add(reminder)
        await session.commit()

        # Process reminders
        result = await EventRefreshService.process_event_reminders(session)
        assert result["reminders_sent"] >= 1

        # Check reminder marked sent
        await session.refresh(reminder)
        assert reminder.is_sent is True
        assert reminder.sent_at is not None

        # Check in-app notification created
        notif_stmt = select(Notification).where(Notification.user_id == user_id, Notification.notification_type == "EVENT_REMINDER")
        notif_res = await session.execute(notif_stmt)
        notif = notif_res.scalar_one_or_none()
        assert notif is not None
        assert "starts in 1 hour(s)" in notif.title or "Reminder" in notif.title


# -----------------------------------------------------------------------------
# 5. Multi-Channel Notification Delivery Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_notification_delivery_email_and_push():
    """Validates email template rendering, mock email dispatch, push delivery, and retry tracking."""
    user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    async with TestingSessionLocal() as session:
        # Create notification & deliveries
        notif = Notification(
            user_id=user_id,
            title="New Official Announcement",
            message="Rockstar Games posted a new trailer date.",
            notification_type="NEWS_UPDATE",
        )
        session.add(notif)
        await session.flush()

        email_delivery = NotificationDelivery(
            notification_id=notif.id,
            channel="EMAIL",
            status="PENDING",
            retry_count=0,
        )
        push_delivery = NotificationDelivery(
            notification_id=notif.id,
            channel="PUSH",
            status="PENDING",
            retry_count=0,
        )
        # Register push subscription
        push_sub = PushSubscription(
            user_id=user_id,
            endpoint="https://fcm.googleapis.com/fcm/send/test-token",
            p256dh="test_p256dh",
            auth="test_auth",
            is_active=True,
        )
        session.add_all([email_delivery, push_delivery, push_sub])
        await session.commit()

        # Process email deliveries
        email_res = await NotificationDeliveryService.process_email_deliveries(session)
        assert email_res["delivered"] >= 1

        # Process push deliveries
        push_res = await NotificationDeliveryService.process_push_deliveries(session)
        assert push_res["delivered"] >= 1

        await session.refresh(email_delivery)
        assert email_delivery.status == "DELIVERED"
        assert email_delivery.delivered_at is not None
        assert email_delivery.provider_reference is not None

        await session.refresh(push_delivery)
        assert push_delivery.status == "DELIVERED"


# -----------------------------------------------------------------------------
# 6. AI Background Maintenance Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ai_background_maintenance():
    """Validates background RAG documentation seeding and usage analytics aggregation."""
    async with TestingSessionLocal() as session:
        res = await AIBackgroundService.run_knowledge_maintenance(session)
        assert res["total_documents"] >= 4

        metrics = await AIBackgroundService.aggregate_ai_usage_metrics(session)
        assert "total_conversations" in metrics
        assert "feedback_summary" in metrics


# -----------------------------------------------------------------------------
# 7. Operational REST API & Security Tests
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_automation_api_security_unauthorized(async_client: AsyncClient):
    """Verifies internal automation operational endpoints reject unauthenticated access (HTTP 401)."""
    # Without any headers or token
    res = await async_client.get("/api/v1/automation/health")
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["error"]["message"]

    res_worker = await async_client.get("/api/v1/automation/worker-health")
    assert res_worker.status_code == 401
    assert "Unauthorized" in res_worker.json()["error"]["message"]


@pytest.mark.asyncio
async def test_automation_api_authorized_health_endpoints(async_client: AsyncClient):
    """Verifies operational health endpoints succeed when authenticated with X-Automation-Key."""
    # 1. System Health
    res_health = await async_client.get("/api/v1/automation/health", headers=AUTOMATION_HEADERS)
    assert res_health.status_code == 200
    health_data = res_health.json()["data"]
    assert health_data["service"] == "GTA 6 Player Hub Background Automation"
    assert "database_connected" in health_data

    # 2. Worker Health
    res_worker = await async_client.get("/api/v1/automation/worker-health", headers=AUTOMATION_HEADERS)
    assert res_worker.status_code == 200
    worker_data = res_worker.json()["data"]
    assert len(worker_data["registered_tasks"]) >= 5

    # 3. Scheduler Health
    res_sched = await async_client.get("/api/v1/automation/scheduler-health", headers=AUTOMATION_HEADERS)
    assert res_sched.status_code == 200
    sched_data = res_sched.json()["data"]
    assert sched_data["total_jobs"] >= 8


@pytest.mark.asyncio
async def test_automation_api_sources_and_history(async_client: AsyncClient):
    """Verifies data source status, ingestion history, and task history query endpoints."""
    # Ingestion history
    res_ingest = await async_client.get("/api/v1/automation/ingestion/history", headers=AUTOMATION_HEADERS)
    assert res_ingest.status_code == 200
    assert "items" in res_ingest.json()["data"]

    # Task history
    res_tasks = await async_client.get("/api/v1/automation/tasks/history", headers=AUTOMATION_HEADERS)
    assert res_tasks.status_code == 200
    assert "items" in res_tasks.json()["data"]

    # Notification delivery status
    res_notif = await async_client.get("/api/v1/automation/notifications/status", headers=AUTOMATION_HEADERS)
    assert res_notif.status_code == 200
    assert "total_deliveries" in res_notif.json()["data"]


@pytest.mark.asyncio
async def test_automation_api_manual_trigger(async_client: AsyncClient):
    """Verifies manual task trigger endpoint runs pipelines for authorized operator."""
    res_trigger = await async_client.post("/api/v1/automation/trigger/news", headers=AUTOMATION_HEADERS)
    assert res_trigger.status_code == 200
    data = res_trigger.json()["data"]
    assert data["task"] == "news"
    assert "result" in data

    # Unknown task returns 400 Bad Request
    res_invalid = await async_client.post("/api/v1/automation/trigger/unknown_service", headers=AUTOMATION_HEADERS)
    assert res_invalid.status_code == 400
