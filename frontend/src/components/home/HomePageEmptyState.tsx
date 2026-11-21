import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HomePageEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HomePageEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: HomePageEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 rounded-xl border border-dashed border-[#232938] bg-[#0e1017]/60">
      <div className="p-3 rounded-full bg-[#161a26] border border-[#262d3d] mb-3 text-slate-500">
        <FolderOpen className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
