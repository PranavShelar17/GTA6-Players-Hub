"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CommunityPostItem, fetchUserBookmarks } from "@/lib/communityApi";
import { CommunityBookmarksClient } from "@/components/community/CommunityBookmarksClient";

export default function BookmarksPage() {
  const { session, isLoading } = useAuth();
  const token = session?.access_token;
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoadingPosts(false);
        return;
      }
      try {
        const res = await fetchUserBookmarks(token);
        setPosts(res.posts);
      } catch (err) {
        console.error("Bookmarks error:", err);
      } finally {
        setLoadingPosts(false);
      }
    }
    if (token) {
      load();
    } else if (!isLoading) {
      setLoadingPosts(false);
    }
  }, [token, isLoading]);

  if (isLoading || loadingPosts) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Loading saved discussions...</p>
      </div>
    );
  }

  return <CommunityBookmarksClient initialPosts={posts} />;
}
