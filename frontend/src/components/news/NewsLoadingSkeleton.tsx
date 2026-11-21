import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function NewsLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Featured skeleton */}
      <div className="rounded-2xl border border-[#1f2638] bg-[#111420] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-16 w-4/5 rounded" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-[#1f2638] bg-[#111420] p-5 space-y-4">
            <Skeleton className="h-44 w-full rounded-lg" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <div className="pt-4 border-t border-[#181d2a] flex justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
