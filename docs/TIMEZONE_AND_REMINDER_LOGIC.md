# GTA 6 Player Hub – Timezone and Reminder Logic
## Technical Specification

### 1. Storage & UTC Normalisation

All event start times, end times, and notification timestamps are strictly stored in **UTC (Coordinated Universal Time)** with timezone awareness (`DateTime(timezone=True)`) in PostgreSQL and SQLite.

```python
# Database Model Field Definition
start_time = Column(DateTime(timezone=True), nullable=False, index=True)
```

No wall-clock or localized timestamps are ever stored without explicit UTC normalization.

---

### 2. Timezone Conversion Logic

Server-side conversions utilize Python's standard `zoneinfo.ZoneInfo` combined with `tzdata` to provide IANA timezone conversion that respects Daylight Saving Time (DST) transitions:

```python
from zoneinfo import ZoneInfo
from datetime import datetime, timezone

def format_in_timezone(dt: datetime, tz_name: str = "UTC") -> datetime:
    """Safely converts a UTC datetime to the specified IANA timezone with DST safety."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    try:
        target_tz = ZoneInfo(tz_name)
        return dt.astimezone(target_tz)
    except Exception:
        return dt.astimezone(timezone.utc)
```

**DST Safety**: Because IANA zone identifiers (e.g. `America/New_York`) dynamically adjust between Eastern Standard Time (EST, UTC-5) and Eastern Daylight Time (EDT, UTC-4), scheduling an event months in advance guarantees that the event will fire at the correct local time regardless of DST transitions occurring in between.

---

### 3. Frontend Local Time Rendering

On the client side, Next.js components render timestamps using the browser's native `Intl.DateTimeFormat` and `Date.prototype.toLocaleDateString`:

```typescript
const startDate = new Date(event.start_time);

// Local browser time display
const localDateStr = startDate.toLocaleDateString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const localTimeStr = startDate.toLocaleTimeString(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

// Explicit UTC reference to eliminate global ambiguity
const utcTimeStr = startDate.toUTCString();
```

Both local browser time and universal UTC time are displayed side-by-side in the event detail page (`/events/[slug]`).

---

### 4. Reminder Lead Time Logic

Reminders support configurable intervals:
- `15`: 15 minutes before broadcast (for fast-starting trailer premieres).
- `60`: 1 hour before broadcast (default for earnings calls and industry showcases).
- `1440`: 24 hours before broadcast (for pre-order activations and major events).

#### Automated Reminder Evaluation Loop
```python
async def process_due_reminders(db: AsyncSession):
    now_utc = datetime.now(timezone.utc)
    
    # Query pending reminders where event start_time - lead_time <= now
    stmt = (
        select(EventReminder)
        .join(Event)
        .where(
            EventReminder.is_sent == False,
            Event.start_time - func.make_interval(mins=EventReminder.lead_time_minutes) <= now_utc,
            Event.start_time >= now_utc - timedelta(hours=2) # Grace period
        )
    )
    reminders = (await db.execute(stmt)).scalars().all()
    for rem in reminders:
        await notification_service.create_player_notification(
            db=db,
            user_id=rem.user_id,
            title=f"Reminder: {rem.event.title}",
            message=f"Starting in {rem.lead_time_minutes} minutes. Verified broadcast will begin shortly.",
            notification_type="EVENT_REMINDER",
            reference_id=str(rem.event_id),
            reference_url=f"/events/{rem.event.slug}",
            priority="HIGH"
        )
        rem.is_sent = True
        rem.sent_at = now_utc
        
    await db.commit()
```
