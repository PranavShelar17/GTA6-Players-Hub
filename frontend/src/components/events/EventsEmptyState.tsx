"use client";

import React from "react";
import { CalendarX2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EventsEmptyStateProps {
  onReset?: () => void;
  message?: string;
}

export function EventsEmptyState({
  onReset,
  message = "No events match your selected category or search filters.",
}: EventsEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#1c2230] bg-[#090b10] p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
        <CalendarX2 className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Events Found</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
        {message}
      </p>
      {onReset && (
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="gap-2 border-[#242b3d] text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
          <span>Reset Filters</span>
        </Button>
      )}
    </div>
  );
}
