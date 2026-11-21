"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { HomeEventItem } from "@/lib/homeApi";
import { HomePageEmptyState } from "./HomePageEmptyState";

interface UpcomingEventsSectionProps {
  events: HomeEventItem[];
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  // Live dynamic countdown to nearest event
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const primaryEvent = events && events.length > 0 ? events[0] : null;

  useEffect(() => {
    if (!primaryEvent?.start_time_iso) return;

    function calculateTime() {
      const targetDate = new Date(primaryEvent!.start_time_iso).getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [primaryEvent]);

  if (!events || events.length === 0) {
    return (
      <div>
        <SectionHeader
          tag="Milestones"
          title="Events Calendar"
          subtitle="Major GTA 6 milestones and industry broadcasts."
        />
        <HomePageEmptyState
          title="No Upcoming Events"
          description="There are currently no scheduled public broadcast events. Check back after upcoming earnings conferences."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        tag="Milestones"
        title="Events Calendar"
        subtitle="Major GTA 6 milestones and industry broadcasts."
      />

      {/* Primary Event Countdown Banner */}
      {primaryEvent && timeLeft && (
        <div className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/20 to-[#12141c] mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Next Anticipated Milestone
            </span>
            <span className="text-slate-400">{primaryEvent.date_string}</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-3">{primaryEvent.event_name}</h4>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#0c0e15] border border-[#202738]">
              <div className="text-lg font-black text-white">{timeLeft.days}</div>
              <div className="text-[10px] text-slate-400 uppercase">Days</div>
            </div>
            <div className="p-2 rounded-lg bg-[#0c0e15] border border-[#202738]">
              <div className="text-lg font-black text-white">{timeLeft.hours}</div>
              <div className="text-[10px] text-slate-400 uppercase">Hours</div>
            </div>
            <div className="p-2 rounded-lg bg-[#0c0e15] border border-[#202738]">
              <div className="text-lg font-black text-white">{timeLeft.minutes}</div>
              <div className="text-[10px] text-slate-400 uppercase">Mins</div>
            </div>
            <div className="p-2 rounded-lg bg-[#0c0e15] border border-[#202738]">
              <div className="text-lg font-black text-orange-400">{timeLeft.seconds}</div>
              <div className="text-[10px] text-slate-400 uppercase">Secs</div>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div
            key={event.id}
            className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start gap-4 hover:border-slate-700 transition-colors"
          >
            <div
              className={`p-3 rounded-lg shrink-0 text-center ${
                event.is_official
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-orange-500/10 text-orange-400"
              }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <span className="text-[11px] font-bold block">{event.date_string.split(" ")[0] || "M" + (idx + 1)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-white">{event.event_name}</h4>
                <Badge variant={event.is_official ? "official" : "rumour"}>
                  {event.is_official ? "Official" : "Anticipated"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                {event.description}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span>Category: {event.category}</span>
                <span>Timezone: {event.timezone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
