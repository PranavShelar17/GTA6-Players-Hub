import React from "react";
import { Tag, Newspaper } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Notification Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Real-time alerts for price drops, official announcements, and replies.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 mb-6">
        <strong>Phase 1 Shell:</strong> Push notification dispatchers and WebSocket notification center activate in Phase 6.
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white">Official Announcement Published</span>
              <span className="text-slate-500">Demo</span>
            </div>
            <p className="text-xs text-slate-400">Take-Two reconfirms Fall 2025 release window in corporate filing.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white">Price Watch Alert</span>
              <span className="text-slate-500">Demo</span>
            </div>
            <p className="text-xs text-slate-400">PlayStation 5 Deluxe Edition verified pre-orders now active.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
