import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import (
    Notification,
    NotificationDelivery,
    NotificationPreference,
    PushSubscription,
)
from app.schemas.notification import (
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    NotificationRead,
    PushSubscriptionCreate,
    PushSubscriptionRead,
    UnreadCountResponse,
)


async def get_or_create_preferences(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> NotificationPreference:
    """Retrieves existing notification preferences or creates defaults for player."""
    stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    res = await db.execute(stmt)
    pref = res.scalar_one_or_none()
    if not pref:
        pref = NotificationPreference(
            user_id=user_id,
            in_app_enabled=True,
            email_enabled=True,
            push_enabled=False,
            news_updates=True,
            price_alerts=True,
            event_reminders=True,
            community_activity=True,
            platform_announcements=True,
            default_reminder_minutes=60,
            quiet_hours_enabled=False,
            quiet_hours_start="22:00",
            quiet_hours_end="08:00",
            timezone="UTC",
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref


async def update_player_preferences(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: NotificationPreferencesUpdate,
) -> NotificationPreferencesRead:
    """Updates notification settings for player."""
    pref = await get_or_create_preferences(db, user_id)
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            setattr(pref, field, value)

    await db.commit()
    await db.refresh(pref)

    return NotificationPreferencesRead(
        in_app_enabled=pref.in_app_enabled,
        email_enabled=pref.email_enabled,
        push_enabled=pref.push_enabled,
        news_updates=pref.news_updates,
        price_alerts=pref.price_alerts,
        event_reminders=pref.event_reminders,
        community_activity=pref.community_activity,
        platform_announcements=pref.platform_announcements,
        default_reminder_minutes=pref.default_reminder_minutes,
        quiet_hours_enabled=pref.quiet_hours_enabled,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
        timezone=pref.timezone,
    )


async def create_player_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str,
    reference_id: Optional[str] = None,
    reference_url: Optional[str] = None,
    priority: str = "NORMAL",
) -> Optional[Notification]:
    """
    Creates a notification for a player if allowed by their preferences.
    Dispatches delivery record.
    """
    pref = await get_or_create_preferences(db, user_id)

    # Check preferences
    if not pref.in_app_enabled:
        return None

    if notification_type == "NEWS_UPDATE" and not pref.news_updates:
        return None
    if notification_type == "PRICE_DROP" and not pref.price_alerts:
        return None
    if notification_type in ["EVENT_REMINDER", "EVENT_UPDATE"] and not pref.event_reminders:
        return None
    if notification_type == "COMMUNITY" and not pref.community_activity:
        return None
    if notification_type == "PLATFORM_ANNOUNCEMENT" and not pref.platform_announcements:
        return None

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_id=reference_id,
        reference_url=reference_url,
        priority=priority,
        is_read=False,
    )
    db.add(notif)
    await db.flush()

    delivery = NotificationDelivery(
        notification_id=notif.id,
        channel="IN_APP",
        status="DELIVERED",
        delivered_at=datetime.now(timezone.utc),
    )
    db.add(delivery)
    await db.commit()
    await db.refresh(notif)
    return notif


async def get_player_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[NotificationRead], int]:
    """Retrieves paginated notifications for the player."""
    stmt = select(Notification).where(Notification.user_id == user_id)

    if is_read is not None:
        stmt = stmt.where(Notification.is_read == is_read)

    if notification_type:
        stmt = stmt.where(Notification.notification_type == notification_type.upper())

    stmt = stmt.order_by(Notification.created_at.desc())

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()

    items = [
        NotificationRead(
            id=str(r.id),
            user_id=str(r.user_id),
            title=r.title,
            message=r.message,
            notification_type=r.notification_type,
            reference_id=r.reference_id,
            reference_url=r.reference_url,
            is_read=r.is_read,
            read_at=r.read_at,
            priority=r.priority,
            created_at=r.created_at,
        )
        for r in records
    ]

    return items, total_count


