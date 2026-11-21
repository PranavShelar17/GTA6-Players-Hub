import React from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { NewsArticleItem } from "@/lib/newsApi";
import { NewsVerificationBadge } from "./NewsVerificationBadge";
import { NewsBookmarkButton } from "./NewsBookmarkButton";

interface NewsCardProps {
  article: NewsArticleItem;
  onBookmarkChanged?: (newState: boolean) => void;
}

export function NewsCard({ article, onBookmarkChanged }: NewsCardProps) {
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
    <Card className="flex flex-col justify-between hover:border-orange-500/40 transition-all duration-200 overflow-hidden group p-0">
      <div>
        {/* Thumbnail preview */}
        <div className="relative h-48 w-full bg-[#141824] overflow-hidden border-b border-[#1c2230]">
          {article.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#131622] via-[#161a29] to-[#1c2033] flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-wider">
              GTA 6 Bulletin
            </div>
          )}

          <div className="absolute top-3 left-3">
            <NewsVerificationBadge status={article.verification_status} />
          </div>

          <div className="absolute top-3 right-3">
            <NewsBookmarkButton
              articleId={article.id}
              initialBookmarked={article.is_bookmarked}
              onBookmarkChanged={onBookmarkChanged}
            />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-orange-400 font-semibold truncate max-w-[160px]">
              {article.category_name || "General News"}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {article.read_time_minutes}m read
            </span>
          </div>

          <CardTitle className="text-lg leading-snug line-clamp-2 mb-2.5">
            <Link
              href={`/news/${article.slug}`}
              className="hover:text-orange-400 transition-colors"
            >
              {article.title}
            </Link>
          </CardTitle>

          <CardDescription className="text-sm leading-relaxed line-clamp-3">
            {article.summary}
          </CardDescription>
        </div>
      </div>

      {/* Footer */}
      <CardFooter className="justify-between text-xs text-slate-400 px-5 pb-5 pt-3 border-t border-[#181d2a]">
        <div className="flex items-center gap-2 truncate max-w-[180px]">
          <span className="text-slate-500">{formattedDate}</span>
          <span>•</span>
          <span className="truncate text-slate-300 font-medium" title={article.source_name}>
            {article.source_name}
          </span>
        </div>

        <Link
          href={`/news/${article.slug}`}
          className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 group/btn"
        >
          <span>Read</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
