"use client";

import React from "react";
import { EventItem } from "@/lib/eventApi";
import { EventCard } from "./EventCard";

interface EventsListViewProps {
  events: EventItem[];
}

export function EventsListView({ events }: EventsListViewProps) {
  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sortedEvents.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}
