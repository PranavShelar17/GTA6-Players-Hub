"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  NotificationPreferences,
  fetchNotificationPreferences,
} from "@/lib/notificationApi";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";

export default function NotificationSettingsPage() {
  const { session, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      if (session?.access_token) {
        try {
          const res = await fetchNotificationPreferences(session.access_token);
          setPreferences(res);
        } catch {
          // Fallback defaults
          setPreferences({
            in_app_enabled: true,
            email_enabled: true,
            push_enabled: false,
            news_updates: true,
            price_alerts: true,
            event_reminders: true,
            community_activity: true,
            platform_announcements: true,
            default_reminder_minutes: 60,
            quiet_hours_enabled: false,
            quiet_hours_start: "22:00",
            quiet_hours_end: "08:00",
            timezone: "UTC",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadPrefs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, session?.access_token]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Authentication Required
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Please sign in to your player account to manage notification delivery preferences.
        </p>
        <Link
          href="/login?redirect=/settings/notifications"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" />
          <span>Back to Notifications</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Notification Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Control real-time in-app alerts, email digests, Web Push notifications, and quiet hours.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
          <span className="text-xs">Loading preferences...</span>
        </div>
      ) : preferences && session?.access_token ? (
        <NotificationPreferencesForm
          initialPreferences={preferences}
          token={session.access_token}
        />
      ) : null}
    </div>
  );
}
