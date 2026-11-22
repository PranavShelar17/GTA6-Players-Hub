"use client";

import React from "react";

export function NotificationLoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#1c212e] bg-[#0c0e14] p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1e2538] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-[#1e2538] rounded" />
              <div className="h-3 w-16 bg-[#181d2a] rounded" />
            </div>
            <div className="h-4 w-3/4 bg-[#1e2538] rounded" />
            <div className="h-3 w-5/6 bg-[#181d2a] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
