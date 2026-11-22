import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function PriceLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 rounded-2xl bg-[#12151f] border border-[#202738] p-6 animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#12151f] border border-[#202738] p-6 space-y-4 animate-pulse"
          >
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24 bg-slate-800" />
              <Skeleton className="h-5 w-16 bg-slate-800" />
            </div>
            <Skeleton className="h-6 w-3/4 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <Skeleton className="h-8 w-28 bg-slate-800" />
              <Skeleton className="h-8 w-24 bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
