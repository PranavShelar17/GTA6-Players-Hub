"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface NewsSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function NewsSearch({
  value,
  onChange,
  placeholder = "Search GTA 6 news, topics, keywords...",
}: NewsSearchProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced search trigger (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [internalValue, value, onChange]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#202738] bg-[#121520] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors"
      />
      {internalValue && (
        <button
          onClick={() => {
            setInternalValue("");
            onChange("");
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
