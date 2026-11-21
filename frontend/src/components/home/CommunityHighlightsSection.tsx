import React from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Users, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HomeCommunityHighlight } from "@/lib/homeApi";
import { HomePageEmptyState } from "./HomePageEmptyState";

interface CommunityHighlightsSectionProps {
  community: HomeCommunityHighlight[];
}

export function CommunityHighlightsSection({ community }: CommunityHighlightsSectionProps) {
  if (!community || community.length === 0) {
    return (
      <div>
        <SectionHeader
          tag="Community Hub"
          title="Player Discussions"
          subtitle="Trending topics from the GTA 6 community."
          viewAllHref="/community"
          viewAllLabel="Visit Community"
        />
        <HomePageEmptyState
          title="No Discussions Yet"
          description="Be the first player to start a conversation in our Leonida player forum."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        tag="Community Hub"
        title="Player Discussions"
        subtitle="Trending topics from the GTA 6 community."
        viewAllHref="/community"
        viewAllLabel="Visit Community"
      />

      <div className="space-y-3">
        {community.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start justify-between gap-4 hover:border-orange-500/40 transition-colors group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-orange-400">
                  {item.category}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1d2232] text-slate-300 border border-[#2b3348]">
                  {item.author_platform}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                <Link href="/community" className="flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </Link>
              </h4>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="font-medium text-slate-300">By @{item.author_username}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  {item.replies_count} replies
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                  {item.likes_count} likes
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 text-center">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            <Users className="w-4 h-4" />
            Join the Vice City Player Discussions →
          </Link>
        </div>
      </div>
    </div>
  );
}
