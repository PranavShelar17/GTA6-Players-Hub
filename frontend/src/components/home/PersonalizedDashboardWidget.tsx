"use client";

import React from "react";
import Link from "next/link";
import { 
  User, 
  LayoutDashboard, 
  Settings, 
  Bookmark, 
  Bell, 
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function PersonalizedDashboardWidget() {
  const { user, profile, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Player";
  const initials = displayName.slice(0, 2).toUpperCase();
  const platform = profile?.preferred_platform || "PC";
  const platformColor = 
    platform === "PS5" ? "text-blue-400 bg-blue-500/10 border-blue-500/30" :
    platform === "Xbox" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
    "text-orange-400 bg-orange-500/10 border-orange-500/30";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-8 relative z-20">
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-[#141726] via-[#10131e] to-[#12141e] p-5 sm:p-6 shadow-2xl shadow-orange-950/20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          
          {/* Left: Avatar & Welcome text */}
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black text-lg flex items-center justify-center border-2 border-orange-500/40 shadow-md">
                {initials}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-orange-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Welcome back, Player
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${platformColor}`}>
                  {platform}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                {displayName}
                <span className="text-xs font-normal text-slate-400 ml-2">@{profile?.username || "player"}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your tailored GTA 6 platform intelligence feed is ready.
              </p>
            </div>
          </div>

          {/* Right: Quick action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Link href="/dashboard" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="sm" className="gap-1.5 w-full">
                <LayoutDashboard className="w-4 h-4" />
                Player Hub
              </Button>
            </Link>
            <Link href="/profile" className="flex-1 sm:flex-initial">
              <Button variant="secondary" size="sm" className="gap-1.5 w-full">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Link href="/wishlist">
              <Button variant="outline" size="sm" className="gap-1.5" title="Saved Wishlist">
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Wishlist</span>
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="gap-1.5" title="Notification Center">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="p-2" title="Preferences & Settings">
                <Settings className="w-4 h-4 text-slate-400 hover:text-white" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
