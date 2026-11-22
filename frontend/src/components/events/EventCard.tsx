"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, ExternalLink, Radio } from "lucide-react";
import { EventItem } from "@/lib/eventApi";
import { EventVerificationBadge } from "./EventVerificationBadge";
import { SaveEventButton } from "./SaveEventButton";
import { EventReminderButton } from "./EventReminderButton";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: EventItem;
  className?: string;
}

export function formatEventDateTime(dateIso: string): {
  dateStr: string;
  timeStr: string;
  countdown: string;
  isUpcoming: boolean;
  isLive: boolean;
} {
  try {
    const d = new Date(dateIso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    let countdown = "";
    let isUpcoming = diffMs > 0;
    let isLive = false;

    if (diffMs > 0) {
      if (diffDays > 30) {
        const months = Math.floor(diffDays / 30);
        countdown = `in ~${months} mo${months > 1 ? "s" : ""}`;
      } else if (diffDays > 1) {
        countdown = `in ${diffDays} days`;
      } else if (diffHours > 1) {
        countdown = `in ${diffHours} hrs`;
      } else {
        countdown = "Starting soon";
      }
    } else if (diffMs > -1000 * 60 * 60 * 4) {
      // Within 4 hours of start time
      countdown = "Live Now";
      isLive = true;
    } else {
      countdown = "Concluded";
      isUpcoming = false;
    }

    const dateStr = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timeStr = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    return { dateStr, timeStr, countdown, isUpcoming, isLive };
  } catch {
    return {
      dateStr: "TBA",
      timeStr: "TBA",
      countdown: "Upcoming",
      isUpcoming: true,
      isLive: false,
    };
  }
}

export function EventCard({ event, className }: EventCardProps) {
  const { dateStr, timeStr, countdown, isLive } = formatEventDateTime(event.start_time);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-[#1b202c] bg-gradient-to-b from-[#0f1118] to-[#0a0c10] p-5 transition-all duration-200 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 flex flex-col justify-between",
        className
      )}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <EventVerificationBadge status={event.verification_status} />
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${event.category_color || "#f97316"}15`,
                color: event.category_color || "#f97316",
                borderColor: `${event.category_color || "#f97316"}30`,
              }}
            >
              {event.category_name}
            </span>
          </div>

          {/* Countdown indicator */}
          <div
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5",
              isLive
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                : "bg-[#181d2c] text-slate-300 border border-[#23293a]"
            )}
          >
            {isLive ? <Radio className="w-3 h-3 text-rose-400 animate-ping" /> : <Clock className="w-3 h-3 text-orange-400" />}
            <span>{countdown}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/events/${event.slug}`} className="block group/link">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover/link:text-orange-400 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>
        </Link>

        {/* Description / Summary */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {event.short_summary || event.description}
        </p>

        {/* Schedule & Location Metadata */}
        <div className="space-y-1.5 text-xs text-slate-400 border-t border-[#181c26] pt-3 mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="font-semibold">{dateStr}</span>
            <span className="text-slate-500">•</span>
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              {event.location_name || (event.location_type === "ONLINE" ? "Online Stream" : "In-Person Showcase")}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-slate-500 font-medium">{event.organizer_name}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#181c26]/60">
        <Link
          href={`/events/${event.slug}`}
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
        >
          <span>Full Details</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <div className="flex items-center gap-1.5">
          <EventReminderButton eventId={event.id} hasReminder={event.has_reminder} size="sm" />
          <SaveEventButton eventId={event.id} initialSaved={event.is_saved} size="sm" />
        </div>
      </div>
    </div>
  );
}
