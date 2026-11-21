import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  tag?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  tag,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6", className)}>
      <div>
        {tag && (
          <span className="text-xs font-bold tracking-wider text-orange-400 uppercase mb-1 block">
            {tag}
          </span>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors group"
        >
          {viewAllLabel}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
