"use client";

import React from "react";
import { EventCategory } from "@/lib/eventApi";
import { cn } from "@/lib/utils";

interface EventCategoryFilterProps {
  categories: EventCategory[];
  selectedCategory?: string;
  onSelectCategory: (slug?: string) => void;
  className?: string;
}

export function EventCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  className,
}: EventCategoryFilterProps) {
  const totalEvents = categories.reduce((sum, c) => sum + (c.events_count || 0), 0);

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none", className)}>
      <button
        onClick={() => onSelectCategory(undefined)}
        className={cn(
          "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border",
          !selectedCategory
            ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20"
            : "bg-[#10131c] text-slate-400 border-[#1e2330] hover:text-white hover:border-slate-500"
        )}
      >
        <span>All Events</span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
            !selectedCategory ? "bg-black/30 text-white" : "bg-[#181d2a] text-slate-400"
          )}
        >
          {totalEvents}
        </span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelectCategory(isSelected ? undefined : cat.slug)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border",
              isSelected
                ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20"
                : "bg-[#10131c] text-slate-400 border-[#1e2330] hover:text-white hover:border-slate-500"
            )}
          >
            <span>{cat.name}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                isSelected ? "bg-black/30 text-white" : "bg-[#181d2a] text-slate-400"
              )}
            >
              {cat.events_count || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
