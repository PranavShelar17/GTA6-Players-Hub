"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { CommunityCategory, CommunityPostItem } from "@/lib/communityApi";
import { CommunityFeed } from "./CommunityFeed";

interface CommunityPageClientProps {
  initialPosts: CommunityPostItem[];
  categories: CommunityCategory[];
}

export function CommunityPageClient({
  initialPosts,
  categories,
}: CommunityPageClientProps) {
  const { session, isAuthenticated, profile } = useAuth();
  const token = session?.access_token;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" />
            <span>Leonida Player Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Gaming Community
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Connect with fellow players across PlayStation 5, Xbox Series X|S and PC. Share Vice City theories, vehicle setups, heists strategies, and vote on community polls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/community/create">
            <Button variant="primary" size="lg" className="flex items-center gap-2 shadow-lg shadow-orange-500/20">
              <PlusCircle className="w-5 h-5" />
              <span>Start Discussion</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Feed (3 cols) + Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-3">
          <CommunityFeed
            initialPosts={initialPosts}
            categories={categories}
            token={token}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* User Community Profile Card (if authenticated) */}
          {isAuthenticated && profile && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Your Player Profile
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-bold text-sm text-white truncate">
                    {profile.display_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    @{profile.username}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Link href={`/community/player/${profile.username}`}>
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    View Public Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Categories Overview */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Discussion Topics</span>
            </div>
            <div className="space-y-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs hover:border-slate-700 transition-colors"
                >
                  <span className="font-semibold text-slate-200">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Standards & Guidelines */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Community Standards</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Respect all players. Zero tolerance for hate speech or harassment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>Tag unconfirmed rumors and avoid distributing malicious fake leaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                <span>No self-promotion, spam, or illicit coin-selling advertisements.</span>
              </li>
            </ul>
          </div>

          {/* Help & Support CTA */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-2 text-xs text-slate-400">
            <div className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Have questions about the game?</span>
            </div>
            <p className="leading-relaxed">
              Check out the Tips & Guides category or use the Problem Solver for hardware troubleshooting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
