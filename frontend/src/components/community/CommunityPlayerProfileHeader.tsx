"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  UserPlus,
  UserCheck,
  Flag,
  ShieldAlert,
  VolumeX,
  Volume2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CommunityPlayerProfile,
  toggleFollowPlayer,
  toggleBlockPlayer,
  toggleMutePlayer,
} from "@/lib/communityApi";
import { ReportDialog } from "./ReportDialog";

interface CommunityPlayerProfileHeaderProps {
  profile: CommunityPlayerProfile;
  token?: string;
  currentUserId?: string;
}

export function CommunityPlayerProfileHeader({
  profile,
  token,
  currentUserId,
}: CommunityPlayerProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followersCount, setFollowersCount] = useState(profile.followers_count);
  const [isBlocked, setIsBlocked] = useState(profile.is_blocked);
  const [isMuted, setIsMuted] = useState(profile.is_muted);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isSelf = currentUserId === profile.id;

  const handleToggleFollow = async () => {
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    const prevFollowing = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsUpdatingFollow(true);

    try {
      const res = await toggleFollowPlayer(profile.id, token);
      setIsFollowing(res.is_following);
      setFollowersCount(res.followers_count);
    } catch {
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!token) return;
    if (
      !confirm(
        isBlocked
          ? `Unblock @${profile.username}?`
          : `Block @${profile.username}? Their posts and comments will be hidden and you will unfollow each other.`
      )
    )
      return;

    try {
      const res = await toggleBlockPlayer(profile.id, token);
      setIsBlocked(res.is_blocked);
      if (res.is_blocked) setIsFollowing(false);
      setMenuOpen(false);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Failed to toggle block"));
    }
  };

  const handleToggleMute = async () => {
    if (!token) return;
    try {
      const res = await toggleMutePlayer(profile.id, token);
      setIsMuted(res.is_muted);
      setMenuOpen(false);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Failed to toggle mute"));
    }
  };

  return (
    <>
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl overflow-hidden mb-8">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Identification */}
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-3xl shrink-0 border-2 border-slate-700 shadow-2xl">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{profile.display_name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {profile.display_name}
                </h1>
                {profile.is_verified && (
                  <ShieldCheck className="w-5 h-5 text-orange-400 fill-orange-400/20" />
                )}
                {profile.preferred_platform && (
                  <Badge variant="outline" className="text-xs bg-slate-800 text-slate-300">
                    {profile.preferred_platform}
                  </Badge>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-400">
                @{profile.username}
              </div>

              {profile.bio && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed pt-1">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {!isSelf && token && (
              <>
                <Button
                  variant={isFollowing ? "secondary" : "primary"}
                  size="sm"
                  disabled={isUpdatingFollow || isBlocked}
                  onClick={handleToggleFollow}
                  className="flex items-center gap-1.5"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-orange-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </Button>

                {/* More actions menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl py-1 z-30 text-xs">
                      <button
                        onClick={handleToggleMute}
                        className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-slate-900 flex items-center gap-2"
                      >
                        {isMuted ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Unmute player</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mute player</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleToggleBlock}
                        className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{isBlocked ? "Unblock player" : "Block player"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setIsReportOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report player</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800 text-center sm:text-left">
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{profile.posts_count}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Posts</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{followersCount}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Followers</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{profile.following_count}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Following</div>
          </div>
        </div>
      </div>

      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="PLAYER"
        targetId={profile.id}
        targetTitle={`@${profile.username}`}
        token={token}
      />
    </>
  );
}
