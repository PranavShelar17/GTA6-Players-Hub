"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Moon, 
  Check, 
  Loader2, 
  Tag, 
  Newspaper, 
  Calendar, 
  Users, 
  Megaphone 
} from "lucide-react";
import { NotificationPreferences, updateNotificationPreferences } from "@/lib/notificationApi";
import { Button } from "@/components/ui/Button";

interface NotificationPreferencesFormProps {
  initialPreferences: NotificationPreferences;
  token: string;
}

export function NotificationPreferencesForm({
  initialPreferences,
  token,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const updated = await updateNotificationPreferences(token, prefs);
      setPrefs(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* SECTION 1: DELIVERY CHANNELS */}
      <div className="rounded-2xl border border-[#1e2330] bg-[#0c0e14] p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" />
          <span>Notification Delivery Channels</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Select how and where you wish to receive alerts from GTA 6 Player Hub.
        </p>

        <div className="divide-y divide-[#181c26] text-xs">
          {/* In-App */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">In-App Notification Centre</span>
                <span className="text-[11px] text-slate-400">
                  Real-time alerts in the top navbar and notification inbox.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.in_app_enabled}
              onChange={() => handleToggle("in_app_enabled")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* Email */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Email Digests & Critical Alerts</span>
                <span className="text-[11px] text-slate-400">
                  Direct emails for verified price drops and official trailer announcements.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.email_enabled}
              onChange={() => handleToggle("email_enabled")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* Web Push */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Browser Web Push</span>
                <span className="text-[11px] text-slate-400">
                  Receive instant desktop/mobile push alerts even when the tab is closed.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.push_enabled}
              onChange={() => handleToggle("push_enabled")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>
        </div>
      </div>

      {/* SECTION 2: TOPIC PREFERENCES */}
      <div className="rounded-2xl border border-[#1e2330] bg-[#0c0e14] p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-orange-400" />
          <span>Alert Topics & Subscriptions</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Fine-tune exactly which updates trigger notifications for your account.
        </p>

        <div className="divide-y divide-[#181c26] text-xs">
          {/* News */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Newspaper className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Official Rockstar Bulletins</span>
                <span className="text-[11px] text-slate-400">
                  Direct press releases, confirmed trailers, and official release announcements.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.news_updates}
              onChange={() => handleToggle("news_updates")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* Price Drops */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Price Drop & Pre-Order Triggers</span>
                <span className="text-[11px] text-slate-400">
                  Alerts when target price thresholds are met across verified retailers.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.price_alerts}
              onChange={() => handleToggle("price_alerts")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* Events */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Event Calendar Reminders</span>
                <span className="text-[11px] text-slate-400">
                  Reminders for earnings calls, livestreams, and community milestones you saved.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.event_reminders}
              onChange={() => handleToggle("event_reminders")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* Community */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Community Replies & Mentions</span>
                <span className="text-[11px] text-slate-400">
                  Notifications when someone responds to your discussion threads.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.community_activity}
              onChange={() => handleToggle("community_activity")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {/* System */}
          <label className="py-3.5 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Megaphone className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Platform Announcements</span>
                <span className="text-[11px] text-slate-400">
                  Feature releases, system maintenance, and platform updates.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.platform_announcements}
              onChange={() => handleToggle("platform_announcements")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: QUIET HOURS & TIMING */}
      <div className="rounded-2xl border border-[#1e2330] bg-[#0c0e14] p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Moon className="w-4 h-4 text-orange-400" />
          <span>Quiet Hours & Reminder Schedule</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Prevent notifications during your sleeping hours. Urgent security alerts will bypass quiet hours.
        </p>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between cursor-pointer pb-3 border-b border-[#181c26]">
            <div>
              <span className="font-semibold text-white block">Enable Quiet Hours</span>
              <span className="text-[11px] text-slate-400">
                Mute push and email notifications during specified hours.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.quiet_hours_enabled}
              onChange={() => handleToggle("quiet_hours_enabled")}
              className="w-4 h-4 rounded text-orange-500 border-[#23293a] bg-[#141724] focus:ring-0"
            />
          </label>

          {prefs.quiet_hours_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141724] border border-[#23293a] text-white text-xs focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141724] border border-[#23293a] text-white text-xs focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Default Event Reminder Timing
            </label>
            <select
              value={prefs.default_reminder_minutes}
              onChange={(e) => setPrefs({ ...prefs, default_reminder_minutes: Number(e.target.value) })}
              className="w-full sm:w-64 px-3 py-2 rounded-xl bg-[#141724] border border-[#23293a] text-white text-xs focus:outline-none focus:border-orange-500/50"
            >
              <option value={15}>15 minutes before event</option>
              <option value={60}>1 hour before event</option>
              <option value={1440}>1 day before event</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className="gap-2 px-6"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Preferences Saved!</span>
            </>
          ) : (
            <span>Save Notification Settings</span>
          )}
        </Button>
      </div>
    </form>
  );
}
