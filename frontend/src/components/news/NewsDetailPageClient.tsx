"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Share2, 
  Check, 
  Clock, 
  Calendar, 
  Cpu, 
  Tag 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NewsArticleDetail } from "@/lib/newsApi";
import { NewsVerificationBadge } from "./NewsVerificationBadge";
import { NewsBookmarkButton } from "./NewsBookmarkButton";
import { NewsSourceInfo } from "./NewsSourceInfo";
import { RelatedNews } from "./RelatedNews";

interface NewsDetailPageClientProps {
  article: NewsArticleDetail;
}

export function NewsDetailPageClient({ article }: NewsDetailPageClientProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedDate = (() => {
    try {
      return new Date(article.original_published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  })();

  // Format markdown-like headings and paragraphs
  const renderContent = (content: string) => {
    const lines = content.split("\n\n");
    return lines.map((block, index) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl sm:text-2xl font-bold text-white pt-6 pb-2">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl sm:text-3xl font-black text-white pt-8 pb-3">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("- ")) {
        const items = trimmed.split("\n").map((item) => item.replace(/^- \*\*(.*?)\*\*/, "$1").replace(/^- /, ""));
        return (
          <ul key={index} className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
            {items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={index} className="leading-relaxed text-slate-300">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. Back Navigation Link */}
      <div className="mb-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to News & Updates</span>
        </Link>
      </div>

      {/* 2. Article Header */}
      <header className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <NewsVerificationBadge status={article.verification_status} />
          <span className="text-xs font-semibold text-orange-400">
            {article.category_name || "General Bulletin"}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.read_time_minutes} min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-base sm:text-xl text-slate-300 font-medium leading-relaxed">
          {article.summary}
        </p>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[#1e2330] bg-[#12141c]">
          <div className="text-xs text-slate-400">
            Reported by <strong className="text-white">{article.source_name}</strong>
          </div>

          <div className="flex items-center gap-2">
            <NewsBookmarkButton
              articleId={article.id}
              initialBookmarked={article.is_bookmarked}
              variant="button"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 3. Featured Hero Media */}
      {article.image_url && (
        <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-[#202738] bg-[#141824] mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 4. Article Body Content */}
      <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-5 border-t border-[#1a1f2b] pt-8 mb-10">
        {renderContent(article.content)}
      </div>

      {/* 5. Source Transparency & Verification Citation Box */}
      <div className="mb-10">
        <NewsSourceInfo
          sourceName={article.source_name}
          sourceUrl={article.source_url}
          originalArticleUrl={article.original_article_url}
          verificationStatus={article.verification_status}
          publishedAt={article.original_published_at}
        />
      </div>

      {/* 6. Quick Cross-Section Navigation */}
      <div className="p-6 rounded-2xl border border-[#202738] bg-gradient-to-r from-[#121522] to-[#0f111a] flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Explore Platform Pillars</h4>
          <p className="text-xs text-slate-400">
            Compare store pricing or analyze your hardware rig for Vice City.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/pc-compatibility" className="flex-1 sm:flex-initial">
            <Button variant="secondary" size="sm" className="gap-1.5 w-full">
              <Cpu className="w-3.5 h-3.5" />
              Hardware Test
            </Button>
          </Link>
          <Link href="/price-deals" className="flex-1 sm:flex-initial">
            <Button variant="primary" size="sm" className="gap-1.5 w-full">
              <Tag className="w-3.5 h-3.5" />
              Pre-order Deals
            </Button>
          </Link>
        </div>
      </div>

      {/* 7. Related Articles Section */}
      {article.related_articles && article.related_articles.length > 0 && (
        <RelatedNews articles={article.related_articles} />
      )}

    </article>
  );
}
