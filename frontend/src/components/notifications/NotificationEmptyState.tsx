"use client";

import React from "react";
import Link from "next/link";
import { BellOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotificationEmptyStateProps {
  filter?: string;
}

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#1c212e] bg-[#0c0e14] p-10 text-center max-w-md mx-auto my-10">
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
        <BellOff className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        {filter === "UNREAD" ? "You're All Caught Up!" : "No Notifications Yet"}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
        {filter === "UNREAD"
          ? "There are no unread alerts in your inbox. All official updates and price alerts have been acknowledged."
          : "When Take-Two files financial guidance, official trailers release, or retailer prices drop, you'll receive real-time alerts here."}
      </p>
      <Link href="/settings/notifications">
        <Button variant="outline" size="sm" className="gap-2 border-[#242b3d] text-slate-300 hover:text-white">
          <Settings className="w-3.5 h-3.5 text-orange-400" />
          <span>Notification Preferences</span>
        </Button>
      </Link>
    </div>
  );
}
