"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  CommunityComment,
  CommunityPostDetail,
  fetchPostComments,
  fetchPostDetail,
} from "@/lib/communityApi";
import { CommunityPostCard } from "./CommunityPostCard";
import { CommentSection } from "./CommentSection";

interface CommunityPostDetailClientProps {
  initialPost: CommunityPostDetail;
  initialComments: CommunityComment[];
}

export function CommunityPostDetailClient({
  initialPost,
  initialComments,
}: CommunityPostDetailClientProps) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [post, setPost] = useState<CommunityPostDetail>(initialPost);
  const [comments, setComments] = useState<CommunityComment[]>(initialComments);

  const handleRefreshPostAndComments = async () => {
    try {
      const [updatedPost, updatedComments] = await Promise.all([
        fetchPostDetail(post.id, token),
        fetchPostComments(post.id, token),
      ]);
      setPost(updatedPost);
      setComments(updatedComments);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/community">
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Community Feed</span>
          </Button>
        </Link>
      </div>

      {/* Main Post Card with full content */}
      <CommunityPostCard
        post={post}
        token={token}
        showFullContent={true}
        onPostDeleted={() => {
          window.location.href = "/community";
        }}
      />

      {/* Discussion & Comments Section */}
      <CommentSection
        postId={post.id}
        initialComments={comments}
        token={token}
        onCommentsUpdated={handleRefreshPostAndComments}
      />
    </div>
  );
}
