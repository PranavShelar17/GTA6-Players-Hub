"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EventSearch({
  value,
  onChange,
  placeholder = "Search GTA 6 milestones, earnings calls, trailer debuts...",
  className,
}: EventSearchProps) {
  const [localVal, setLocalVal] = useState(value);

  // Debounced update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localVal, onChange, value]);

  // Sync if parent updates
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#0f121a] border border-[#222838] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
      />
      {localVal && (
        <button
          onClick={() => {
            setLocalVal("");
            onChange("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
