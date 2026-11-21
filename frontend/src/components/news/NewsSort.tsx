import React from "react";
import { ArrowUpDown } from "lucide-react";

interface NewsSortProps {
  sort: "latest" | "oldest" | "featured";
  onSortChange: (sort: "latest" | "oldest" | "featured") => void;
}

export function NewsSort({ sort, onSortChange }: NewsSortProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sort:</span>
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as "latest" | "oldest" | "featured")}
        className="bg-[#121520] border border-[#202738] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
      >
        <option value="latest">Latest First</option>
        <option value="featured">Featured First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  );
}
