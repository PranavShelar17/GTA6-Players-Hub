import React, { Suspense } from "react";
import { Metadata } from "next";
import { SavedContentClient } from "@/components/saved/SavedContentClient";

export const metadata: Metadata = {
  title: "Unified Saved Content | GTA 6 Player Hub",
  description: "View and manage all your bookmarked GTA 6 news, wishlisted editions, saved calendar events, and pinned discussions.",
};

export default function SavedContentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] py-16 px-4 flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <span className="text-sm font-semibold">Loading saved content...</span>
          </div>
        </div>
      }
    >
      <SavedContentClient />
    </Suspense>
  );
}
