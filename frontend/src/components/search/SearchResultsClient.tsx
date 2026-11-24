"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  ShieldCheck,
  Tag,
  Calendar,
  Users,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchSearchResults,
  fetchSearchCategoriesStats,
  SearchCategoriesStats,
  SearchResultItem,
} from "@/lib/searchApi";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "ALL", label: "All Results", icon: Sparkles },
  { id: "NEWS", label: "News & Updates", icon: ShieldCheck },
  { id: "DEALS", label: "Price & Deals", icon: Tag },
  { id: "EVENTS", label: "Events Calendar", icon: Calendar },
  { id: "COMMUNITY", label: "Gaming Community", icon: Users },
  { id: "HELP", label: "Help & Guides", icon: HelpCircle },
];

const SORT_OPTIONS = [
  { id: "relevant", label: "Most Relevant" },
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "upcoming", label: "Upcoming Events" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
];

export function SearchResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const sessionToken = session?.access_token;

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialSort = searchParams.get("sort") || "relevant";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SearchCategoriesStats>({
    all: 0,
    news: 0,
    deals: 0,
    events: 0,
    community: 0,
    help: 0,
  });

  // Sync state with URL changes
  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setActiveCategory(searchParams.get("category") || "ALL");
    setActiveSort(searchParams.get("sort") || "relevant");
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      const res = await fetchSearchCategoriesStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    }
    loadStats();
  }, []);

  const executeSearch = useCallback(
    async (q: string, category: string, sort: string, page: number) => {
      setIsLoading(true);
      try {
        const res = await fetchSearchResults({
          q,
          category,
          sort,
          page,
          pageSize: 15,
          token: sessionToken,
        });

        if (res.success && res.data) {
          setResults(res.data.items || []);
          setTotalCount(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
        } else {
          setResults([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken]
  );

  useEffect(() => {
    executeSearch(searchTerm, activeCategory, activeSort, currentPage);
  }, [searchTerm, activeCategory, activeSort, currentPage, executeSearch]);

  const updateUrlParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, v.toString());
      } else {
        params.delete(k);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchTerm, page: 1 });
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    updateUrlParams({ category: cat, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    updateUrlParams({ sort, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "OFFICIAL":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-800/40";
      case "VERIFIED":
        return "bg-cyan-950/60 text-cyan-400 border-cyan-800/40";
      case "RUMOUR":
        return "bg-amber-950/60 text-amber-400 border-amber-800/40";
      case "UNCONFIRMED":
        return "bg-purple-950/60 text-purple-400 border-purple-800/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getCategoryCount = (catId: string) => {
    switch (catId) {
      case "NEWS":
        return stats.news;
      case "DEALS":
        return stats.deals;
      case "EVENTS":
        return stats.events;
      case "COMMUNITY":
        return stats.community;
      case "HELP":
        return stats.help;
      default:
        return stats.all;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title & Description */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Search className="w-8 h-8 text-orange-500" />
            Global Search
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Search across GTA 6 official news, verified updates, price comparisons, community discussions,
            events calendar, and PC troubleshooting guides.
          </p>
        </div>

        {/* Search Query Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex items-center rounded-2xl bg-[#0f121d] border border-[#23293a] focus-within:border-orange-500/60 shadow-lg p-2 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search GTA 6 content (e.g., 'Vice City', 'Pre-order', 'PC requirements')..."
              className="w-full bg-transparent px-4 py-2 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  updateUrlParams({ q: "", page: 1 });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f30] mr-2 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter Controls Row: Category Pills & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1c212e] pb-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-[#101420] text-slate-400 hover:text-white hover:bg-[#161a29] border border-[#1e2434]"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-400")} />
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        isActive ? "bg-black/30 text-white" : "bg-[#181d2c] text-slate-400"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-[#101420] border border-[#1e2434] rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-orange-500/60"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Metadata Header */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {isLoading ? (
              "Searching database..."
            ) : totalCount > 0 ? (
              <>
                Found <strong className="text-white">{totalCount}</strong> result{totalCount === 1 ? "" : "s"}
                {searchTerm && (
                  <>
                    {" "}
                    for &quot;<span className="text-orange-400">{searchTerm}</span>&quot;
                  </>
                )}
              </>
            ) : (
              "No matches found"
            )}
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#0e111a] border border-[#1c212e] animate-pulse space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-16 h-4 bg-slate-800 rounded" />
                  <div className="w-24 h-4 bg-slate-800 rounded" />
                </div>
                <div className="w-3/4 h-5 bg-slate-800 rounded" />
                <div className="w-full h-4 bg-slate-850 rounded" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((item) => {
              const isNews = item.content_type === "NEWS";
              const isDeals = item.content_type === "DEALS";

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#0d1019] border border-[#1d2334] hover:border-orange-500/40 hover:bg-[#111522] transition-all group flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold px-2 py-0.5 rounded bg-[#161b2b] text-slate-300 border border-[#23293c]">
                        {item.content_type}
                      </span>

                      {item.category && (
                        <span className="text-slate-400 text-[11px] font-medium">
                          {item.category}
                        </span>
                      )}

                      {isNews && item.verification_status && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            getVerificationBadge(item.verification_status)
                          )}
                        >
                          {item.verification_status}
                        </span>
                      )}

                      {isDeals && item.price_display && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 font-bold text-[11px]">
                          {item.price_display}
                        </span>
                      )}

                      {item.source_or_author && (
                        <span className="text-slate-500 text-[11px]">
                          by {item.source_or_author}
                        </span>
                      )}

                      {item.published_or_event_at && (
                        <span className="text-slate-500 text-[11px]">
                          • {new Date(item.published_or_event_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Result Title */}
                    <Link
                      href={item.url_path}
                      className="block text-base sm:text-lg font-bold text-white group-hover:text-orange-400 transition-colors"
                    >
                      {item.title}
                    </Link>

                    {/* Description Excerpt */}
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Link Button */}
                  <div className="sm:self-center shrink-0">
                    <Link
                      href={item.url_path}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#171c2b] hover:bg-orange-500 hover:text-white border border-[#232a3d] text-xs font-semibold text-slate-300 transition-all"
                    >
                      <span>Explore</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Results State */
          <div className="py-16 text-center space-y-4 rounded-2xl bg-[#0c0e17] border border-[#1c212e] p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#151928] flex items-center justify-center text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No results found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find any records matching &quot;{searchTerm}&quot; in the{" "}
              {activeCategory === "ALL" ? "platform" : activeCategory} category.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>Suggestions:</p>
              <p>• Make sure all words are spelled correctly.</p>
              <p>• Try switching the category filter back to &quot;All Results&quot;.</p>
              <p>• Try using broader terms like &quot;Trailer&quot;, &quot;Price&quot;, or &quot;Vice City&quot;.</p>
            </div>
            {activeCategory !== "ALL" && (
              <button
                onClick={() => handleCategoryChange("ALL")}
                className="mt-4 px-4 py-2 rounded-xl bg-[#161a29] border border-[#23293a] text-xs font-semibold text-slate-300 hover:text-white hover:border-orange-500/40 transition-colors"
              >
                Reset to All Results
              </button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#1c212e] pt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f121d] border border-[#1e2334] text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161a28] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400">
              Page <strong className="text-white">{currentPage}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0f121d] border border-[#1e2334] text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#161a28] transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
