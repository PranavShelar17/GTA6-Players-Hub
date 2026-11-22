"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  EventCategory,
  EventItem,
  fetchEventCategories,
  fetchEvents,
} from "@/lib/eventApi";
import { EventsPageHeader } from "./EventsPageHeader";
import { EventCategoryFilter } from "./EventCategoryFilter";
import { CalendarMonthView } from "./CalendarMonthView";
import { EventsListView } from "./EventsListView";
import { EventsLoadingSkeleton } from "./EventsLoadingSkeleton";
import { EventsEmptyState } from "./EventsEmptyState";

interface EventsPageClientProps {
  initialEvents: EventItem[];
  initialCategories: EventCategory[];
}

export function EventsPageClient({
  initialEvents,
  initialCategories,
}: EventsPageClientProps) {
  const { session } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [categories, setCategories] = useState<EventCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [viewMode, setViewMode] = useState<"month" | "list">("list");
  const [timeframe, setTimeframe] = useState<"upcoming" | "past" | "all">("upcoming");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadFilteredData() {
      setLoading(true);
      try {
        const [evs, cats] = await Promise.all([
          fetchEvents({
            category: selectedCategory,
            timeframe,
            search: search.trim() || undefined,
            token: session?.access_token,
          }),
          categories.length === 0 ? fetchEventCategories() : Promise.resolve(categories),
        ]);
        setEvents(evs);
        if (categories.length === 0) setCategories(cats);
      } catch {
        // Fallback to existing
      } finally {
        setLoading(false);
      }
    }

    loadFilteredData();
  }, [selectedCategory, timeframe, search, session?.access_token]);

  const handleResetFilters = () => {
    setSelectedCategory(undefined);
    setTimeframe("upcoming");
    setSearch("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Controls */}
      <EventsPageHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Category Pills Filter */}
      <div className="mb-6">
        <EventCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Content Rendering: Month View vs Cards List View */}
      {loading ? (
        <EventsLoadingSkeleton viewMode={viewMode} />
      ) : events.length === 0 ? (
        <EventsEmptyState onReset={handleResetFilters} />
      ) : viewMode === "month" ? (
        <div className="space-y-8">
          <CalendarMonthView events={events} />
          {/* Also show upcoming list below month view */}
          <div className="mt-10">
            <h3 className="text-lg font-bold text-white mb-4">
              Upcoming Events Summary
            </h3>
            <EventsListView events={events.slice(0, 3)} />
          </div>
        </div>
      ) : (
        <EventsListView events={events} />
      )}
    </div>
  );
}
