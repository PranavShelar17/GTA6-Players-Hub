"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { EventVerificationStatus } from "@/lib/eventApi";
import { cn } from "@/lib/utils";

interface EventVerificationBadgeProps {
  status: EventVerificationStatus;
  className?: string;
  showIcon?: boolean;
}

export function EventVerificationBadge({
  status,
  className,
  showIcon = true,
}: EventVerificationBadgeProps) {
  switch (status) {
    case "OFFICIAL":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
            "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40",
            className
          )}
          title="Directly announced by Rockstar Games or Take-Two Interactive"
        >
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
          <span>OFFICIAL</span>
        </span>
      );

    case "VERIFIED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
            "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
            className
          )}
          title="Independently verified from reliable industry schedules and filings"
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>VERIFIED</span>
        </span>
      );

    case "COMMUNITY":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
            "bg-purple-500/10 text-purple-300 border border-purple-500/30",
            className
          )}
          title="Organized by verified creator networks and player communities"
        >
          {showIcon && <Users className="w-3.5 h-3.5 text-purple-400" />}
          <span>COMMUNITY</span>
        </span>
      );

    case "UNCONFIRMED":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
            "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30",
            className
          )}
          title="Industry rumour or speculative target date not yet officially confirmed"
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />}
          <span>UNCONFIRMED</span>
        </span>
      );
  }
}
