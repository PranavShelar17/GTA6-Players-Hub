"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type FilterCategory =
  | "ALL"
  | "UNREAD"
  | "NEWS_UPDATE"
  | "PRICE_DROP"
  | "EVENT_REMINDER"
  | "PLATFORM_ANNOUNCEMENT";

interface NotificationFiltersProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  unreadCount?: number;
}

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: "ALL", label: "All Alerts" },
  { id: "UNREAD", label: "Unread" },
  { id: "NEWS_UPDATE", label: "Official News" },
  { id: "PRICE_DROP", label: "Price Drops" },
  { id: "EVENT_REMINDER", label: "Events" },
  { id: "PLATFORM_ANNOUNCEMENT", label: "Announcements" },
];

export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}: NotificationFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5",
              isActive
                ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20"
                : "bg-[#10131c] text-slate-400 border-[#1e2330] hover:text-white hover:border-slate-500"
            )}
          >
            <span>{f.label}</span>
            {f.id === "UNREAD" && unreadCount > 0 && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive ? "bg-black/30 text-white" : "bg-orange-500/20 text-orange-400"
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
