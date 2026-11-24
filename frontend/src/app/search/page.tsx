import React, { Suspense } from "react";
import { Metadata } from "next";
import { SearchResultsClient } from "@/components/search/SearchResultsClient";

export const metadata: Metadata = {
  title: "Global Search | GTA 6 Player Hub",
  description: "Search across official GTA 6 news, price deals, upcoming events, and community discussions.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] py-16 px-4 flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <span className="text-sm font-semibold">Loading search...</span>
          </div>
        </div>
      }
    >
      <SearchResultsClient />
    </Suspense>
  );
}
