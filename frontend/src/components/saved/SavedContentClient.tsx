"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bookmark,
  ShieldCheck,
  Tag,
  Calendar,
  Users,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPlayerSavedContent,
  removePlayerSavedItem,
  UnifiedSavedItem,
} from "@/lib/savedApi";
import { cn } from "@/lib/utils";

const SAVED_TABS = [
  { id: "ALL", label: "All Saved", icon: Bookmark },
  { id: "NEWS", label: "News Bookmarks", icon: ShieldCheck },
  { id: "DEALS", label: "Price Wishlist", icon: Tag },
  { id: "EVENTS", label: "Saved Events", icon: Calendar },
  { id: "COMMUNITY", label: "Discussions", icon: Users },
];

export function SavedContentClient() {
  const { session, isAuthenticated, isLoading: authLoading } = useAuth();
  const sessionToken = session?.access_token;

  const [activeTab, setActiveTab] = useState("ALL");
  const [items, setItems] = useState<UnifiedSavedItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [countsByType, setCountsByType] = useState({
    ALL: 0,
    NEWS: 0,
    DEALS: 0,
    EVENTS: 0,
    COMMUNITY: 0,
  });

  const loadSavedContent = useCallback(
    async (type: string, page: number) => {
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetchPlayerSavedContent({
          type,
          page,
          pageSize: 15,
          token: sessionToken,
        });

        if (res.success && res.data) {
          setItems(res.data.items || []);
          setTotalPages(res.data.total_pages || 1);
          if (res.data.counts_by_type) {
            setCountsByType({
              ALL: res.data.counts_by_type.ALL || 0,
              NEWS: res.data.counts_by_type.NEWS || 0,
              DEALS: res.data.counts_by_type.DEALS || 0,
              EVENTS: res.data.counts_by_type.EVENTS || 0,
              COMMUNITY: res.data.counts_by_type.COMMUNITY || 0,
            });
          }
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error loading saved items:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken]
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedContent(activeTab, currentPage);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, activeTab, currentPage, loadSavedContent]);

  const handleRemove = async (item: UnifiedSavedItem) => {
    if (!sessionToken) return;

    // Optimistic UI removal
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setCountsByType((prev) => ({
      ...prev,
      ALL: Math.max(0, prev.ALL - 1),
      [item.saved_type]: Math.max(0, (prev[item.saved_type as keyof typeof prev] || 1) - 1),
    }));

    try {
      const res = await removePlayerSavedItem(sessionToken, item.saved_type, item.id);
      if (!res.success) {
        // Rollback on failure
        loadSavedContent(activeTab, currentPage);
      }
    } catch {
      loadSavedContent(activeTab, currentPage);
    }
  };

  const getEmptyStateExploreLink = () => {
    switch (activeTab) {
      case "NEWS":
        return { href: "/news", label: "Browse Latest News" };
      case "DEALS":
        return { href: "/price-deals", label: "Explore GTA 6 Deals" };
      case "EVENTS":
        return { href: "/events", label: "Check Events Calendar" };
      case "COMMUNITY":
        return { href: "/community", label: "Join Community Discussions" };
      default:
        return { href: "/news", label: "Explore Platform Content" };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] py-16 px-4 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
          <span className="text-sm font-semibold">Authenticating player...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090e] py-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0c0f18] border border-[#20273a] text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Player Saved Content</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Sign in with your GTA 6 Player Hub account to access your bookmarked news articles, price alerts wishlist,
              saved events, and pinned discussions.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Player Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Bookmark className="w-8 h-8 text-orange-500" />
              Unified Saved Content
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Access all your bookmarked news, wishlisted editions, upcoming saved events, and community discussions in
              one consolidated player dashboard.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#1c212e] pb-3">
          {SAVED_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = countsByType[tab.id as keyof typeof countsByType] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-[#0e121c] text-slate-400 hover:text-white hover:bg-[#151928] border border-[#1d2232]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-bold",
                    isActive ? "bg-black/30 text-white" : "bg-[#181d2c] text-slate-300"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Items List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#0e111a] border border-[#1c212e] animate-pulse space-y-3"
              >
                <div className="w-20 h-4 bg-slate-800 rounded" />
                <div className="w-2/3 h-5 bg-slate-800 rounded" />
                <div className="w-full h-4 bg-slate-850 rounded" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0d1019] border border-[#1d2334] hover:border-orange-500/40 hover:bg-[#111522] transition-all group flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold px-2 py-0.5 rounded bg-[#161b2b] text-slate-300 border border-[#23293c]">
                      {item.saved_type}
                    </span>

                    {item.badge && (
                      <span className="px-2 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-800/40 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}

                    <span className="text-slate-500 text-[11px]">
                      Saved on {new Date(item.saved_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Link
                    href={item.url_path}
                    className="block text-base sm:text-lg font-bold text-white group-hover:text-orange-400 transition-colors truncate"
                  >
                    {item.title}
                  </Link>

                  {item.description && (
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Actions: View and Remove */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <Link
                    href={item.url_path}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#171c2b] hover:bg-orange-500 hover:text-white border border-[#232a3d] text-xs font-semibold text-slate-300 transition-all"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleRemove(item)}
                    className="p-2 rounded-xl bg-[#171c2b] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#232a3d] transition-all"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Saved State */
          <div className="py-16 text-center space-y-4 rounded-2xl bg-[#0c0e17] border border-[#1c212e] p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#151928] flex items-center justify-center text-slate-500">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No saved items yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              You haven&apos;t saved any items under {activeTab === "ALL" ? "your account" : activeTab}. Use the bookmark and
              save buttons across the platform to track your favorites.
            </p>
            <div className="pt-2">
              <Link
                href={getEmptyStateExploreLink().href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors"
              >
                <span>{getEmptyStateExploreLink().label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#1c212e] pt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f121d] border border-[#1e2334] text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161a28] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400">
              Page <strong className="text-white">{currentPage}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f121d] border border-[#1e2334] text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161a28] transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
