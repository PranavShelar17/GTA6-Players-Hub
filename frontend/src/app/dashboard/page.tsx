import React from "react";
import Link from "next/link";
import { 
  Cpu, 
  Heart, 
  Bookmark, 
  ShieldAlert
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="mb-8 p-6 rounded-2xl border border-[#1e2330] bg-gradient-to-r from-[#141724] to-[#0d0f17] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Player Central</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Player Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Your centralized hub for saved hardware reports, active price alerts, and community posts.</p>
        </div>
        <Link href="/settings">
          <Button variant="secondary" size="sm">Preferences</Button>
        </Link>
      </div>

      {/* Phase Notice */}
      <div className="mb-8 p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Phase 1 Shell:</strong> Personal authenticated dashboard aggregation will integrate with PostgreSQL & Supabase Auth in Phase 11.
        </div>
      </div>

      {/* Grid of Dashboard Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Saved PC Reports */}
        <Card className="border-[#1e2330]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Cpu className="w-5 h-5 text-orange-400" />
              <Badge variant="default">0 Reports</Badge>
            </div>
            <CardTitle className="text-base">Saved PC Reports</CardTitle>
            <CardDescription className="text-xs">
              Hardware benchmark evaluations and upgrade plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pc-compatibility">
              <Button variant="outline" size="sm" className="w-full">
                Run PC Checker →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Tracked Deals & Wishlist */}
        <Card className="border-[#1e2330]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Heart className="w-5 h-5 text-rose-400" />
              <Badge variant="default">0 Tracked</Badge>
            </div>
            <CardTitle className="text-base">Price Watchlist</CardTitle>
            <CardDescription className="text-xs">
              Editions being monitored for price drop alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/price-deals">
              <Button variant="outline" size="sm" className="w-full">
                View Price Tracker →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Bookmarked News & Articles */}
        <Card className="border-[#1e2330]">
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <Bookmark className="w-5 h-5 text-amber-400" />
              <Badge variant="default">0 Bookmarks</Badge>
            </div>
            <CardTitle className="text-base">Saved Bulletins</CardTitle>
            <CardDescription className="text-xs">
              Official announcements saved for quick access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/news">
              <Button variant="outline" size="sm" className="w-full">
                Explore News Feed →
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
