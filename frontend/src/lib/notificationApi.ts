/**
 * Notification Centre API Client (Phase 6)
 * Interfaces with FastAPI Backend at /api/v1/notifications/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export type NotificationType =
  | "NEWS_UPDATE"
  | "PRICE_DROP"
  | "EVENT_REMINDER"
  | "EVENT_UPDATE"
  | "PLATFORM_ANNOUNCEMENT"
  | "ACCOUNT_SECURITY";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  reference_id?: string | null;
  reference_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  created_at: string;
}

export interface UnreadCountInfo {
  total_unread: number;
  unread_by_type: Record<string, number>;
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  news_updates: boolean;
  price_alerts: boolean;
  event_reminders: boolean;
  community_activity: boolean;
  platform_announcements: boolean;
  default_reminder_minutes: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export interface FetchNotificationsParams {
  is_read?: boolean;
  notification_type?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieves player notifications with optional read and category filters.
 */
export async function fetchNotifications(
  token: string,
  params: FetchNotificationsParams = {}
): Promise<NotificationItem[]> {
  const query = new URLSearchParams();
  if (params.is_read !== undefined) query.set("is_read", String(params.is_read));
  if (params.notification_type) query.set("notification_type", params.notification_type);
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  const json = await res.json();
  return json.data || [];
}

/**
 * Retrieves unread notification counts.
 */
export async function fetchUnreadCount(token: string): Promise<UnreadCountInfo> {
  const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch unread count");
  const json = await res.json();
  return json.data || { total_unread: 0, unread_by_type: {} };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  token: string
): Promise<{ marked_as_read: boolean }> {
  const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  const json = await res.json();
  return json.data;
}

/**
 * Marks all unread notifications as read.
 */
export async function markAllNotificationsAsRead(
  token: string
): Promise<{ marked_count: number }> {
  const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
  const json = await res.json();
  return json.data;
}

/**
 * Deletes/dismisses a single notification.
 */
export async function deleteNotification(
  notificationId: string,
  token: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to delete notification");
  const json = await res.json();
  return json.data;
}

/**
 * Retrieves player notification preferences.
 */
export async function fetchNotificationPreferences(
  token: string
): Promise<NotificationPreferences> {
  const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to load preferences");
  const json = await res.json();
  return json.data;
}

/**
 * Updates player notification preferences.
 */
export async function updateNotificationPreferences(
  token: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update notification preferences");
  const json = await res.json();
  return json.data;
}

/**
 * Subscribes to browser push notifications.
 */
export async function subscribeToPush(
  token: string,
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string;
  }
): Promise<{ id: string; endpoint: string; is_active: boolean }> {
  const res = await fetch(`${API_BASE_URL}/notifications/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) throw new Error("Failed to register push subscription");
  const json = await res.json();
  return json.data;
}

/**
 * Unsubscribes from browser push notifications.
 */
export async function unsubscribeFromPush(
  token: string,
  endpoint: string
): Promise<{ unsubscribed: boolean }> {
  const res = await fetch(
    `${API_BASE_URL}/notifications/push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to unsubscribe push");
  const json = await res.json();
  return json.data;
}
