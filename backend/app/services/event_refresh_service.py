import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.integrations.event_sources import EventSourceConnector
from app.models.automation import DataIngestionLog, DataSourceStatus
from app.models.event import Event, EventCategory, EventReminder, EventSource
from app.services.data_validation_service import DataValidationService
from app.services.notification_service import create_player_notification


class EventRefreshService:
    """Service orchestrating automated event calendar synchronization and background reminder dispatch."""

    @staticmethod
    async def run_event_refresh(session: AsyncSession) -> Dict[str, Any]:
        """Refreshes official GTA 6 calendar events and broadcasts from authoritative sources."""
        connector = EventSourceConnector()
        now = datetime.now(timezone.utc)
        total_retrieved = 0
        total_created = 0
        total_updated = 0
        total_failed = 0

        # Query categories
        cat_map: Dict[str, uuid.UUID] = {}
        cat_res = await session.execute(select(EventCategory))
        for c in cat_res.scalars().all():
            cat_map[c.slug] = c.id

        if not cat_map:
            for cat_name, cat_slug, cat_desc in [
                ("Official Broadcasts", "official-broadcasts", "Rockstar Games livestreams and official announcements"),
                ("Industry Showcases", "industry-showcases", "PlayStation, Xbox, and Summer Game Fest showcases"),
                ("Community Milestones", "community-milestones", "Player summits and community anniversary celebrations"),
            ]:
                new_cat = EventCategory(name=cat_name, slug=cat_slug, description=cat_desc)
                session.add(new_cat)
                await session.flush()
                cat_map[cat_slug] = new_cat.id

        default_cat_id = next(iter(cat_map.values()), None)

        ingestion_log = DataIngestionLog(
            source_id="Event Calendar Feeds",
            data_category="EVENTS",
            started_at=now,
            status="RUNNING",
        )
        session.add(ingestion_log)
        await session.flush()

        src_status_stmt = select(DataSourceStatus).where(
            DataSourceStatus.source_name == "Event Calendar Feeds"
        )
        src_status_res = await session.execute(src_status_stmt)
        src_status = src_status_res.scalar_one_or_none()
        if not src_status:
            src_status = DataSourceStatus(
                source_name="Event Calendar Feeds",
                source_type="EVENTS",
                source_url="https://www.rockstargames.com/newswire",
                health_status="HEALTHY",
                created_at=now,
                updated_at=now,
            )
            session.add(src_status)
            await session.flush()

        src_status.last_attempted_at = now

        try:
            raw_events = await connector.fetch_scheduled_events()
            ingestion_log.records_retrieved = len(raw_events)
            total_retrieved = len(raw_events)

            for item in raw_events:
                is_valid, normalized, errs = DataValidationService.validate_event_item(item)
                if not is_valid:
                    ingestion_log.records_failed += 1
                    total_failed += 1
                    logger.warning(f"Event validation failed: {errs}")
                    continue

                slug = normalized["slug"]
                existing_stmt = select(Event).where(Event.slug == slug)
                existing_res = await session.execute(existing_stmt)
                existing_event = existing_res.scalar_one_or_none()

                cat_id = cat_map.get(normalized["category_slug"], default_cat_id)

                if existing_event:
                    # Update fields, detect schedule adjustments or cancellations
                    existing_event.start_time = normalized["start_time"]
                    existing_event.end_time = normalized["end_time"]
                    existing_event.description = normalized["description"]
                    existing_event.short_summary = normalized["short_summary"]
                    existing_event.stream_url = normalized["stream_url"]
                    existing_event.event_url = normalized["event_url"]
                    existing_event.is_cancelled = normalized["is_cancelled"]
                    existing_event.updated_at = now
                    ingestion_log.records_updated += 1
                    total_updated += 1
                else:
                    new_event = Event(
                        title=normalized["title"],
                        slug=slug,
                        description=normalized["description"],
                        short_summary=normalized["short_summary"],
                        category_id=cat_id,
                        start_time=normalized["start_time"],
                        end_time=normalized["end_time"],
                        timezone=normalized["timezone"],
                        location_type=normalized["location_type"],
                        location_name=normalized["location_name"],
                        event_url=normalized["event_url"],
                        stream_url=normalized["stream_url"],
                        verification_status=normalized["verification_status"],
                        organizer_name=normalized.get("organizer_name", "Rockstar Games"),
                        is_featured=True,
                        is_cancelled=normalized["is_cancelled"],
                    )
                    session.add(new_event)
                    ingestion_log.records_created += 1
                    total_created += 1

            src_status.last_successful_at = now
            src_status.last_error = None
            src_status.health_status = "HEALTHY"
            ingestion_log.status = "SUCCESS"

        except Exception as evt_err:
            logger.error(f"Error synchronizing event calendar: {evt_err}")
            src_status.last_error = str(evt_err)
            src_status.health_status = "DEGRADED"
            ingestion_log.status = "FAILED"
            ingestion_log.records_failed += 1
            total_failed += 1

        ingestion_log.completed_at = datetime.now(timezone.utc)
        await session.commit()

        return {
            "retrieved": total_retrieved,
            "created": total_created,
            "updated": total_updated,
            "failed": total_failed,
            "timestamp": now.isoformat(),
        }

    @staticmethod
    async def process_event_reminders(session: AsyncSession) -> Dict[str, Any]:
        """
        Processes pending event reminders and dispatches notifications when lead time threshold is met.
        Ensures idempotency, no duplicate notifications, and handles cancelled events properly.
        """
        now = datetime.now(timezone.utc)
        reminders_sent = 0
        reminders_skipped = 0

        # Query un-sent reminders joined with their Event
        stmt = (
            select(EventReminder)
            .options(selectinload(EventReminder.event))
            .where(EventReminder.is_sent.is_(False))
        )
        res = await session.execute(stmt)
        pending_reminders = res.scalars().all()

        for reminder in pending_reminders:
            event = reminder.event
            if not event:
                reminder.is_sent = True
                continue

            # If event is cancelled, do not dispatch reminder; mark as handled
            if event.is_cancelled:
                reminder.is_sent = True
                reminder.sent_at = now
                reminders_skipped += 1
                continue

            lead_minutes = reminder.lead_time_minutes or 60
            threshold_time = event.start_time - timedelta(minutes=lead_minutes)

            # Check if reminder lead time has arrived and event is upcoming or live
            if now >= threshold_time:
                # Format friendly reminder timing text
                if lead_minutes >= 1440:
                    time_desc = f"{lead_minutes // 1440} day(s)"
                elif lead_minutes >= 60:
                    time_desc = f"{lead_minutes // 60} hour(s)"
                else:
                    time_desc = f"{lead_minutes} minutes"

                title = f"Reminder: {event.title} starts in {time_desc}!"
                message = (
                    f"The event '{event.title}' is scheduled to begin at "
                    f"{event.start_time.strftime('%Y-%m-%d %H:%M UTC')}. "
                    f"Tune in via: {event.stream_url or event.event_url or '/events/' + event.slug}"
                )

                await create_player_notification(
                    db=session,
                    user_id=reminder.user_id,
                    title=title,
                    message=message,
                    notification_type="EVENT_REMINDER",
                    reference_id=str(event.id),
                    reference_url=f"/events/{event.slug}",
                    priority="HIGH",
                )

                reminder.is_sent = True
                reminder.sent_at = now
                reminders_sent += 1
            else:
                reminders_skipped += 1

        await session.commit()

        return {
            "total_pending_evaluated": len(pending_reminders),
            "reminders_sent": reminders_sent,
            "reminders_skipped": reminders_skipped,
            "timestamp": now.isoformat(),
        }
