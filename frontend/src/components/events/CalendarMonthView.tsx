"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { EventItem } from "@/lib/eventApi";
import { CalendarDayCell } from "./CalendarDayCell";
import { Button } from "@/components/ui/Button";

interface CalendarMonthViewProps {
  events: EventItem[];
  onSelectDate?: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarMonthView({ events, onSelectDate }: CalendarMonthViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Days calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

  // Filter events for this month view
  const getEventsForDate = (y: number, m: number, d: number): EventItem[] => {
    return events.filter((ev) => {
      try {
        const evDate = new Date(ev.start_time);
        return (
          evDate.getFullYear() === y &&
          evDate.getMonth() === m &&
          evDate.getDate() === d
        );
      } catch {
        return false;
      }
    });
  };

  // Build grid cells
  const cells = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push(
      <CalendarDayCell
        key={`prev-${d}`}
        day={d}
        month={prevMonthIdx}
        year={prevYear}
        isCurrentMonth={false}
        isToday={false}
        events={getEventsForDate(prevYear, prevMonthIdx, d)}
        onSelectDate={onSelectDate}
      />
    );
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const isToday = isCurrentYearMonth && today.getDate() === d;
    cells.push(
      <CalendarDayCell
        key={`curr-${d}`}
        day={d}
        month={month}
        year={year}
        isCurrentMonth={true}
        isToday={isToday}
        events={getEventsForDate(year, month, d)}
        onSelectDate={onSelectDate}
      />
    );
  }

  // 3. Next month leading days (to fill 35 or 42 grid slots)
  const totalRendered = cells.length;
  const remainingSlots = (totalRendered <= 35 ? 35 : 42) - totalRendered;
  for (let d = 1; d <= remainingSlots; d++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push(
      <CalendarDayCell
        key={`next-${d}`}
        day={d}
        month={nextMonthIdx}
        year={nextYear}
        isCurrentMonth={false}
        isToday={false}
        events={getEventsForDate(nextYear, nextMonthIdx, d)}
        onSelectDate={onSelectDate}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#1c2230] bg-[#090b10] overflow-hidden shadow-2xl">
      {/* Calendar Header Navigation */}
      <div className="px-5 py-4 border-b border-[#1c2230] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#10141f] to-[#0a0c12]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">
              Grand Theft Auto VI verified release timeline & corporate milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs border-[#242b3d] hover:bg-[#141824]"
          >
            Today
          </Button>

          <div className="flex items-center rounded-lg border border-[#242b3d] bg-[#10131e] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1c2232] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1c2232] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-[#1c2230] bg-[#0c0e15] text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
        {WEEKDAYS.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Calendar 7-column Grid */}
      <div className="grid grid-cols-7 bg-[#141824]/30">{cells}</div>
    </div>
  );
}
