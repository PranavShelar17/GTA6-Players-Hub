"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Cpu, 
  Heart, 
  Bookmark, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Gamepad2,
  Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchPlayerBookmarks, NewsBookmarkItem } from "@/lib/newsApi";

export default function DashboardPage() {
  const { user, profile, preferences, activities, session } = useAuth();
  const [bookmarks, setBookmarks] = useState<NewsBookmarkItem[]>([]);

  useEffect(() => {
    async function loadBookmarks() {
      if (session?.access_token) {
        try {
          const data = await fetchPlayerBookmarks(session.access_token);
          setBookmarks(data);
        } catch {
          // Silent fallback
        }
      }
    }
    loadBookmarks();
  }, [session?.access_token]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Player";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Profile completion calculation
  const hasBio = Boolean(profile?.bio);
  const hasAvatar = Boolean(profile?.avatar_url);
  const hasCustomPlatform = Boolean(profile?.preferred_platform);
  const completionPercentage = 50 + (hasBio ? 20 : 0) + (hasAvatar ? 20 : 0) + (hasCustomPlatform ? 10 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="mb-8 p-6 rounded-2xl border border-[#1e2330] bg-gradient-to-r from-[#141724] to-[#0d0f17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/40"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white text-xl font-black shrink-0">
              {initials}
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Player Central</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your personal hub for saved hardware reports, active price alerts, and community posts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="outline" size="sm">View Profile</Button>
          </Link>
          <Link href="/settings">
            <Button variant="secondary" size="sm">Preferences</Button>
          </Link>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
        {/* Profile Completion Indicator */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Profile Completion</span>
              <span className="text-xs font-black text-orange-400">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-[#181d2c] h-2 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {completionPercentage < 100 ? (
                <Link href="/profile" className="text-orange-400 hover:underline">
                  Add bio & avatar to reach 100% →
                </Link>
              ) : (
                "Your player profile is 100% complete!"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Account Security</span>
              <Badge variant="verified">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Active
              </Badge>
            </div>
            <p className="text-xs font-bold text-white mt-1 truncate">{user?.email || "Authenticated Gamer"}</p>
            <p className="text-[11px] text-slate-400 mt-1">Supabase Auth Session Secured</p>
          </CardContent>
        </Card>

        {/* Selected Gaming Rig */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Primary Platform</span>
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs font-bold text-white mt-1">
              {profile?.preferred_platform || "PC"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Currency: {preferences?.preferred_currency || "USD"} • Region: {preferences?.preferred_country || "USA"}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Primary Dashboard Placeholders with Actionable Empty States */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Saved PC Reports */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Cpu className="w-5 h-5 text-orange-400" />
              <Badge variant="default">0 Reports</Badge>
            </div>
            <CardTitle className="text-base">Saved PC Reports</CardTitle>
            <CardDescription className="text-xs">
              Hardware benchmark evaluations and upgrade recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141724] border border-[#23293a] text-center text-xs text-slate-400">
              No saved hardware evaluations found. Configure your CPU and GPU to benchmark expected GTA VI performance.
            </div>
            <Link href="/pc-compatibility" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                Run PC Checker
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Tracked Deals & Wishlist */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Heart className="w-5 h-5 text-rose-400" />
              <Badge variant="default">0 Tracked</Badge>
            </div>
            <CardTitle className="text-base">Price Alert Watchlist</CardTitle>
            <CardDescription className="text-xs">
              Game editions and authorized store deals monitored for drops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-[#141724] border border-[#23293a] text-center text-xs text-slate-400">
              No editions currently tracked on your wishlist. Browse authorized global retailers to set price-drop triggers.
            </div>
            <Link href="/price-deals" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                Explore Deals Tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Bookmarked News & Articles */}
        <Card className="border-[#1e2330] bg-[#0c0e14]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Bookmark className="w-5 h-5 text-amber-400" />
              <Badge variant="default">{bookmarks.length} Saved</Badge>
            </div>
            <CardTitle className="text-base">Saved Bulletins</CardTitle>
            <CardDescription className="text-xs">
              Official announcements and verified articles saved for quick reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookmarks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bookmarks.slice(0, 3).map((bm) => (
                  <Link
                    key={bm.bookmark_id}
                    href={`/news/${bm.article.slug}`}
                    className="block p-2.5 rounded-lg bg-[#141724] border border-[#23293a] hover:border-orange-500/40 transition-colors group"
                  >
                    <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {bm.article.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{bm.article.source_name}</span>
                      <span className="text-orange-400">Read →</span>
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#141724] border border-[#23293a] text-center text-xs text-slate-400">
                No saved articles yet. Bookmark official Rockstar Newswire announcements to read them anytime.
              </div>
            )}
            <Link href="/news" className="block">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                Explore News Feed
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>

      {/* Account Activity Log */}
      <Card className="border-[#1e2330] bg-[#0c0e14]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Account Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Security and profile modification logs for your player account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="divide-y divide-[#1c212e] text-xs">
              {activities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{act.description}</p>
                    <p className="text-[11px] text-slate-400 uppercase font-mono">{act.activity_type}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#141724] border border-[#23293a] text-center text-xs text-slate-400">
              No recent security activity recorded yet. Account created and session established.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
