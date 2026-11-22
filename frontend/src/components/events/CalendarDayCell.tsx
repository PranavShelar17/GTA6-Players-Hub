"use client";

import React from "react";
import Link from "next/link";
import { EventItem } from "@/lib/eventApi";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventItem[];
  onSelectDate?: (date: Date) => void;
}

export function CalendarDayCell({
  day,
  month,
  year,
  isCurrentMonth,
  isToday,
  events,
  onSelectDate,
}: CalendarDayCellProps) {
  const cellDate = new Date(year, month, day);

  return (
    <div
      onClick={() => onSelectDate && onSelectDate(cellDate)}
      className={cn(
        "min-h-[96px] sm:min-h-[110px] p-2 border border-[#1a1f2b] transition-all flex flex-col justify-between group",
        isCurrentMonth ? "bg-[#0b0d13]/60 hover:bg-[#121622]/80" : "bg-[#07080c]/40 text-slate-600 opacity-40",
        isToday && "ring-1 ring-orange-500/80 bg-orange-500/[0.03]"
      )}
    >
      {/* Day Number Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            isToday
              ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black"
              : isCurrentMonth
              ? "text-slate-300 group-hover:text-white"
              : "text-slate-600"
          )}
        >
          {day}
        </span>

        {events.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#181d2c] text-orange-400">
            {events.length}
          </span>
        )}
      </div>

      {/* Events inside day */}
      <div className="space-y-1 overflow-y-auto max-h-[64px] scrollbar-none">
        {events.slice(0, 2).map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="block text-[11px] font-medium px-1.5 py-0.5 rounded truncate border transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: `${ev.category_color || "#f97316"}18`,
              borderColor: `${ev.category_color || "#f97316"}40`,
              color: ev.category_color || "#f97316",
            }}
            title={ev.title}
          >
            <span className="font-semibold mr-1">
              {ev.verification_status === "OFFICIAL" ? "★" : "•"}
            </span>
            {ev.title}
          </Link>
        ))}

        {events.length > 2 && (
          <div className="text-[10px] font-bold text-slate-400 pl-1">
            +{events.length - 2} more
          </div>
        )}
      </div>
    </div>
  );
}
