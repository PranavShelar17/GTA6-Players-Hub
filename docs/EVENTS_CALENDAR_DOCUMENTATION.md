# GTA 6 Player Hub – Events Calendar Documentation
## Phase 6 Architecture & Operational Specification

### 1. Overview
The Events Calendar is an interactive, verified timeline tracking system designed for Grand Theft Auto VI release planning, corporate earnings calls, trailer debuts, industry gaming showcases, and community milestones.

It eliminates speculative rumours and fake countdown clocks by enforcing strict truth classification standards and locking event timestamps to UTC with automatic client-side timezone rendering.

---

### 2. Verification Badges & Trust Hierarchy

Every event in the system is labeled with one of four verification classifications:

| Level | Badge Label | Color Code | Criteria & Authorisation |
|---|---|---|---|
| **Tier 1** | `OFFICIAL` | Gold / Amber (`#f59e0b`) | Direct disclosure from Rockstar Games or Take-Two Interactive SEC filings. |
| **Tier 2** | `VERIFIED` | Emerald (`#10b981`) | Verified third-party industry events (e.g. Summer Game Fest, Sony State of Play). |
| **Tier 3** | `COMMUNITY` | Violet (`#a855f7`) | Creator livestreams, fan retrospectives, and verified community countdowns. |
| **Tier 4** | `UNCONFIRMED` | Yellow Outline (`#eab308`) | Speculative industry rumours or forecasted target windows awaiting official disclosure. |

---

### 3. Core Capabilities

1. **Interactive Calendar Month View (`/events`)**:
   - 7-column monthly grid displaying leading, active, and trailing days.
   - Prev/Next month navigation and "Today" quick-jump button.
   - Mini event pills inside day tiles showing verification star (`★` for official) and category color accents.
2. **Cards / List View (`/events`)**:
   - Comprehensive linear chronological list view of events.
   - Live relative countdown ticker (`in 74 days`, `in 12 hrs`, `Live Now`).
   - Local browser date and time formatting.
   - Location format indicators (`ONLINE`, `IN_PERSON`, `HYBRID`).
3. **Event Detail Route (`/events/[slug]`)**:
   - Dynamic 4-digit live countdown ticker (Days, Hours, Minutes, Seconds).
   - Side-by-side local time and Universal Standard Time (UTC) reference.
   - Host, organizer, and source reliability scoring.
   - Direct external stream button and official disclosure link.
   - Related upcoming events in the same category.
4. **Player Integration**:
   - **Save Event**: One-click toggle adding events to personal player calendar.
   - **Set Reminder**: Configurable lead time (15 minutes, 1 hour, or 1 day prior) delivered through in-app notifications.

---

### 4. Database Schema

The Events subsystem utilizes three relational tables:

- `event_categories`: Pre-configured categories (`official-broadcasts`, `corporate-financial`, `industry-showcases`, `pre-order-retail`, `community-milestones`).
- `event_sources`: Trusted sources with reliability ratings (e.g. Rockstar Newswire: 100, Take-Two IR: 100, PlayStation Blog: 95).
- `events`: Core entity storing UTC start/end timestamps, location format, stream URLs, verification badges, and organizer information.
- `saved_events`: Player-specific saved events with unique constraint on `(user_id, event_id)`.
- `event_reminders`: Player reminder records with `(user_id, event_id, lead_time_minutes, channel)`.
