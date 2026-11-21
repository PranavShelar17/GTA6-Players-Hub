"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Newspaper, ShieldCheck, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  fetchNewsList, 
  fetchFeaturedNews, 
  fetchNewsCategories, 
  fetchNewsStats, 
  NewsArticleItem, 
  NewsCategory, 
  NewsStats 
} from "@/lib/newsApi";
import { FeaturedNews } from "./FeaturedNews";
import { NewsCard } from "./NewsCard";
import { NewsCategoryFilter } from "./NewsCategoryFilter";
import { NewsSearch } from "./NewsSearch";
import { NewsSort } from "./NewsSort";
import { NewsPagination } from "./NewsPagination";
import { NewsEmptyState } from "./NewsEmptyState";
import { NewsLoadingSkeleton } from "./NewsLoadingSkeleton";

export function NewsPageClient() {
  const { session } = useAuth();
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [featured, setFeatured] = useState<NewsArticleItem | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedVerification, setSelectedVerification] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<"latest" | "oldest" | "featured">("latest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 9;

  // Initial metadata fetch (Categories, Stats, Featured)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, st, feat] = await Promise.all([
          fetchNewsCategories(),
          fetchNewsStats(),
          fetchFeaturedNews(session?.access_token),
        ]);
        setCategories(cats);
        setStats(st);
        setFeatured(feat);
      } catch {
        // Handled silently by fallback
      }
    }
    loadMeta();
  }, [session?.access_token]);

  // Main articles fetch
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNewsList(
        {
          q: searchQuery,
          category: selectedCategory,
          verification_status: selectedVerification,
          sort,
          page: currentPage,
          page_size: pageSize,
        },
        session?.access_token
      );

      setArticles(res.data.items);
      setTotalItems(res.data.total);
      setTotalPages(res.data.total_pages);
      setIsFallback(res.isFallback);
    } catch {
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedVerification, sort, currentPage, session?.access_token]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setSelectedVerification(undefined);
    setSort("latest");
    setCurrentPage(1);
  };

  const handleBookmarkToggle = (articleId: string, newState: boolean) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, is_bookmarked: newState } : a))
    );
    if (featured && featured.id === articleId) {
      setFeatured({ ...featured, is_bookmarked: newState });
    }
  };

  const isFiltering = Boolean(searchQuery || selectedCategory || selectedVerification);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-3">
            <Newspaper className="w-3.5 h-3.5" />
            <span>GTA 6 Information Bureau</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            News & Updates
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Verified bulletins, official Rockstar statements, technical analyses, and strict 4-tier truth labeling for Grand Theft Auto VI.
          </p>
        </div>

        {/* Stats Pill Counters */}
        {stats && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#121520] border border-[#202738] text-center">
              <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {stats.official_count}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Official</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#121520] border border-[#202738] text-center">
              <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {stats.verified_count}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Verified</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#121520] border border-[#202738] text-center">
              <div className="text-lg font-black text-white">
                {stats.total_articles}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Total News</div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Standard Legend */}
      <div className="mb-8 p-4 rounded-xl border border-[#1e2330] bg-[#10121a] flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-slate-300">4-Tier Truth Standard:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-amber-400 font-bold uppercase">Official:</span>
          <span className="text-slate-400">Direct from Rockstar / Take-Two</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold uppercase">Verified:</span>
          <span className="text-slate-400">Reputable press investigation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-rose-400 font-bold uppercase">Rumour:</span>
          <span className="text-slate-400">Uncorroborated report</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-slate-400 font-bold uppercase">Unconfirmed:</span>
          <span className="text-slate-400">Pending verification</span>
        </div>
      </div>

      {/* Offline / Demonstration feed notification */}
      {isFallback && (
        <div className="mb-6 p-3.5 rounded-xl border border-orange-500/30 bg-orange-950/20 text-orange-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Demonstration Feed: Viewing verified sample bulletins. Real-time background sync is operational.</span>
          </div>
        </div>
      )}

      {/* 2. Featured Article Hero (Shown only on page 1 when not actively filtering) */}
      {!isFiltering && currentPage === 1 && featured && (
        <FeaturedNews article={featured} onBookmarkChanged={(ns) => handleBookmarkToggle(featured.id, ns)} />
      )}

      {/* 3. Filter and Search Controls Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <NewsSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Verification Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedVerification || ""}
                onChange={(e) => {
                  setSelectedVerification(e.target.value || undefined);
                  setCurrentPage(1);
                }}
                className="bg-[#121520] border border-[#202738] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
              >
                <option value="">All Tiers</option>
                <option value="OFFICIAL">Official</option>
                <option value="VERIFIED">Verified</option>
                <option value="RUMOUR">Rumours</option>
                <option value="UNCONFIRMED">Unconfirmed</option>
              </select>
            </div>

            {/* Sort Selector */}
            <NewsSort
              sort={sort}
              onSortChange={(s) => {
                setSort(s);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <NewsCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            setCurrentPage(1);
          }}
          totalArticlesCount={stats?.total_articles || articles.length}
        />
      </div>

      {/* 4. News Articles Grid */}
      {loading ? (
        <NewsLoadingSkeleton />
      ) : articles.length === 0 ? (
        <NewsEmptyState
          title="No Matching News Articles"
          description={
            isFiltering
              ? "We couldn't find any articles matching your search query or selected category filter."
              : "No articles are currently published. Check back soon for the latest Rockstar Newswire bulletins."
          }
          onResetFilters={isFiltering ? handleResetFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onBookmarkChanged={(ns) => handleBookmarkToggle(article.id, ns)}
            />
          ))}
        </div>
      )}

      {/* 5. Pagination */}
      {!loading && articles.length > 0 && (
        <NewsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => {
            setCurrentPage(p);
            window.scrollTo({ top: 300, behavior: "smooth" });
          }}
        />
      )}

    </div>
  );
}
