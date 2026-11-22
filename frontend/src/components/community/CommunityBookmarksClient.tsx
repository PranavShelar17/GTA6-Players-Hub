"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { CommunityPostItem } from "@/lib/communityApi";
import { CommunityPostCard } from "./CommunityPostCard";

interface CommunityBookmarksClientProps {
  initialPosts: CommunityPostItem[];
}

export function CommunityBookmarksClient({ initialPosts }: CommunityBookmarksClientProps) {
  const { session, isAuthenticated } = useAuth();
  const token = session?.access_token;
  const [posts, setPosts] = useState<CommunityPostItem[]>(initialPosts);

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-2xl font-black text-white">Sign in to view Bookmarks</h2>
        <p className="text-sm text-slate-400">
          Save posts, theories, and gameplay discussions to read anytime.
        </p>
        <Link href="/auth/login">
          <Button variant="primary" size="md">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/community">
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
          <Bookmark className="w-4 h-4" />
          <span>Player Library</span>
        </div>
        <h1 className="text-3xl font-black text-white">Saved Discussions</h1>
        <p className="text-sm text-slate-400 mt-1">
          Discussions, guides, and polls you bookmarked for later.
        </p>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No saved posts yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Click the bookmark icon on any community post to save it to your personal library.
            </p>
            <div className="pt-2">
              <Link href="/community">
                <Button variant="primary" size="sm">
                  Browse Community Feed
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              token={token}
              onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
