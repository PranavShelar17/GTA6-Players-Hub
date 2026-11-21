import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function HomePageSkeleton() {
  return (
    <div className="flex flex-col gap-16 pb-20 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Hero Skeleton */}
      <div className="pt-16 pb-12 text-center max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-6 w-72 mx-auto rounded-full" />
        <Skeleton className="h-16 w-full max-w-2xl mx-auto rounded-xl" />
        <Skeleton className="h-8 w-4/5 mx-auto rounded-lg" />
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton className="h-11 w-40 rounded-lg" />
          <Skeleton className="h-11 w-44 rounded-lg" />
          <Skeleton className="h-11 w-40 rounded-lg" />
        </div>
      </div>

      {/* Pillars Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-6 rounded-xl border border-[#1e2330] bg-[#11131a] space-y-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </div>
        ))}
      </div>

      {/* News Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl border border-[#1e2330] bg-[#11131a] space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deals Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl border border-[#1e2330] bg-[#11131a] space-y-4">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-7 w-3/4 rounded" />
              <Skeleton className="h-10 w-36 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
