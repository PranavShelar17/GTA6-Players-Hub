import React from "react";
import { Search, X } from "lucide-react";

interface PriceSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function PriceSearch({ searchQuery, onSearchChange }: PriceSearchProps) {
  return (
    <div className="relative w-full sm:w-72 md:w-80">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Search editions or stores..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2 bg-[#12151f] border border-[#202738] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
