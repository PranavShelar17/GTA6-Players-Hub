"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Check,
  Pin,
  Flag,
  Trash2,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";
import {
  CommunityPostItem,
  toggleLikePost,
  toggleBookmarkPost,
  deleteCommunityPost,
} from "@/lib/communityApi";
import { Badge } from "@/components/ui/Badge";
import { CommunityPollComponent } from "./CommunityPollComponent";
import { ReportDialog } from "./ReportDialog";

interface CommunityPostCardProps {
  post: CommunityPostItem;
  token?: string;
  onPostDeleted?: (postId: string) => void;
  showFullContent?: boolean;
}

export function CommunityPostCard({
  post,
  token,
  onPostDeleted,
  showFullContent = false,
}: CommunityPostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Like action
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    const prevLiked = isLiked;
    const prevCount = likesCount;
    // Optimistic
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikePost(post.id, token);
      setIsLiked(res.is_liked);
      setLikesCount(res.likes_count);
    } catch {
      // Revert
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  // Bookmark action
  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    const prevBm = isBookmarked;
    setIsBookmarked(!prevBm);
    try {
      const res = await toggleBookmarkPost(post.id, token);
      setIsBookmarked(res.is_bookmarked);
    } catch {
      setIsBookmarked(prevBm);
    }
  };

  // Share action
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/community/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this GTA 6 community post: ${post.title}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete post (author only)
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || !confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      await deleteCommunityPost(post.id, token);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      alert("Failed to delete post: " + (err instanceof Error ? err.message : "Unknown error"));
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <article className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-lg hover:shadow-xl p-5 sm:p-6 overflow-hidden">
        {/* Pinned Ribbon */}
        {post.is_pinned && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-950/40 border border-orange-800/40 px-3 py-1 rounded-full w-fit mb-3">
            <Pin className="w-3.5 h-3.5 fill-orange-400" />
            <span>Pinned Announcement</span>
          </div>
        )}

        {/* Author Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link
            href={`/community/player/${post.author.username}`}
            className="flex items-center gap-3 group/author"
          >
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-slate-700 shadow-md">
              {post.author.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{post.author.display_name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white group-hover/author:text-orange-400 transition-colors">
                  {post.author.display_name}
                </span>
                {post.author.is_verified && (
                  <ShieldCheck className="w-4 h-4 text-orange-400 fill-orange-400/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formattedDate}</span>
                {post.author.preferred_platform && (
                  <>
                    <span>•</span>
                    <span className="text-[11px] font-medium text-slate-300">
                      {post.author.preferred_platform}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* Right side: Category & Dropdown Menu */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] bg-slate-800 text-slate-300 border-slate-700">
              {post.category.name}
            </Badge>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-950 border border-slate-800 shadow-xl py-1 z-20 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsReportOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-900 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                    <span>Report post</span>
                  </button>
                  {post.is_author && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? "Deleting..." : "Delete post"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Title & Content */}
        <Link href={`/community/post/${post.id}`} className="block group/link space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-white group-hover/link:text-orange-400 transition-colors leading-snug">
            {post.title}
          </h3>

          <p className={`text-slate-300 text-sm leading-relaxed ${!showFullContent ? "line-clamp-3" : "whitespace-pre-line"}`}>
            {post.content}
          </p>
        </Link>

        {/* Media Attachments Gallery */}
        {post.media && post.media.length > 0 && (
          <div className="my-4">
            <div
              className={`grid gap-2 rounded-xl overflow-hidden ${
                post.media.length === 1
                  ? "grid-cols-1"
                  : post.media.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {post.media.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 group/img"
                >
                  <Image
                    src={item.media_url}
                    alt={`Attachment ${idx + 1}`}
                    fill
                    className="object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Component */}
        {post.poll && <CommunityPollComponent poll={post.poll} token={token} />}

        {/* Interactions Footer Bar */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Like Button */}
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                isLiked
                  ? "text-rose-500 bg-rose-950/30 border border-rose-800/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500" : ""}`} />
              <span className="font-semibold">{likesCount}</span>
            </button>

            {/* Comments Count */}
            <Link
              href={`/community/post/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-semibold">{post.comments_count}</span>
            </Link>

            {/* Bookmark */}
            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                isBookmarked
                  ? "text-orange-400 bg-orange-950/30 border border-orange-800/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-orange-400" : ""}`} />
              <span className="hidden sm:inline font-semibold">
                {isBookmarked ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Share</span>
              </>
            )}
          </button>
        </div>
      </article>

      {/* Moderation Report Dialog */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="POST"
        targetId={post.id}
        targetTitle={post.title}
        token={token}
      />
    </>
  );
}
