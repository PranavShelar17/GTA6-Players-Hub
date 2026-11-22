"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  CommunityPlayerProfile,
  CommunityPostItem,
} from "@/lib/communityApi";
import { CommunityPlayerProfileHeader } from "./CommunityPlayerProfileHeader";
import { CommunityPostCard } from "./CommunityPostCard";

interface CommunityPlayerProfileClientProps {
  profile: CommunityPlayerProfile;
  initialPosts: CommunityPostItem[];
}

export function CommunityPlayerProfileClient({
  profile,
  initialPosts,
}: CommunityPlayerProfileClientProps) {
  const { session, user } = useAuth();
  const token = session?.access_token;
  const currentUserId = user?.id;

  const [posts, setPosts] = useState<CommunityPostItem[]>(initialPosts);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/community">
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community</span>
          </Button>
        </Link>
      </div>

      {/* Player Profile Header Card */}
      <CommunityPlayerProfileHeader
        profile={profile}
        token={token}
        currentUserId={currentUserId}
      />

      {/* Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-slate-800 pb-3">
          <MessageSquare className="w-5 h-5 text-orange-400" />
          <span>Posts by @{profile.username} ({posts.length})</span>
        </div>

        {posts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-2">
            <p className="text-sm font-semibold text-white">No discussions yet</p>
            <p className="text-xs text-slate-400">
              @{profile.username} has not posted in the community feed yet.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              token={token}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
