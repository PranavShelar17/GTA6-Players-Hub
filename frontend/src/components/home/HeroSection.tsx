import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Newspaper, 
  Tag, 
  ShieldCheck, 
  HelpCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeroSectionProps {
  onOpenSearch?: () => void;
}

export function HeroSection({ onOpenSearch }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#1c2230] bg-gradient-to-b from-[#11131b] via-[#0b0c11] to-[#090a0f] pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-orange-500/15 via-rose-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Sub-badge pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Premier Grand Theft Auto VI Player Intelligence Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          WELCOME TO <span className="sunset-gradient-text">VICE CITY</span>
          <br />
          <span className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-300">
            GTA 6 PLAYER HUB
          </span>
        </h1>

        {/* Supporting description */}
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Verified news from official sources, worldwide price intelligence, hardware compatibility diagnostics, an AI-powered technical problem solver, and a dedicated player community.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
          <Link href="/news">
            <Button variant="primary" size="lg" className="gap-2 shadow-lg shadow-orange-500/20">
              <Newspaper className="w-4 h-4" />
              Explore GTA 6 News
            </Button>
          </Link>
          <Link href="/price-deals">
            <Button variant="secondary" size="lg" className="gap-2">
              <Tag className="w-4 h-4" />
              Find Best Deals
            </Button>
          </Link>
          {onOpenSearch && (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-[#2a3246] hover:border-orange-500/50"
              onClick={onOpenSearch}
            >
              <Search className="w-4 h-4" />
              Quick Discovery
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-[#1c2232] rounded border border-[#2b334a] text-slate-400">
                Ctrl+K
              </kbd>
            </Button>
          )}
        </div>

        {/* Key Platform Facts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[#1a1f2c]">
          <div className="p-3 text-center">
            <div className="text-2xl font-black text-white">Fall 2025</div>
            <div className="text-xs text-slate-400 mt-0.5">Target Launch Window</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl font-black text-orange-400">PS5 & XSX/S</div>
            <div className="text-xs text-slate-400 mt-0.5">Confirmed Consoles</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl font-black text-rose-400">PC Pending</div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3 inline text-slate-500" />
              <span>Specs Unconfirmed</span>
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>100% Verified</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Strict Editorial Labels</div>
          </div>
        </div>
      </div>
    </section>
  );
}
