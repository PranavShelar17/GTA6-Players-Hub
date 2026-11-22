import { Metadata } from "next";
import { fetchEventCategories, fetchEvents, EventItem, EventCategory } from "@/lib/eventApi";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export const metadata: Metadata = {
  title: "Events Calendar & Milestone Tracker | GTA 6 Player Hub",
  description:
    "Follow verified Grand Theft Auto VI release dates, corporate Take-Two earnings conferences, trailer premieres, and gaming showcases.",
};

export default async function EventsPage() {
  let initialEvents: EventItem[] = [];
  let initialCategories: EventCategory[] = [];

  try {
    const [events, categories] = await Promise.all([
      fetchEvents({ timeframe: "upcoming" }),
      fetchEventCategories(),
    ]);
    initialEvents = events;
    initialCategories = categories;
  } catch {
    // Graceful fallback for build-time or offline dev
    initialEvents = [];
    initialCategories = [];
  }

  return (
    <EventsPageClient
      initialEvents={initialEvents}
      initialCategories={initialCategories}
    />
  );
}
