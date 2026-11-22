"use client";

import React from "react";
import Link from "next/link";
import { 
  Newspaper, 
  Tag, 
  Calendar, 
  Megaphone, 
  ShieldAlert, 
  Check, 
  Trash2,
  ExternalLink 
} from "lucide-react";
import { NotificationItem, NotificationType } from "@/lib/notificationApi";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "NEWS_UPDATE":
      return {
        icon: Newspaper,
        colorClass: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        label: "News Update",
      };
    case "PRICE_DROP":
      return {
        icon: Tag,
        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        label: "Price Alert",
      };
    case "EVENT_REMINDER":
    case "EVENT_UPDATE":
      return {
        icon: Calendar,
        colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        label: "Event Reminder",
      };
    case "PLATFORM_ANNOUNCEMENT":
      return {
        icon: Megaphone,
        colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        label: "Platform Announcement",
      };
    case "ACCOUNT_SECURITY":
    default:
      return {
        icon: ShieldAlert,
        colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        label: "Security Alert",
      };
  }
}

function formatRelativeTime(dateIso: string): string {
  try {
    const diffMs = new Date().getTime() - new Date(dateIso).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(dateIso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const { icon: Icon, colorClass, label } = getNotificationIcon(notification.notification_type);
  const timeString = formatRelativeTime(notification.created_at);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start gap-4",
        notification.is_read
          ? "border-[#1c212e] bg-[#0c0e14]/70 opacity-80 hover:opacity-100"
          : "border-orange-500/30 bg-gradient-to-r from-[#141724] to-[#0e1017] shadow-lg shadow-orange-500/5"
      )}
    >
      {/* Category Icon */}
      <div className={cn("p-2.5 rounded-xl border shrink-0", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {label}
            </span>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">{timeString}</span>
        </div>

        <h4 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug">
          {notification.title}
        </h4>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {notification.message}
        </p>

        {/* Link / Action trigger */}
        {notification.reference_url && (
          <Link
            href={notification.reference_url}
            onClick={() => {
              if (!notification.is_read) onMarkRead(notification.id);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <span>View Related Details</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-[#1c212e] pt-2 sm:pt-0 w-full sm:w-auto justify-end">
        {!notification.is_read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-[#181d2c] transition-colors"
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
          title="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
