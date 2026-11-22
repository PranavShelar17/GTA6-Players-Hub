"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setEventReminder } from "@/lib/eventApi";
import { cn } from "@/lib/utils";

interface EventReminderButtonProps {
  eventId: string;
  hasReminder?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const REMINDER_OPTIONS = [
  { label: "15 minutes before", minutes: 15 },
  { label: "1 hour before", minutes: 60 },
  { label: "1 day before", minutes: 1440 },
];

export function EventReminderButton({
  eventId,
  hasReminder = false,
  className,
  size = "md",
}: EventReminderButtonProps) {
  const { session, isAuthenticated } = useAuth();
  const [active, setActive] = useState(hasReminder);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = async (minutes: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !session?.access_token) {
      if (typeof window !== "undefined") {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      return;
    }

    setLoading(true);
    setSelectedMinutes(minutes);
    try {
      await setEventReminder(eventId, session.access_token, minutes, "IN_APP");
      setActive(true);
      setIsOpen(false);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={loading}
        className={cn(
          "rounded-lg transition-colors flex items-center justify-center gap-1.5",
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs font-semibold",
          active
            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/25"
            : "bg-[#141724] text-slate-300 border border-[#23293a] hover:text-white hover:border-slate-500",
          className
        )}
        title={active ? "Reminder scheduled" : "Set event notification reminder"}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Bell className={cn("w-3.5 h-3.5", active && "fill-cyan-400")} />
        )}
        <span>{active ? "Reminded" : "Remind Me"}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#23293a] bg-[#0c0e14] shadow-2xl p-1.5 z-50 space-y-1">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Notify me in-app
          </div>
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={(e) => handleSelectOption(opt.minutes, e)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                active && selectedMinutes === opt.minutes
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-300 hover:text-white hover:bg-[#181d2c]"
              )}
            >
              <span>{opt.label}</span>
              {active && selectedMinutes === opt.minutes && (
                <Check className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
