import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "official" | "verified" | "rumour" | "unconfirmed" | "default" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors";

  const variants = {
    official: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    verified: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    rumour: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    unconfirmed: "bg-slate-700/40 text-slate-400 border border-slate-600/40",
    default: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    outline: "bg-transparent text-slate-300 border border-slate-700",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
