"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toggleBookmark } from "@/lib/newsApi";
import { cn } from "@/lib/utils";

interface NewsBookmarkButtonProps {
  articleId: string;
  initialBookmarked?: boolean;
  onBookmarkChanged?: (newState: boolean) => void;
  className?: string;
  variant?: "icon" | "button";
}

export function NewsBookmarkButton({
  articleId,
  initialBookmarked = false,
  onBookmarkChanged,
  className,
  variant = "icon",
}: NewsBookmarkButtonProps) {
  const router = useRouter();
  const { isAuthenticated, session } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoginTooltip, setShowLoginTooltip] = useState<boolean>(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !session?.access_token) {
      setShowLoginTooltip(true);
      setTimeout(() => setShowLoginTooltip(false), 3000);
      return;
    }

    try {
      setLoading(true);
      const res = await toggleBookmark(articleId, isBookmarked, session.access_token);
      if (res.success) {
        setIsBookmarked(res.is_bookmarked);
        if (onBookmarkChanged) onBookmarkChanged(res.is_bookmarked);
      }
    } catch {
      // Revert if error
    } finally {
      setLoading(false);
    }
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push("/login");
  };

  if (variant === "button") {
    return (
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150",
            isBookmarked
              ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
              : "bg-[#141724] border-[#252b3d] text-slate-300 hover:text-white hover:border-slate-600",
            className
          )}
        >
          <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-orange-400 text-orange-400")} />
          <span>{isBookmarked ? "Bookmarked" : "Save Article"}</span>
        </button>

        {showLoginTooltip && (
          <div
            onClick={handleTooltipClick}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-[#141824] border border-orange-500/40 text-center text-[11px] text-white shadow-xl cursor-pointer z-30"
          >
            <p className="font-bold text-orange-400">Sign In Required</p>
            <p className="text-slate-400 mt-0.5">Log in to save articles to your dashboard.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={loading}
        title={isBookmarked ? "Remove Bookmark" : "Save to Bookmarks"}
        className={cn(
          "p-2 rounded-lg transition-colors border",
          isBookmarked
            ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
            : "text-slate-400 hover:text-white bg-[#141824]/60 border-transparent hover:border-[#2b3348]",
          className
        )}
      >
        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-orange-400 text-orange-400")} />
      </button>

      {showLoginTooltip && (
        <div
          onClick={handleTooltipClick}
          className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-[#141824] border border-orange-500/40 text-center text-[11px] text-white shadow-xl cursor-pointer z-30"
        >
          <p className="font-bold text-orange-400">Sign In Required</p>
          <p className="text-slate-400 mt-0.5">Click here to log in and save articles.</p>
        </div>
      )}
    </div>
  );
}
