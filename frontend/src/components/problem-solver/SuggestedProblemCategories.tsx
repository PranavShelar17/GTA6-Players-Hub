"use client";

import React from "react";
import {
  Download,
  Flame,
  Monitor,
  Zap,
  Cpu,
  Wifi,
  Gamepad2,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SuggestedProblemCategory } from "@/lib/problemSolverApi";

interface SuggestedProblemCategoriesProps {
  categories: SuggestedProblemCategory[];
  onSelectQuery: (query: string, categoryId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Download: Download,
  Flame: Flame,
  Monitor: Monitor,
  Zap: Zap,
  Cpu: Cpu,
  Wifi: Wifi,
  Gamepad2: Gamepad2,
  HelpCircle: HelpCircle,
};

export function SuggestedProblemCategories({
  categories,
  onSelectQuery,
}: SuggestedProblemCategoriesProps) {
  return (
    <div id="suggested-categories-section" className="mb-10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span>Suggested Troubleshooting Categories</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick a common technical issue or click a quick prompt to start diagnosing instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const IconComponent = ICON_MAP[cat.icon_name] || HelpCircle;

          return (
            <div
              key={cat.id}
              className="group p-4 rounded-xl bg-[#121624] border border-[#1e2538] hover:border-orange-500/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {cat.description}
                </p>
              </div>

              {/* Sample Queries */}
              <div className="space-y-1.5 pt-2 border-t border-[#1a2030]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Quick Prompts:
                </span>
                {cat.sample_queries.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => onSelectQuery(q, cat.id)}
                    className="w-full text-left text-[11px] text-slate-300 hover:text-orange-300 hover:bg-[#1a2136] px-2 py-1.5 rounded bg-[#161a29] border border-[#20273c] transition-colors flex items-center justify-between group/btn cursor-pointer"
                  >
                    <span className="truncate pr-2">{q}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover/btn:text-orange-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
