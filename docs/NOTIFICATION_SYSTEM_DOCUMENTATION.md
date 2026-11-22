# GTA 6 Player Hub – Notification System Documentation
## Phase 6 Architecture & Operational Specification

### 1. Overview
The Notification Centre provides reliable, multi-channel alerting for GTA 6 Player Hub. It connects events across all operational modules (News, Price Drops, Events, Account Security, and Platform Announcements) directly to authenticated players.

---

### 2. Supported Notification Types

| Type Identifier | Category | Trigger Source | Priority Levels |
|---|---|---|---|
| `NEWS_UPDATE` | Official Bulletins | Published article from Rockstar Games or Take-Two | NORMAL / HIGH |
| `PRICE_DROP` | Price Alerts | Pre-order or collector's edition drops below alert price | NORMAL / HIGH |
| `EVENT_REMINDER` | Event Reminders | 15m, 1h, or 24h before a saved broadcast or earnings call | NORMAL / URGENT |
| `EVENT_UPDATE` | Event Changes | Schedule changes or newly confirmed stream links | NORMAL |
| `PLATFORM_ANNOUNCEMENT` | System Notices | Platform feature releases, server updates | NORMAL |
| `ACCOUNT_SECURITY` | Security | Password change, new session established | HIGH / URGENT |

---

### 3. Delivery Channels & Preferences

Players have granular control over notification dispatch through `/settings/notifications`:

1. **In-App Notification Centre (`/notifications`)**:
   - Live badge indicator in the top navbar (`Header.tsx`) with pulse animation on unread alerts.
   - Filter tabs: All Alerts, Unread, Official News, Price Drops, Events, Platform Announcements.
   - Instant single mark as read, bulk mark all as read, and delete/dismiss.
2. **Email Digests & Critical Alerts**:
   - Sent for high-priority price drops and confirmed Rockstar Games release announcements.
   - Respects master toggle in player preferences.
3. **Browser Web Push Notifications**:
   - Integrates W3C Push API and Web Push Protocol via VAPID standard.
   - Manages player subscription endpoints in `push_subscriptions`.
4. **Quiet Hours**:
   - Player-defined time window (default 22:00 to 08:00) during which non-urgent alerts are suppressed.
   - URGENT alerts (such as security notices) bypass quiet hours.

---

### 4. Cross-Phase Event Integration

The notification system connects to existing phases:
- **Phase 4 (News & Updates)**: New published articles trigger `NEWS_UPDATE` alerts for players subscribed to official bulletins.
- **Phase 5 (Price & Deals Tracker)**: Automated price observation triggers recorded in `price_alert_events` trigger `PRICE_DROP` alerts when retail thresholds are crossed.
- **Phase 6 (Events Calendar)**: Saved events automatically generate `EVENT_REMINDER` notifications at the scheduled lead time.
