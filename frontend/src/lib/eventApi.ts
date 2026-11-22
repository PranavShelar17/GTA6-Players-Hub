/**
 * Events Calendar API Client (Phase 6)
 * Interfaces with FastAPI Backend at /api/v1/events/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active: boolean;
  events_count: number;
}

export interface EventSource {
  id: string;
  name: string;
  website_url: string;
  source_type: string;
  reliability_score: number;
}

export type EventVerificationStatus = "OFFICIAL" | "VERIFIED" | "COMMUNITY" | "UNCONFIRMED";

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_summary?: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
  category_color?: string | null;
  source_id?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  start_time: string;
  end_time?: string | null;
  timezone: string;
  location_type: string; // ONLINE, IN_PERSON, HYBRID
  location_name?: string | null;
  event_url?: string | null;
  stream_url?: string | null;
  verification_status: EventVerificationStatus;
  is_featured: boolean;
  is_cancelled: boolean;
  banner_image_url?: string | null;
  organizer_name: string;
  tags?: string | null;
  is_saved: boolean;
  has_reminder: boolean;
  reminders_count: number;
}

export interface EventReminderItem {
  id: string;
  user_id: string;
  event_id: string;
  lead_time_minutes: number;
  channel: string;
  is_sent: boolean;
  sent_at?: string | null;
  created_at: string;
  event_title?: string | null;
  event_slug?: string | null;
  event_start_time?: string | null;
}

export interface SavedEventItem {
  id: string;
  user_id: string;
  event_id: string;
  notes?: string | null;
  created_at: string;
  event?: EventItem | null;
}

export interface EventDetailItem extends EventItem {
  reminders: EventReminderItem[];
  related_events: EventItem[];
}

export interface FetchEventsParams {
  category?: string;
  status?: string;
  timeframe?: "upcoming" | "past" | "all";
  search?: string;
  page?: number;
  limit?: number;
  token?: string;
}

/**
 * Retrieves all active event categories.
 */
export async function fetchEventCategories(): Promise<EventCategory[]> {
  const res = await fetch(`${API_BASE_URL}/events/categories`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load event categories");
  const json = await res.json();
  return json.data || [];
}

/**
 * Retrieves events filtered by category, status, timeframe, and search term.
 */
export async function fetchEvents(params: FetchEventsParams = {}): Promise<EventItem[]> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.timeframe) query.set("timeframe", params.timeframe);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  const headers: Record<string, string> = { Accept: "application/json" };
  if (params.token) {
    headers["Authorization"] = `Bearer ${params.token}`;
  }

  const res = await fetch(`${API_BASE_URL}/events?${query.toString()}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) throw new Error("Failed to load events");
  const json = await res.json();
  return json.data || [];
}

/**
 * Retrieves a single event by slug.
 */
export async function fetchEventBySlug(slug: string, token?: string): Promise<EventDetailItem> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/events/${slug}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) throw new Error(`Event '${slug}' not found`);
  const json = await res.json();
  return json.data;
}

/**
 * Toggles or saves an event to player's calendar.
 */
export async function toggleSaveEvent(
  eventId: string,
  token: string,
  notes?: string
): Promise<{ is_saved: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error("Failed to save event");
  const json = await res.json();
  return json.data;
}

/**
 * Unsaves an event.
 */
export async function unsaveEvent(
  eventId: string,
  token: string
): Promise<{ is_saved: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/save`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to unsave event");
  const json = await res.json();
  return json.data;
}

/**
 * Retrieves player's saved events.
 */
export async function fetchPlayerSavedEvents(token: string): Promise<SavedEventItem[]> {
  const res = await fetch(`${API_BASE_URL}/events/saved`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to load saved events");
  const json = await res.json();
  return json.data || [];
}

/**
 * Sets an event reminder for the player.
 */
export async function setEventReminder(
  eventId: string,
  token: string,
  leadTimeMinutes: number = 60,
  channel: string = "IN_APP"
): Promise<EventReminderItem> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/reminders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lead_time_minutes: leadTimeMinutes, channel }),
  });
  if (!res.ok) throw new Error("Failed to create reminder");
  const json = await res.json();
  return json.data;
}

/**
 * Deletes an event reminder.
 */
export async function deleteEventReminder(
  reminderId: string,
  token: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE_URL}/events/reminders/${reminderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to remove reminder");
  const json = await res.json();
  return json.data;
}

/**
 * Retrieves player's active event reminders.
 */
export async function fetchPlayerReminders(token: string): Promise<EventReminderItem[]> {
  const res = await fetch(`${API_BASE_URL}/events/reminders`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to load reminders");
  const json = await res.json();
  return json.data || [];
}
