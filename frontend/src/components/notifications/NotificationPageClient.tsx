"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCheck, Settings, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  NotificationItem,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from "@/lib/notificationApi";
import { NotificationCard } from "./NotificationCard";
import { FilterCategory, NotificationFilters } from "./NotificationFilters";
import { NotificationEmptyState } from "./NotificationEmptyState";
import { NotificationLoadingSkeleton } from "./NotificationLoadingSkeleton";
import { Button } from "@/components/ui/Button";

interface NotificationPageClientProps {
  initialNotifications?: NotificationItem[];
}

export function NotificationPageClient({
  initialNotifications = [],
}: NotificationPageClientProps) {
  const { session, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Load notifications from backend
  const loadData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const isReadParam = activeFilter === "UNREAD" ? false : undefined;
      const typeParam =
        activeFilter !== "ALL" && activeFilter !== "UNREAD" ? activeFilter : undefined;

      const [items, countInfo] = await Promise.all([
        fetchNotifications(session.access_token, {
          is_read: isReadParam,
          notification_type: typeParam,
          limit: 50,
        }),
        fetchUnreadCount(session.access_token),
      ]);

      setNotifications(items);
      setUnreadTotal(countInfo.total_unread);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeFilter, session?.access_token]);

  const handleMarkRead = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await markNotificationAsRead(id, session.access_token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // Error
    }
  };

  const handleMarkAllRead = async () => {
    if (!session?.access_token) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(session.access_token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadTotal(0);
    } catch {
      // Error
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    try {
      await deleteNotification(id, session.access_token);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Error
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Title & Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Player Inbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Notification Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time alerts for verified news, price drops, event reminders, and account security.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadTotal > 0 && (
            <Button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#23293a] text-slate-300 hover:text-white"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark All Read</span>
            </Button>
          )}

          <Link href="/settings/notifications">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Preferences</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={unreadTotal}
        />
      </div>

      {/* Content */}
      {loading ? (
        <NotificationLoadingSkeleton />
      ) : notifications.length === 0 ? (
        <NotificationEmptyState filter={activeFilter} />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Verification Footer Pill */}
      <div className="mt-12 p-4 rounded-2xl border border-[#181c26] bg-[#090b10] flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          Push notifications and email alerts respect your quiet hours and active subscriptions. Notification events are cryptographically isolated to your player account.
        </span>
      </div>
    </div>
  );
}
