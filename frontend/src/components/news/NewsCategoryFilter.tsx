"use client";

import React from "react";
import { NewsCategory } from "@/lib/newsApi";
import { cn } from "@/lib/utils";

interface NewsCategoryFilterProps {
  categories: NewsCategory[];
  selectedCategory?: string;
  onSelectCategory: (slug?: string) => void;
  totalArticlesCount: number;
}

export function NewsCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  totalArticlesCount,
}: NewsCategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
      <div className="flex items-center gap-2 min-w-max">
        {/* All News Pill */}
        <button
          onClick={() => onSelectCategory(undefined)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 border",
            !selectedCategory
              ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm"
              : "bg-[#121520] text-slate-400 border-[#202738] hover:text-white hover:border-slate-600"
          )}
        >
          <span>All News</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b2030] text-slate-300 font-mono">
            {totalArticlesCount}
          </span>
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? undefined : cat.slug)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 border",
                isSelected
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm"
                  : "bg-[#121520] text-slate-400 border-[#202738] hover:text-white hover:border-slate-600"
              )}
            >
              <span>{cat.name}</span>
              {cat.articles_count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1b2030] text-slate-300 font-mono">
                  {cat.articles_count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
