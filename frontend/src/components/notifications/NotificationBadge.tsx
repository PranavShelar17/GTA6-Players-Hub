"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchUnreadCount } from "@/lib/notificationApi";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ className, showZero = false }: NotificationBadgeProps) {
  const { session, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCount() {
      if (isAuthenticated && session?.access_token) {
        try {
          const res = await fetchUnreadCount(session.access_token);
          if (isMounted) setUnreadCount(res.total_unread);
        } catch {
          // Silent fallback
        }
      } else {
        if (isMounted) setUnreadCount(0);
      }
    }

    loadCount();
    // Poll every 45s for updates
    const interval = setInterval(loadCount, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, session?.access_token]);

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#151824] transition-colors inline-flex items-center justify-center",
        className
      )}
      title="Notification Centre"
      aria-label="Notification Centre"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#090a0f] shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </>
      )}
      {showZero && unreadCount === 0 && (
        <span className="sr-only">0 unread notifications</span>
      )}
    </Link>
  );
}
