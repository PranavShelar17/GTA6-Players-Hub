"use client";

import React from "react";
import { Calendar, ListFilter, Grid } from "lucide-react";
import { EventSearch } from "./EventSearch";
import { cn } from "@/lib/utils";

interface EventsPageHeaderProps {
  viewMode: "month" | "list";
  onViewModeChange: (mode: "month" | "list") => void;
  timeframe: "upcoming" | "past" | "all";
  onTimeframeChange: (timeframe: "upcoming" | "past" | "all") => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function EventsPageHeader({
  viewMode,
  onViewModeChange,
  timeframe,
  onTimeframeChange,
  search,
  onSearchChange,
}: EventsPageHeaderProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeline Intelligence System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            GTA 6 Events & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Follow verified Take-Two corporate calls, upcoming cinematic reveals, retail activation dates, and creator countdowns with personal reminders and calendar sync.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month vs List Mode */}
          <div className="flex items-center rounded-xl border border-[#222838] bg-[#0c0e15] p-1">
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "list"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => onViewModeChange("month")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "month"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Month Grid</span>
            </button>
          </div>

          {/* Timeframe selector (Upcoming, All, Past) */}
          <div className="flex items-center rounded-xl border border-[#222838] bg-[#0c0e15] p-1">
            {(["upcoming", "all", "past"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                  timeframe === tf
                    ? "bg-[#1f2638] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4">
        <EventSearch value={search} onChange={onSearchChange} />
      </div>
    </div>
  );
}
