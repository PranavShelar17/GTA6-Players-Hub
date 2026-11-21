import React from "react";
import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NewsEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export function NewsEmptyState({
  title = "No Articles Found",
  description = "No articles matched your active search or filter criteria. Try clearing some filters or searching for different keywords.",
  onResetFilters,
}: NewsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-[#232938] bg-[#0c0e15]/60 my-6">
      <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#252c3e] mb-4 text-slate-500">
        <Newspaper className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {onResetFilters && (
        <Button variant="secondary" size="sm" onClick={onResetFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
