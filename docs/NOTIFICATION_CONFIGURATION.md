# GTA 6 Player Hub – Notification Configuration Guide
## Operational Setup & Environment Configuration

### 1. Environment Variables

The notification and event services integrate with the existing FastAPI configuration system defined in `backend/app/core/config.py`.

```env
# Notification Delivery Settings
NOTIFICATION_DEFAULT_LEAD_TIME_MINUTES=60
NOTIFICATION_MAX_REMINDERS_PER_PLAYER=50
NOTIFICATION_QUIET_HOURS_DEFAULT_START="22:00"
NOTIFICATION_QUIET_HOURS_DEFAULT_END="08:00"

# Web Push (VAPID) Credentials (RFC 8292)
VAPID_PUBLIC_KEY="BK_example_vapid_public_key_base64url..."
VAPID_PRIVATE_KEY="example_vapid_private_key_base64url..."
VAPID_CLAIMS_SUB="mailto:notifications@gta6hub.local"

# Email Provider Configuration (SMTP / Resend / SendGrid)
SMTP_HOST="smtp.provider.com"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASSWORD="secret-smtp-password"
SMTP_FROM_EMAIL="alerts@gta6hub.local"
```

---

### 2. Quiet Hours Implementation

Quiet hours are checked before dispatching non-critical notifications:

```python
def is_in_quiet_hours(pref: NotificationPreference, now: datetime) -> bool:
    if not pref.quiet_hours_enabled:
        return False

    player_tz = ZoneInfo(pref.timezone or "UTC")
    local_time = now.astimezone(player_tz).time()

    start = time.fromisoformat(pref.quiet_hours_start)
    end = time.fromisoformat(pref.quiet_hours_end)

    if start <= end:
        return start <= local_time <= end
    else:
        # Over-night window (e.g. 22:00 to 08:00)
        return local_time >= start or local_time <= end
```

Urgent notifications (such as `ACCOUNT_SECURITY` priority URGENT) explicitly bypass quiet hours to guarantee player security.

---

### 3. Web Push Client Setup

Browser Web Push registration is handled through the standard service worker registration:

```typescript
// Register push subscription
async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });

  const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("p256dh"))));
  const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey("auth"))));

  await subscribeToPush(token, {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
  });
}
```
