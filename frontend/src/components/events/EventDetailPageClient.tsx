"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink, 
  ArrowLeft, 
  Radio, 
  Building2, 
  Globe, 
  ShieldCheck,
  Share2,
  Check
} from "lucide-react";
import { EventDetailItem } from "@/lib/eventApi";
import { EventVerificationBadge } from "./EventVerificationBadge";
import { SaveEventButton } from "./SaveEventButton";
import { EventReminderButton } from "./EventReminderButton";
import { EventCard } from "./EventCard";

interface EventDetailPageClientProps {
  event: EventDetailItem;
}

export function EventDetailPageClient({ event }: EventDetailPageClientProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Live countdown calculation
  useEffect(() => {
    function calculateCountdown() {
      const target = new Date(event.start_time).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.start_time]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startDate = new Date(event.start_time);
  const localDateStr = startDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const localTimeStr = startDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const utcTimeStr = startDate.toUTCString();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" />
          <span>Back to Events Calendar</span>
        </Link>
      </div>

      {/* Main Hero Card */}
      <div className="rounded-3xl border border-[#1e2332] bg-gradient-to-b from-[#10131d] to-[#0a0c12] p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-10">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Verification & Category Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <EventVerificationBadge status={event.verification_status} />
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                backgroundColor: `${event.category_color || "#f97316"}18`,
                color: event.category_color || "#f97316",
                borderColor: `${event.category_color || "#f97316"}40`,
              }}
            >
              {event.category_name}
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222838] bg-[#141724] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Link Copied" : "Share Event"}</span>
          </button>
        </div>

        {/* Event Title */}
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
          {event.title}
        </h1>

        {/* Short Summary */}
        {event.short_summary && (
          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mb-8 max-w-3xl">
            {event.short_summary}
          </p>
        )}

        {/* Countdown Ticker Box */}
        <div className="p-6 rounded-2xl border border-[#222838] bg-[#0c0e15] mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Event Countdown</span>
            </span>
            <span className="text-xs font-semibold text-orange-400">
              {timeLeft.isPast ? "Event Concluded" : "Target Broadcast Date"}
            </span>
          </div>

          {timeLeft.isPast ? (
            <div className="py-4 text-center text-slate-400 text-sm font-medium">
              This event or broadcast milestone has concluded.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hours", val: timeLeft.hours },
                { label: "Minutes", val: timeLeft.minutes },
                { label: "Seconds", val: timeLeft.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 sm:p-4 rounded-xl border border-[#1b202c] bg-[#121622] flex flex-col items-center justify-center"
                >
                  <span className="text-2xl sm:text-4xl font-black text-white">
                    {String(item.val).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule & Timezone Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl border border-[#1b202c] bg-[#0e111a] mb-8 text-xs">
          <div className="space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              Local Time (Your Browser)
            </div>
            <div className="text-white font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>{localDateStr}</span>
            </div>
            <div className="text-slate-300 flex items-center gap-2 pl-6">
              <span>{localTimeStr}</span>
            </div>
          </div>

          <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-[#1f2433] pt-4 sm:pt-0 sm:pl-4">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              Universal Standard (UTC)
            </div>
            <div className="text-slate-300 font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{utcTimeStr}</span>
            </div>
            <div className="text-[11px] text-slate-500 pl-6">
              Official coordinates locked to UTC. Converted dynamically without Daylight Saving offset confusion.
            </div>
          </div>
        </div>

        {/* Location & Host Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs">
          <div className="p-4 rounded-xl border border-[#1b202c] bg-[#0c0e15] flex items-start gap-3">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Broadcast / Venue
              </span>
              <span className="text-white font-semibold block mt-0.5">
                {event.location_name || (event.location_type === "ONLINE" ? "Live Stream Webcast" : "Showcase Venue")}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Format: {event.location_type}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#1b202c] bg-[#0c0e15] flex items-start gap-3">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Organizer & Host
              </span>
              <span className="text-white font-semibold block mt-0.5">
                {event.organizer_name}
              </span>
              {event.source_name && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Source: {event.source_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar (Save, Reminder, External Stream) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#1e2332]">
          <div className="flex items-center gap-2">
            <SaveEventButton eventId={event.id} initialSaved={event.is_saved} size="md" />
            <EventReminderButton eventId={event.id} hasReminder={event.has_reminder} size="md" />
          </div>

          <div className="flex items-center gap-2">
            {event.stream_url && (
              <a
                href={event.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-rose-700 transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Watch Stream</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {event.event_url && (
              <a
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[#222838] bg-[#141724] text-slate-200 hover:text-white hover:border-slate-500 transition-all"
              >
                <span>Official Link</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full Description & Context */}
      <div className="rounded-3xl border border-[#1c2230] bg-[#0c0e14] p-6 sm:p-8 mb-12">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Timeline Intelligence Briefing</span>
        </h2>
        <div className="text-sm text-slate-300 leading-relaxed space-y-4">
          <p>{event.description}</p>
          <div className="p-4 rounded-xl border border-amber-900/30 bg-amber-950/15 text-xs text-amber-300 leading-relaxed">
            <strong>Verification Note:</strong> GTA 6 Player Hub verifies timeline milestones using official Take-Two Interactive investor filings, regulatory submissions, and verified developer newswires. Target dates marked as UNCONFIRMED reflect industry forecasts and will update immediately upon direct Rockstar Games disclosure.
          </div>
        </div>
      </div>

      {/* Related Events Section */}
      {event.related_events && event.related_events.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-white mb-6">
            Related Upcoming Milestones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {event.related_events.map((rel) => (
              <EventCard key={rel.id} event={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
