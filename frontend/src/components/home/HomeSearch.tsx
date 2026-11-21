"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  X, 
  Newspaper, 
  Tag, 
  Cpu, 
  Wrench, 
  Users, 
  ArrowRight
} from "lucide-react";

interface HomeSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: "News" | "Deals" | "Hardware" | "Solver" | "Community";
  href: string;
  snippet: string;
}

const SEARCH_INDEX: SearchItem[] = [
  {
    id: "s1",
    title: "Take-Two Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
    category: "News",
    href: "/news",
    snippet: "Official corporate earnings report regarding PS5 and Xbox Series X/S timeline.",
  },
  {
    id: "s2",
    title: "PlayStation 5 Pro Hardware Enhancements for Next-Gen Open World Titles",
    category: "News",
    href: "/news",
    snippet: "PSSR upscaler analysis and ray-tracing performance profile.",
  },
  {
    id: "s3",
    title: "PC Compatibility Benchmark & Speculative Hardware Tiers",
    category: "Hardware",
    href: "/pc-compatibility",
    snippet: "Test your processor, graphics card, RAM, and SSD storage before GTA 6 launch.",
  },
  {
    id: "s4",
    title: "Pre-order Price Tracking: Standard & Deluxe Editions",
    category: "Deals",
    href: "/price-deals",
    snippet: "Compare retail pre-order prices across INR, USD, EUR, and GBP.",
  },
  {
    id: "s5",
    title: "Game Crashes & Freezes: Diagnostic Guides & Solutions",
    category: "Solver",
    href: "/problem-solver",
    snippet: "AI troubleshooter for crash logs, memory exceptions, and DirectX 12 errors.",
  },
  {
    id: "s6",
    title: "Leonida Map Scale vs. San Andreas & Red Dead Redemption 2",
    category: "Community",
    href: "/community",
    snippet: "Player discussions and geographic size breakdowns in the forum.",
  },
];

export function HomeSearch({ isOpen, onClose }: HomeSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = query.trim()
    ? SEARCH_INDEX.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.snippet.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_INDEX.slice(0, 4);

  const getCategoryIcon = (category: SearchItem["category"]) => {
    switch (category) {
      case "News":
        return <Newspaper className="w-4 h-4 text-orange-400" />;
      case "Deals":
        return <Tag className="w-4 h-4 text-amber-400" />;
      case "Hardware":
        return <Cpu className="w-4 h-4 text-rose-400" />;
      case "Solver":
        return <Wrench className="w-4 h-4 text-sky-400" />;
      case "Community":
        return <Users className="w-4 h-4 text-purple-400" />;
    }
  };

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-[#23293a] bg-[#0c0e15] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#1c212e] flex items-center gap-3">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search news, hardware checks, pre-orders, troubleshooting..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-[#161a25] border border-[#252c3d] text-xs font-semibold text-slate-400 hover:text-white"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {query.trim() ? `Search Results (${filteredItems.length})` : "Suggested Quick Access"}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No matching results found for &quot;<span className="text-white">{query}</span>&quot;.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full p-3 rounded-xl hover:bg-[#141724] border border-transparent hover:border-[#232a3c] transition-all text-left flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#141722] border border-[#202738] shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {item.snippet}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
              </button>
            ))
          )}
        </div>

        {/* Quick Navigation Footer */}
        <div className="p-3 bg-[#08090d] border-t border-[#181d2a] flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-[#141824] rounded border border-[#262e40] text-slate-300 font-mono">Enter</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 text-[10px] bg-[#141824] rounded border border-[#262e40] text-slate-300 font-mono">Esc</kbd> to close</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/news" onClick={onClose} className="hover:text-orange-400">News</Link>
            <span>•</span>
            <Link href="/price-deals" onClick={onClose} className="hover:text-orange-400">Deals</Link>
            <span>•</span>
            <Link href="/pc-compatibility" onClick={onClose} className="hover:text-orange-400">Hardware</Link>
            <span>•</span>
            <Link href="/problem-solver" onClick={onClose} className="hover:text-orange-400">Solver</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
