import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from zoneinfo import ZoneInfo
from sqlalchemy import delete, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventCategory, EventReminder, EventSource, SavedEvent
from app.schemas.event import (
    EventDetail,
    EventListItem,
    EventReminderCreate,
    EventReminderRead,
    SavedEventRead,
)


def format_in_timezone(dt: datetime, tz_name: str = "UTC") -> datetime:
    """Safely converts a UTC datetime to the specified IANA timezone."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    try:
        target_tz = ZoneInfo(tz_name)
        return dt.astimezone(target_tz)
    except Exception:
        return dt.astimezone(timezone.utc)


async def get_event_categories(db: AsyncSession) -> List[dict]:
    """Retrieves all active event categories with event counts."""
    stmt = (
        select(EventCategory, func.count(Event.id).label("events_count"))
        .outerjoin(Event, Event.category_id == EventCategory.id)
        .where(EventCategory.is_active == True)
        .group_by(EventCategory.id)
        .order_by(EventCategory.name.asc())
    )
    result = await db.execute(stmt)
    categories = []
    for cat, count in result.all():
        categories.append({
            "id": str(cat.id),
            "name": cat.name,
            "slug": cat.slug,
            "description": cat.description,
            "icon": cat.icon or "calendar",
            "color": cat.color or "#f97316",
            "is_active": cat.is_active,
            "events_count": count,
        })
    return categories


async def get_events(
    db: AsyncSession,
    user_id: Optional[uuid.UUID] = None,
    category_slug: Optional[str] = None,
    verification_status: Optional[str] = None,
    timeframe: Optional[str] = "upcoming",  # upcoming, past, all
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[EventListItem], int]:
    """
    Retrieves events filtered by category, status, timeframe, and search term.
    Includes player saved status and reminder status if user_id is provided.
    """
    now_utc = datetime.now(timezone.utc)
    stmt = (
        select(Event)
        .options(selectinload(Event.category), selectinload(Event.source))
    )

    if category_slug:
        stmt = stmt.join(EventCategory).where(EventCategory.slug == category_slug)

    if verification_status:
        stmt = stmt.where(Event.verification_status == verification_status.upper())

    if timeframe == "upcoming":
        stmt = stmt.where(Event.start_time >= now_utc)
        stmt = stmt.order_by(Event.start_time.asc())
    elif timeframe == "past":
        stmt = stmt.where(Event.start_time < now_utc)
        stmt = stmt.order_by(Event.start_time.desc())
    else:
        stmt = stmt.order_by(Event.start_time.asc())

    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                Event.title.ilike(search_filter),
                Event.description.ilike(search_filter),
                Event.short_summary.ilike(search_filter),
                Event.organizer_name.ilike(search_filter),
            )
        )

    # Count query
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    events = res.scalars().all()

    # Get user saved events & reminders set
    saved_event_ids = set()
    reminder_event_ids = set()
    if user_id:
        saved_stmt = select(SavedEvent.event_id).where(SavedEvent.user_id == user_id)
        saved_res = await db.execute(saved_stmt)
        saved_event_ids = set(saved_res.scalars().all())

        rem_stmt = select(EventReminder.event_id).where(EventReminder.user_id == user_id)
        rem_res = await db.execute(rem_stmt)
        reminder_event_ids = set(rem_res.scalars().all())

    items = []
    for ev in events:
        items.append(
            EventListItem(
                id=str(ev.id),
                title=ev.title,
                slug=ev.slug,
                description=ev.description,
                short_summary=ev.short_summary,
                category_id=str(ev.category_id),
                category_name=ev.category.name if ev.category else "General",
                category_slug=ev.category.slug if ev.category else "general",
                category_color=ev.category.color if ev.category else "#f97316",
                source_id=str(ev.source_id) if ev.source_id else None,
                source_name=ev.source.name if ev.source else None,
                source_url=ev.source.website_url if ev.source else None,
                start_time=ev.start_time,
                end_time=ev.end_time,
                timezone=ev.timezone,
                location_type=ev.location_type,
                location_name=ev.location_name,
                event_url=ev.event_url,
                stream_url=ev.stream_url,
                verification_status=ev.verification_status,
                is_featured=ev.is_featured,
                is_cancelled=ev.is_cancelled,
                banner_image_url=ev.banner_image_url,
                organizer_name=ev.organizer_name,
                tags=ev.tags,
                is_saved=ev.id in saved_event_ids,
                has_reminder=ev.id in reminder_event_ids,
                reminders_count=0,
            )
        )

    return items, total_count


async def get_event_by_slug(
    db: AsyncSession,
    slug: str,
    user_id: Optional[uuid.UUID] = None,
) -> Optional[EventDetail]:
    """Retrieves an event by slug along with related events and user reminders."""
    stmt = (
        select(Event)
        .options(selectinload(Event.category), selectinload(Event.source))
        .where(Event.slug == slug)
    )
    res = await db.execute(stmt)
    ev = res.scalar_one_or_none()
    if not ev:
        return None

    is_saved = False
    has_reminder = False
    user_reminders: List[EventReminderRead] = []

    if user_id:
        saved_stmt = select(SavedEvent).where(
            SavedEvent.user_id == user_id, SavedEvent.event_id == ev.id
        )
        saved_res = await db.execute(saved_stmt)
        is_saved = saved_res.scalar_one_or_none() is not None

        rem_stmt = select(EventReminder).where(
            EventReminder.user_id == user_id, EventReminder.event_id == ev.id
        )
        rem_res = await db.execute(rem_stmt)
        rem_records = rem_res.scalars().all()
        has_reminder = len(rem_records) > 0
        for r in rem_records:
            user_reminders.append(
                EventReminderRead(
                    id=str(r.id),
                    user_id=str(r.user_id),
                    event_id=str(r.event_id),
                    lead_time_minutes=r.lead_time_minutes,
                    channel=r.channel,
                    is_sent=r.is_sent,
                    sent_at=r.sent_at,
                    created_at=r.created_at,
                    event_title=ev.title,
                    event_slug=ev.slug,
                    event_start_time=ev.start_time,
                )
            )

    # Fetch 3 related events in same category
    rel_stmt = (
        select(Event)
        .options(selectinload(Event.category), selectinload(Event.source))
        .where(Event.category_id == ev.category_id, Event.id != ev.id)
        .order_by(Event.start_time.asc())
        .limit(3)
    )
    rel_res = await db.execute(rel_stmt)
    rel_events = rel_res.scalars().all()
    related_items = [
        EventListItem(
            id=str(r.id),
            title=r.title,
            slug=r.slug,
            description=r.description,
            short_summary=r.short_summary,
            category_id=str(r.category_id),
            category_name=r.category.name if r.category else "General",
            category_slug=r.category.slug if r.category else "general",
            category_color=r.category.color if r.category else "#f97316",
            source_id=str(r.source_id) if r.source_id else None,
            source_name=r.source.name if r.source else None,
            source_url=r.source.website_url if r.source else None,
            start_time=r.start_time,
            end_time=r.end_time,
            timezone=r.timezone,
            location_type=r.location_type,
            location_name=r.location_name,
            event_url=r.event_url,
            stream_url=r.stream_url,
            verification_status=r.verification_status,
            is_featured=r.is_featured,
            is_cancelled=r.is_cancelled,
            banner_image_url=r.banner_image_url,
            organizer_name=r.organizer_name,
            tags=r.tags,
            is_saved=False,
            has_reminder=False,
            reminders_count=0,
        )
        for r in rel_events
    ]

    return EventDetail(
        id=str(ev.id),
        title=ev.title,
        slug=ev.slug,
        description=ev.description,
        short_summary=ev.short_summary,
        category_id=str(ev.category_id),
        category_name=ev.category.name if ev.category else "General",
        category_slug=ev.category.slug if ev.category else "general",
        category_color=ev.category.color if ev.category else "#f97316",
        source_id=str(ev.source_id) if ev.source_id else None,
        source_name=ev.source.name if ev.source else None,
        source_url=ev.source.website_url if ev.source else None,
        start_time=ev.start_time,
        end_time=ev.end_time,
        timezone=ev.timezone,
        location_type=ev.location_type,
        location_name=ev.location_name,
        event_url=ev.event_url,
        stream_url=ev.stream_url,
        verification_status=ev.verification_status,
        is_featured=ev.is_featured,
        is_cancelled=ev.is_cancelled,
        banner_image_url=ev.banner_image_url,
        organizer_name=ev.organizer_name,
        tags=ev.tags,
        is_saved=is_saved,
        has_reminder=has_reminder,
        reminders_count=len(user_reminders),
        reminders=user_reminders,
        related_events=related_items,
    )


async def toggle_save_event(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    notes: Optional[str] = None,
) -> Tuple[bool, str]:
    """Saves or unsaves an event for a player. Returns (is_saved, message)."""
    ev_stmt = select(Event).where(Event.id == event_id)
    ev_res = await db.execute(ev_stmt)
    event = ev_res.scalar_one_or_none()
    if not event:
        raise ValueError("Event not found.")

    saved_stmt = select(SavedEvent).where(
        SavedEvent.user_id == user_id, SavedEvent.event_id == event_id
    )
    saved_res = await db.execute(saved_stmt)
    existing = saved_res.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return False, "Event removed from saved events."
    else:
        new_save = SavedEvent(
            user_id=user_id,
            event_id=event_id,
            notes=notes,
        )
        db.add(new_save)
        await db.commit()
        return True, "Event successfully saved to your calendar."


async def get_player_saved_events(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> List[SavedEventRead]:
    """Retrieves all events saved by the authenticated player."""
    stmt = (
        select(SavedEvent)
        .options(
            selectinload(SavedEvent.event).selectinload(Event.category),
            selectinload(SavedEvent.event).selectinload(Event.source),
        )
        .where(SavedEvent.user_id == user_id)
        .order_by(SavedEvent.created_at.desc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    items = []
    for r in records:
        ev = r.event
        event_item = None
        if ev:
            event_item = EventListItem(
                id=str(ev.id),
                title=ev.title,
                slug=ev.slug,
                description=ev.description,
                short_summary=ev.short_summary,
                category_id=str(ev.category_id),
                category_name=ev.category.name if ev.category else "General",
                category_slug=ev.category.slug if ev.category else "general",
                category_color=ev.category.color if ev.category else "#f97316",
                source_id=str(ev.source_id) if ev.source_id else None,
                source_name=ev.source.name if ev.source else None,
                source_url=ev.source.website_url if ev.source else None,
                start_time=ev.start_time,
                end_time=ev.end_time,
                timezone=ev.timezone,
                location_type=ev.location_type,
                location_name=ev.location_name,
                event_url=ev.event_url,
                stream_url=ev.stream_url,
                verification_status=ev.verification_status,
                is_featured=ev.is_featured,
                is_cancelled=ev.is_cancelled,
                banner_image_url=ev.banner_image_url,
                organizer_name=ev.organizer_name,
                tags=ev.tags,
                is_saved=True,
                has_reminder=False,
                reminders_count=0,
            )

        items.append(
            SavedEventRead(
                id=str(r.id),
                user_id=str(r.user_id),
                event_id=str(r.event_id),
                notes=r.notes,
                created_at=r.created_at,
                event=event_item,
            )
        )
    return items


async def create_event_reminder(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    data: EventReminderCreate,
) -> EventReminderRead:
    """Sets a reminder for an upcoming event."""
    ev_stmt = select(Event).where(Event.id == event_id)
    ev_res = await db.execute(ev_stmt)
    event = ev_res.scalar_one_or_none()
    if not event:
        raise ValueError("Event not found.")

    # Check for existing duplicate reminder
    dup_stmt = select(EventReminder).where(
        EventReminder.user_id == user_id,
        EventReminder.event_id == event_id,
        EventReminder.lead_time_minutes == data.lead_time_minutes,
        EventReminder.channel == data.channel.upper(),
    )
    dup_res = await db.execute(dup_stmt)
    existing = dup_res.scalar_one_or_none()
    if existing:
        return EventReminderRead(
            id=str(existing.id),
            user_id=str(existing.user_id),
            event_id=str(existing.event_id),
            lead_time_minutes=existing.lead_time_minutes,
            channel=existing.channel,
            is_sent=existing.is_sent,
            sent_at=existing.sent_at,
            created_at=existing.created_at,
            event_title=event.title,
            event_slug=event.slug,
            event_start_time=event.start_time,
        )

    reminder = EventReminder(
        user_id=user_id,
        event_id=event_id,
        lead_time_minutes=data.lead_time_minutes,
        channel=data.channel.upper(),
        is_sent=False,
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)

    return EventReminderRead(
        id=str(reminder.id),
        user_id=str(reminder.user_id),
        event_id=str(reminder.event_id),
        lead_time_minutes=reminder.lead_time_minutes,
        channel=reminder.channel,
        is_sent=reminder.is_sent,
        sent_at=reminder.sent_at,
        created_at=reminder.created_at,
        event_title=event.title,
        event_slug=event.slug,
        event_start_time=event.start_time,
    )


async def delete_event_reminder(
    db: AsyncSession,
    user_id: uuid.UUID,
    reminder_id: uuid.UUID,
) -> bool:
    """Deletes an event reminder."""
    stmt = delete(EventReminder).where(
        EventReminder.id == reminder_id, EventReminder.user_id == user_id
    )
    res = await db.execute(stmt)
    await db.commit()
    return res.rowcount > 0


async def get_player_event_reminders(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> List[EventReminderRead]:
    """Lists all upcoming event reminders for the player."""
    stmt = (
        select(EventReminder)
        .options(selectinload(EventReminder.event))
        .where(EventReminder.user_id == user_id)
        .order_by(EventReminder.created_at.desc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    items = []
    for r in records:
        items.append(
            EventReminderRead(
                id=str(r.id),
                user_id=str(r.user_id),
                event_id=str(r.event_id),
                lead_time_minutes=r.lead_time_minutes,
                channel=r.channel,
                is_sent=r.is_sent,
                sent_at=r.sent_at,
                created_at=r.created_at,
                event_title=r.event.title if r.event else None,
                event_slug=r.event.slug if r.event else None,
                event_start_time=r.event.start_time if r.event else None,
            )
        )
    return items