async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> UnreadCountResponse:
    """Calculates total unread notifications and breakdown by notification type."""
    stmt = (
        select(Notification.notification_type, func.count(Notification.id))
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .group_by(Notification.notification_type)
    )
    res = await db.execute(stmt)
    rows = res.all()

    breakdown = {}
    total = 0
    for ntype, count in rows:
        breakdown[ntype] = count
        total += count

    return UnreadCountResponse(total_unread=total, unread_by_type=breakdown)


async def mark_notification_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_id: uuid.UUID,
) -> bool:
    """Marks a single notification as read."""
    now_utc = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True, read_at=now_utc)
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount > 0


async def mark_all_notifications_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Marks all unread notifications for a player as read."""
    now_utc = datetime.now(timezone.utc)
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True, read_at=now_utc)
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount


async def delete_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_id: uuid.UUID,
) -> bool:
    """Deletes/dismisses a single notification."""
    stmt = delete(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount > 0


async def register_push_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: PushSubscriptionCreate,
) -> PushSubscriptionRead:
    """Registers or updates a browser push subscription endpoint."""
    stmt = select(PushSubscription).where(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == data.endpoint,
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.p256dh = data.p256dh
        existing.auth = data.auth
        existing.user_agent = data.user_agent
        existing.is_active = True
        await db.commit()
        await db.refresh(existing)
        return PushSubscriptionRead(
            id=str(existing.id),
            endpoint=existing.endpoint,
            is_active=existing.is_active,
            created_at=existing.created_at,
        )

    sub = PushSubscription(
        user_id=user_id,
        endpoint=data.endpoint,
        p256dh=data.p256dh,
        auth=data.auth,
        user_agent=data.user_agent,
        is_active=True,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    return PushSubscriptionRead(
        id=str(sub.id),
        endpoint=sub.endpoint,
        is_active=sub.is_active,
        created_at=sub.created_at,
    )


async def unsubscribe_push(
    db: AsyncSession,
    user_id: uuid.UUID,
    endpoint: str,
) -> bool:
    """Deactivates a push subscription endpoint."""
    stmt = (
        update(PushSubscription)
        .where(PushSubscription.user_id == user_id, PushSubscription.endpoint == endpoint)
        .values(is_active=False)
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount > 0


async def seed_initial_player_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Seeds starter notifications for newly authenticated players."""
    stmt = select(func.count(Notification.id)).where(Notification.user_id == user_id)
    res = await db.execute(stmt)
    count = res.scalar() or 0
    if count > 0:
        return 0

    starter_notifications = [
        {
            "title": "Welcome to GTA 6 Player Hub",
            "message": "Your player account is active. Explore verified timeline milestones, configure hardware profiles, and track global retailer deals.",
            "notification_type": "PLATFORM_ANNOUNCEMENT",
            "reference_url": "/dashboard",
            "priority": "HIGH",
        },
        {
            "title": "Verified Timeline: Take-Two Q3 Earnings Call",
            "message": "Take-Two Interactive has slated their next financial guidance update for February 2027. Set an event reminder to receive alerts.",
            "notification_type": "EVENT_UPDATE",
            "reference_url": "/events/take-two-q3-fy2027-earnings",
            "priority": "NORMAL",
        },
        {
            "title": "Price Alert Active: PS5 Standard Edition",
            "message": "We are tracking verified pre-order prices across PlayStation Direct, Amazon, and Best Buy for PS5 Standard Edition.",
            "notification_type": "PRICE_DROP",
            "reference_url": "/price-deals",
            "priority": "NORMAL",
        },
        {
            "title": "Official Bulletin: Fall 2025 Release Window Reconfirmed",
            "message": "Rockstar Games reaffirmed the Fall 2025 launch window across PlayStation 5 and Xbox Series X/S.",
            "notification_type": "NEWS_UPDATE",
            "reference_url": "/news",
            "priority": "NORMAL",
        },
    ]

    for item in starter_notifications:
        notif = Notification(
            user_id=user_id,
            title=item["title"],
            message=item["message"],
            notification_type=item["notification_type"],
            reference_url=item["reference_url"],
            priority=item["priority"],
            is_read=False,
        )
        db.add(notif)

    await db.commit()
    return len(starter_notifications)
