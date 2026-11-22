"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  Flame,
  Clock,
  UserCheck,
  RotateCcw,
  MessageSquare,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CommunityCategory,
  CommunityPostItem,
  fetchCommunityPosts,
} from "@/lib/communityApi";
import { CommunityPostCard } from "./CommunityPostCard";

interface CommunityFeedProps {
  initialPosts: CommunityPostItem[];
  categories: CommunityCategory[];
  token?: string;
  isAuthenticated: boolean;
}

export function CommunityFeed({
  initialPosts,
  categories,
  token,
  isAuthenticated,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPostItem[]>(initialPosts);
  const [feedType, setFeedType] = useState<"latest" | "popular" | "following">("latest");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadFeed = async (
    type = feedType,
    cat = selectedCategory,
    query = searchQuery
  ) => {
    setIsLoading(true);
    try {
      const res = await fetchCommunityPosts(
        {
          feed_type: type,
          category: cat || undefined,
          search: query.trim() || undefined,
          limit: 30,
        },
        token
      );
      setPosts(res.posts);
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (type: "latest" | "popular" | "following") => {
    setFeedType(type);
    loadFeed(type, selectedCategory, searchQuery);
  };

  const handleCategorySelect = (slug: string | null) => {
    const nextCat = selectedCategory === slug ? null : slug;
    setSelectedCategory(nextCat);
    loadFeed(feedType, nextCat, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeed(feedType, selectedCategory, searchQuery);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setFeedType("latest");
    loadFeed("latest", null, "");
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="space-y-6">
      {/* Feed Controls: Search Bar & Create Post Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Input
            icon={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search discussions by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </form>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link href="/community/bookmarks">
              <Button variant="secondary" size="md" className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Bookmarks</span>
              </Button>
            </Link>
          )}

          <Link href="/community/create">
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Create Post</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Sorting Tabs: Latest, Popular, Following */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("latest")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedType === "latest"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Latest</span>
          </button>

          <button
            onClick={() => handleTabChange("popular")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedType === "popular"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Popular</span>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = "/auth/login";
                return;
              }
              handleTabChange("following");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              feedType === "following"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Following</span>
          </button>
        </div>

        {(selectedCategory || searchQuery) && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategorySelect(null)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            selectedCategory === null
              ? "bg-slate-800 text-white border-orange-500/60"
              : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          All Topics
        </button>

        {categories.map((c) => {
          const isSelected = selectedCategory === c.slug;
          return (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.slug)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isSelected
                  ? "bg-orange-950/40 text-orange-400 border-orange-500/80 font-bold"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-800 rounded" />
                  <div className="w-20 h-2.5 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-3/4 h-5 bg-slate-800 rounded" />
              <div className="w-full h-12 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 space-y-4">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No discussions found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {feedType === "following"
              ? "You haven't followed any players yet or followed players haven't posted."
              : "No community posts match your selected category or search filter."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Link href="/community/create">
              <Button variant="primary" size="sm">
                Start a Discussion
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              token={token}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
