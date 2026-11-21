import React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = <FolderOpen className="w-10 h-10 text-slate-500" />,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-[#232938] bg-[#0e1017]/50", className)}>
      <div className="mb-4 p-3 rounded-full bg-[#181c28] border border-[#262d3d]">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-200 mb-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
