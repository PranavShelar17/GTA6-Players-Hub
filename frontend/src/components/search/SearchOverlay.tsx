"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Tag,
  Calendar,
  Users,
  HelpCircle,
  Trash2,
  CornerDownLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchSearchSuggestions,
  fetchRecentSearches,
  clearRecentSearches,
  SearchSuggestionItem,
  SearchHistoryItem,
} from "@/lib/searchApi";
import { cn } from "@/lib/utils";

const POPULAR_SEARCHES = [
  "GTA 6 Official Trailer 2",
  "Release Date & Countdown",
  "PC System Requirements",
  "Pre-Order Editions & Pricing",
  "Vice City Map & Locations",
  "Jason and Lucia Story",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  NEWS: ShieldCheck,
  DEALS: Tag,
  EVENTS: Calendar,
  COMMUNITY: Users,
  HELP: HelpCircle,
};

export function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { session, isAuthenticated } = useAuth();
  const sessionToken = session?.access_token;

  // Listen to Global Keyboard Shortcuts (Ctrl+K, Cmd+K, '/')
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    function handleCustomEvent() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gta6:open-search", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gta6:open-search", handleCustomEvent);
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadRecent();
    } else {
      setQuery("");
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const loadRecent = useCallback(async () => {
    if (isAuthenticated && sessionToken) {
      const res = await fetchRecentSearches(sessionToken, 6);
      if (res.success && res.data) {
        setRecentSearches(res.data);
      }
    } else {
      // Local fallback from localStorage
      try {
        const local = localStorage.getItem("gta6_recent_searches");
        if (local) {
          const parsed = JSON.parse(local);
          setRecentSearches(
            parsed.slice(0, 6).map((q: string, i: number) => ({
              id: `local-${i}`,
              query: q,
              results_count: 0,
              searched_at: new Date().toISOString(),
            }))
          );
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [isAuthenticated, sessionToken]);

  // Debounced search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetchSearchSuggestions(query.trim(), 6);
      if (res.success && res.data) {
        setSuggestions(res.data.suggestions || []);
      }
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecentQuery = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    try {
      const local = localStorage.getItem("gta6_recent_searches");
      const list: string[] = local ? JSON.parse(local) : [];
      const updated = [searchTerm, ...list.filter((x) => x.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 10);
      localStorage.setItem("gta6_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleExecuteSearch = (targetQuery?: string) => {
    const finalQ = (targetQuery ?? query).trim();
    if (!finalQ) return;
    saveRecentQuery(finalQ);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(finalQ)}`);
  };

  const handleNavigateToUrl = (url: string, title: string) => {
    saveRecentQuery(title);
    setIsOpen(false);
    router.push(url);
  };

  const handleClearRecent = async (historyId?: string) => {
    if (isAuthenticated && sessionToken) {
      await clearRecentSearches(sessionToken, historyId);
      loadRecent();
    } else {
      try {
        if (historyId) {
          const item = recentSearches.find((r) => r.id === historyId);
          if (item) {
            const local = localStorage.getItem("gta6_recent_searches");
            if (local) {
              const list: string[] = JSON.parse(local);
              const updated = list.filter((x) => x !== item.query);
              localStorage.setItem("gta6_recent_searches", JSON.stringify(updated));
            }
          }
        } else {
          localStorage.removeItem("gta6_recent_searches");
        }
        loadRecent();
      } catch {
        // ignore
      }
    }
  };

  // Keyboard navigation through suggestions
  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const item = suggestions[selectedIndex];
        handleNavigateToUrl(item.url_path, item.title);
      } else {
        handleExecuteSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md transition-all">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0c0e17] border border-[#23293a] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1c212e] bg-[#101422]/60">
          <Search className="w-5 h-5 text-orange-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Search news, price deals, events, community discussions, help..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white mr-2"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-[#161a27] border border-[#23293a] rounded">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Real-time Suggestions (when typing) */}
          {query.trim().length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>Direct Matches</span>
                {isLoading && <span className="text-orange-400 text-[11px] animate-pulse">Searching...</span>}
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((item, idx) => {
                    const IconComponent = CATEGORY_ICONS[item.content_type] || Search;
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={`${item.url_path}-${idx}`}
                        onClick={() => handleNavigateToUrl(item.url_path, item.title)}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors group",
                          isSelected
                            ? "bg-orange-500/15 border border-orange-500/40 text-orange-300"
                            : "hover:bg-[#151929] text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-[#191e30] text-slate-300 group-hover:text-orange-400">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-slate-400">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e2336] text-slate-300">
                            {item.content_type}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isLoading ? (
                <div className="py-6 text-center text-slate-400 text-sm">
                  No instant matches found for &quot;{query}&quot;.
                </div>
              ) : null}

              {/* View all results button */}
              <button
                onClick={() => handleExecuteSearch()}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors"
              >
                <span>View all search results for &quot;{query}&quot;</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recent Searches (when input is empty) */}
          {query.trim().length === 0 && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  Recent Searches
                </span>
                <button
                  onClick={() => handleClearRecent()}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141826] border border-[#202638] text-xs text-slate-300 hover:border-orange-500/40 hover:text-white transition-all group"
                  >
                    <button
                      onClick={() => handleExecuteSearch(item.query)}
                      className="text-left font-medium hover:text-orange-400 truncate max-w-[200px]"
                    >
                      {item.query}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearRecent(item.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches (when input is empty) */}
          {query.trim().length === 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                Popular Searches
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleExecuteSearch(term)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#1d2334] text-xs font-medium text-slate-300 hover:border-orange-500/40 hover:text-white hover:bg-[#161c2d] transition-all text-left group"
                  >
                    <span>{term}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[#0a0c14] border-t border-[#1c212e] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation:</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#161a27] border border-[#23293a] text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[#161a27] border border-[#23293a] text-[10px] font-mono">↓</kbd>
              to browse
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[#161a27] border border-[#23293a] text-[10px] font-mono">↵</kbd>
              to select
            </span>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/search");
            }}
            className="text-orange-400 hover:underline font-medium"
          >
            Open Advanced Search
          </button>
        </div>
      </div>
    </div>
  );
}
