import React from "react";
import Link from "next/link";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NewsArticleItem } from "@/lib/newsApi";
import { NewsVerificationBadge } from "./NewsVerificationBadge";
import { NewsBookmarkButton } from "./NewsBookmarkButton";

interface FeaturedNewsProps {
  article: NewsArticleItem;
  onBookmarkChanged?: (newState: boolean) => void;
}

export function FeaturedNews({ article, onBookmarkChanged }: FeaturedNewsProps) {
  const formattedDate = (() => {
    try {
      return new Date(article.original_published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  })();

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-[#141726] via-[#10131e] to-[#12141e] p-6 lg:p-8 shadow-2xl relative overflow-hidden group mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Article Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-3 h-3" />
              Featured Bulletin
            </span>
            <NewsVerificationBadge status={article.verification_status} />
            <span className="text-xs text-slate-400">
              {article.category_name || "Official Bulletin"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            <Link href={`/news/${article.slug}`} className="hover:text-orange-400 transition-colors">
              {article.title}
            </Link>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1e2538]">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Source: <strong className="text-slate-200">{article.source_name}</strong></span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.read_time_minutes} min read
              </span>
            </div>

            <div className="flex items-center gap-3">
              <NewsBookmarkButton
                articleId={article.id}
                initialBookmarked={article.is_bookmarked}
                onBookmarkChanged={onBookmarkChanged}
                variant="button"
              />
              <Link href={`/news/${article.slug}`}>
                <Button variant="primary" size="sm" className="gap-1.5 shadow-lg shadow-orange-950/20">
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Featured Visual */}
        <div className="lg:col-span-5 relative h-64 sm:h-80 rounded-xl overflow-hidden border border-[#232a3c] bg-[#141824]">
          {article.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-orange-950/30 to-[#10121a] flex items-center justify-center text-slate-500 font-bold text-sm">
              GTA VI Feature Media
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
