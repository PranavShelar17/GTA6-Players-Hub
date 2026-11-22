"use client";

import React, { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toggleSaveEvent } from "@/lib/eventApi";
import { cn } from "@/lib/utils";

interface SaveEventButtonProps {
  eventId: string;
  initialSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SaveEventButton({
  eventId,
  initialSaved = false,
  onToggle,
  className,
  size = "md",
}: SaveEventButtonProps) {
  const { session, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !session?.access_token) {
      if (typeof window !== "undefined") {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      return;
    }

    setLoading(true);
    try {
      const res = await toggleSaveEvent(eventId, session.access_token);
      setIsSaved(res.is_saved);
      if (onToggle) onToggle(res.is_saved);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "rounded-lg transition-colors flex items-center justify-center gap-1.5",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs font-semibold",
        isSaved
          ? "bg-orange-500/15 text-orange-400 border border-orange-500/40 hover:bg-orange-500/25"
          : "bg-[#141724] text-slate-300 border border-[#23293a] hover:text-white hover:border-slate-500",
        className
      )}
      title={isSaved ? "Saved to your personal calendar" : "Save to personal calendar"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-orange-400")} />
      )}
      <span>{isSaved ? "Saved" : "Save Event"}</span>
    </button>
  );
}
