# NOTIFICATION AUTOMATION DOCUMENTATION: GTA 6 PLAYER HUB
**Multi-Channel Notification Dispatch, Preferences, and Reliability Engine**
**Version**: 1.0.0 (Phase 10)  

---

## 1. Supported Notification Channels

The GTA 6 Player Hub notification subsystem implements three complementary delivery channels:

```
                                  [Trigger Event]
                         (Price Drop / Event Reminder / News)
                                          |
                                          v
                              [Notification Record]
                                  (In-App Channel)
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
                 [Email Channel]                     [Push Channel]
            (SMTP / SendGrid / SES)                (Web Push / VAPID)
```

### 1.1 In-App Notifications (Primary Channel)
- Instantly stored in the `notifications` table.
- Accessible via the Notification Bell in the navigation bar and `/notifications`.
- Supports real-time badge updates and mark-as-read workflows.

### 1.2 Outbound Email Notifications (Secondary Channel)
- Processed by `process_email_deliveries_task` on `notification_queue`.
- Generates responsive Vice City styled HTML emails and accessible plain-text fallbacks.
- Strictly adheres to user preferences (`notification_preferences.email_enabled = True`).
- Supports simulated provider mode (`MockEmailProvider`) when SMTP credentials are not configured.

### 1.3 Browser Web Push Notifications (Tertiary Channel)
- Processed by `process_push_deliveries_task` on `notification_queue`.
- Uses standard W3C Push API and RFC 8292 Voluntary Application Server Identification (VAPID).
- Delivers desktop and mobile notifications when the player has granted explicit browser permission.
- Automatically handles `410 Gone` and `404 Not Found` responses by purging expired push subscriptions.

---

## 2. Notification Types & Priority Levels

| Notification Type | Trigger Condition | Priority | Default Channels |
|---|---|---|---|
| `PRICE_DROP` | A monitored game edition falls to or below player's saved target price | `HIGH` | In-App, Email, Push |
| `EVENT_REMINDER` | A saved calendar event is starting in 15m, 1h, or 24h | `URGENT` | In-App, Email, Push |
| `EVENT_UPDATE` | An event date or time has changed, or official livestream stream URL added | `NORMAL` | In-App, Email |
| `EVENT_CANCELLED` | Official publisher confirms an event cancellation | `HIGH` | In-App, Email |
| `NEWS_OFFICIAL` | New verified official announcement published by Rockstar Games | `HIGH` | In-App, Push |
| `COMMUNITY_INTERACTION`| Player post receives comments, upvotes, or follow events | `NORMAL` | In-App |
| `PLATFORM_ANNOUNCEMENT`| Site maintenance, system feature launches, or security advisories | `NORMAL` | In-App |

---

## 3. Debounce & Duplicate Prevention Guarantees

To prevent notification spam and duplicate dispatches:

1. **Price Drop Debounce**:
   - `PriceAlertEvent` records the product, store, and triggered price.
   - If an observation matches an already triggered price for that alert within the last 24 hours, duplicate alerts are suppressed.
2. **Event Reminder Idempotence**:
   - `EventReminder` table stores `is_sent=True` and `sent_at=TIMESTAMP`.
   - The scheduler queries reminders where `is_sent=False`. Upon delivery, reminders are flagged as sent within the same database transaction.
3. **Outbound Delivery State Machine**:
   - `NotificationDelivery` tracks channels separately (`IN_APP`, `EMAIL`, `PUSH`).
   - Deliveries transition from `PENDING` -> `DELIVERED` (or `RETRYING` -> `FAILED`).
   - Failed transmissions increment `retry_count` up to a maximum of 3 attempts before marking `FAILED`.

---

## 4. Email Templates (Vice City Styling)

Emails feature Vice City aesthetics consistent with the web application:
- Dark luxury background (`#0B0E14`)
- Neon magenta header accents (`#F43F5E`)
- Ocean cyan highlights (`#06B6D4`)
- Direct deep links to `/price-deals/[slug]`, `/events/[slug]`, or `/news/[slug]`
- Mandatory one-click unsubscribe links respecting player privacy
