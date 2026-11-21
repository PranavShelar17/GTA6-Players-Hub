import React from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsVerificationBadgeProps {
  status: "OFFICIAL" | "VERIFIED" | "RUMOUR" | "UNCONFIRMED" | string;
  className?: string;
  showTooltip?: boolean;
}

export function NewsVerificationBadge({
  status,
  className,
}: NewsVerificationBadgeProps) {
  const normStatus = (status || "UNCONFIRMED").toUpperCase();

  switch (normStatus) {
    case "OFFICIAL":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30",
            className
          )}
          title="Official: Communicated directly by Rockstar Games or Take-Two Interactive."
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official</span>
        </span>
      );

    case "VERIFIED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
            className
          )}
          title="Verified: Confirmed by reputable gaming press with substantiated evidence."
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified</span>
        </span>
      );

    case "RUMOUR":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30",
            className
          )}
          title="Rumour: Uncorroborated report or community speculation. Not established as fact."
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Rumour</span>
        </span>
      );

    case "UNCONFIRMED":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700/40 text-slate-400 border border-slate-600/40",
            className
          )}
          title="Unconfirmed: Information currently awaiting independent verification."
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Unconfirmed</span>
        </span>
      );
  }
}
