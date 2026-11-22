"use client";

import React from "react";

interface EventsLoadingSkeletonProps {
  viewMode?: "month" | "list";
}

export function EventsLoadingSkeleton({ viewMode = "list" }: EventsLoadingSkeletonProps) {
  if (viewMode === "month") {
    return (
      <div className="rounded-2xl border border-[#1c2230] bg-[#090b10] overflow-hidden p-5 animate-pulse">
        <div className="h-10 w-48 bg-[#181d2a] rounded-lg mb-6" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] bg-[#121622]/50 rounded-lg p-2">
              <div className="w-5 h-5 bg-[#1f2638] rounded-full mb-3" />
              {i % 4 === 0 && <div className="h-4 bg-[#1f2638] rounded mb-1" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#1b202c] bg-[#0f1118] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-[#1e2538] rounded-full" />
            <div className="h-5 w-16 bg-[#1e2538] rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-[#1e2538] rounded" />
            <div className="h-4 w-full bg-[#181d2a] rounded" />
            <div className="h-4 w-5/6 bg-[#181d2a] rounded" />
          </div>
          <div className="pt-3 border-t border-[#181c26] flex items-center justify-between">
            <div className="h-4 w-28 bg-[#181d2a] rounded" />
            <div className="h-7 w-20 bg-[#1e2538] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
