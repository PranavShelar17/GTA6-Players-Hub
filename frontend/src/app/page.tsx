import React from "react";
import Link from "next/link";
import { 
  Flame, 
  ArrowRight, 
  Cpu, 
  Wrench, 
  Tag, 
  Users, 
  Newspaper, 
  Calendar, 
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#1c2230] bg-gradient-to-b from-[#11131b] via-[#0b0c11] to-[#090a0f] pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-orange-500/15 via-rose-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Premier Grand Theft Auto VI Player Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
            WELCOME TO <span className="sunset-gradient-text">VICE CITY</span>
            <br />
            <span className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-300">
              GTA 6 PLAYER HUB
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Verified news from official sources, worldwide price intelligence, hardware compatibility diagnostics, an AI-powered technical problem solver, and a dedicated player community.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <Link href="/news">
              <Button variant="primary" size="lg" className="gap-2">
                <Newspaper className="w-4 h-4" />
                Latest News & Updates
              </Button>
            </Link>
            <Link href="/pc-compatibility">
              <Button variant="secondary" size="lg" className="gap-2">
                <Cpu className="w-4 h-4" />
                Check PC Compatibility
              </Button>
            </Link>
            <Link href="/price-deals">
              <Button variant="outline" size="lg" className="gap-2">
                <Tag className="w-4 h-4" />
                Explore Global Deals
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-[#1a1f2c]">
            <div className="p-3 text-center">
              <div className="text-2xl font-black text-white">Fall 2025</div>
              <div className="text-xs text-slate-400 mt-0.5">Target Launch Window</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-black text-orange-400">PS5 & XSX/S</div>
              <div className="text-xs text-slate-400 mt-0.5">Confirmed Platforms</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-black text-rose-400">100% Verified</div>
              <div className="text-xs text-slate-400 mt-0.5">Zero Rumours as Facts</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-black text-emerald-400">Global Tracker</div>
              <div className="text-xs text-slate-400 mt-0.5">INR, USD, EUR, GBP</div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK MODULE ACCESS (SIX NAVIGATION PILLARS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          tag="Platform Pillars"
          title="Explore GTA 6 Player Hub"
          subtitle="Navigate directly to the six primary services engineered for players."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link href="/news" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-orange-400 transition-colors flex items-center justify-between">
                <span>News & Updates</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                Official Rockstar Newswire bulletins, verified press reports, trailer analyses, and strict labeling.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/pc-compatibility" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-rose-400 transition-colors flex items-center justify-between">
                <span>PC Compatibility</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                Hardware spec builder, bottleneck analysis, upgrade recommendations, and unconfirmed requirement alerts.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/price-deals" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Tag className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-amber-400 transition-colors flex items-center justify-between">
                <span>Price & Deals Tracker</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                Worldwide pre-order intelligence, INR conversion, verified retailers, price history, and drop alerts.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/problem-solver" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>Gaming Problem Solver</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                AI technical troubleshooter, known error encyclopedia, safe driver guides, and step-by-step checklists.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/community" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-purple-400 transition-colors flex items-center justify-between">
                <span>Gaming Community</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                Player discussions, group hubs, verified polls, media sharing, and safe community moderation.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/dashboard" className="group">
            <Card className="h-full border-[#1e2330] hover:border-orange-500/50 transition-all duration-200">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <CardTitle className="group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                <span>Player Dashboard</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="mt-2">
                Personalized player hub: saved PC reports, active price alerts, bookmarked articles, and preferences.
              </CardDescription>
            </Card>
          </Link>
        </div>
      </section>

      {/* LATEST NEWS & UPDATES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          tag="Editorial Feed"
          title="Latest GTA 6 News & Bulletins"
          subtitle="Strictly verified updates with transparent source citations."
          viewAllHref="/news"
          viewAllLabel="All News"
        />

        <div className="mb-4 text-xs text-slate-400 bg-[#12151f] border border-[#202738] rounded-lg px-3.5 py-2 flex items-center gap-2">
          <span className="font-semibold text-orange-400">[SAMPLE CONTENT]:</span>
          <span>Sample news entries demonstrating layout and 4-tier verification badges. Real automated ingestion connects in Phase 4.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="official">Official</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Rockstar Newswire
                </span>
              </div>
              <CardTitle className="text-lg leading-snug">
                Take-Two Reconfirms Grand Theft Auto VI Fall 2025 Release Window
              </CardTitle>
              <CardDescription className="mt-2.5 leading-relaxed">
                During the latest earnings report, Take-Two Interactive reiterated that Rockstar Games remains on track to launch GTA VI in Fall 2025 on PS5 and Xbox Series X/S.
              </CardDescription>
            </div>
            <CardFooter className="justify-between text-xs text-slate-400">
              <span>Nov 2026</span>
              <Link href="/news" className="text-orange-400 hover:text-orange-300 font-medium">
                Read Bulletin →
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="verified">Verified</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  PlayStation Blog
                </span>
              </div>
              <CardTitle className="text-lg leading-snug">
                PlayStation 5 Pro Hardware Enhancements for Next-Gen Open World Titles
              </CardTitle>
              <CardDescription className="mt-2.5 leading-relaxed">
                Digital Foundry technical analysis examines PSSR machine learning upscaling and enhanced ray-tracing capabilities prepared for Vice City scale rendering.
              </CardDescription>
            </div>
            <CardFooter className="justify-between text-xs text-slate-400">
              <span>Nov 2026</span>
              <Link href="/news" className="text-orange-400 hover:text-orange-300 font-medium">
                Read Analysis →
              </Link>
            </CardFooter>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="unconfirmed">Unconfirmed</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Industry Report
                </span>
              </div>
              <CardTitle className="text-lg leading-snug">
                PC Release Timeline Speculation and Engine Physics Upgrades
              </CardTitle>
              <CardDescription className="mt-2.5 leading-relaxed">
                Examining historical Rockstar PC launch cadences (GTA V, RDR 2) and anticipated system requirements. Official PC announcement remains pending.
              </CardDescription>
            </div>
            <CardFooter className="justify-between text-xs text-slate-400">
              <span>Nov 2026</span>
              <Link href="/news" className="text-orange-400 hover:text-orange-300 font-medium">
                Read Report →
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* FEATURED DEALS & PRICE PREVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          tag="Price Intelligence"
          title="Featured Global Editions & Deals"
          subtitle="Comparing verified store offerings across international currencies."
          viewAllHref="/price-deals"
          viewAllLabel="All Prices & Deals"
        />

        <div className="mb-4 text-xs text-slate-400 bg-[#12151f] border border-[#202738] rounded-lg px-3.5 py-2 flex items-center gap-2">
          <span className="font-semibold text-orange-400">[DEMONSTRATION DATA]:</span>
          <span>Sample retail edition comparison. Live price feeds from authorized stores connect in Phase 5.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[#202738]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PlayStation 5</span>
              <Badge variant="verified">Official Retailer</Badge>
            </div>
            <CardTitle className="text-xl">Standard Edition</CardTitle>
            <div className="my-4">
              <div className="text-3xl font-black text-white">₹5,999</div>
              <div className="text-xs text-slate-400 mt-1">Approx. $69.99 USD / €79.99 EUR</div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Base game on PlayStation Store (India). Verified pre-order notification available.</p>
            <Link href="/price-deals">
              <Button variant="secondary" size="sm" className="w-full">
                Track Price / Alert
              </Button>
            </Link>
          </Card>

          <Card className="border-orange-500/30 bg-[#141724]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Xbox Series X</span>
              <Badge variant="verified">Official Retailer</Badge>
            </div>
            <CardTitle className="text-xl">Deluxe Edition</CardTitle>
            <div className="my-4">
              <div className="text-3xl font-black text-orange-400">₹7,499</div>
              <div className="text-xs text-slate-400 mt-1">Approx. $89.99 USD / €99.99 EUR</div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Includes early-access content bonus and digital collectibles on Xbox Marketplace.</p>
            <Link href="/price-deals">
              <Button variant="primary" size="sm" className="w-full">
                Track Price / Alert
              </Button>
            </Link>
          </Card>

          <Card className="border-[#202738]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PC (Anticipated)</span>
              <Badge variant="unconfirmed">Pending Announcement</Badge>
            </div>
            <CardTitle className="text-xl">PC Digital Edition</CardTitle>
            <div className="my-4">
              <div className="text-3xl font-black text-slate-300">TBA</div>
              <div className="text-xs text-slate-400 mt-1">Steam / Rockstar Launcher</div>
            </div>
            <p className="text-xs text-slate-400 mb-6">Add to your wishlist to receive instant notification when PC pre-orders go live.</p>
            <Link href="/price-deals">
              <Button variant="outline" size="sm" className="w-full">
                Add to Watchlist
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* UPCOMING EVENTS & COMMUNITY HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upcoming Events */}
          <div>
            <SectionHeader
              tag="Milestones"
              title="Events Calendar"
              subtitle="Major GTA 6 milestones and industry broadcasts."
            />
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 shrink-0 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-bold block">Q1</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white">Trailer 2 & Gameplay Deep Dive</h4>
                    <Badge variant="rumour">Anticipated</Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Expected next cinematic reveal focusing on Leonida geography, Lucia and Jason dynamic mechanics.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-bold block">Q3</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white">Take-Two Interactive Q1 Earnings Call</h4>
                    <Badge variant="official">Official</Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Executive corporate conference providing updated release schedule affirmations and financial projections.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Highlights */}
          <div>
            <SectionHeader
              tag="Community Hub"
              title="Player Discussions"
              subtitle="Trending topics from the GTA 6 community."
              viewAllHref="/community"
              viewAllLabel="Visit Community"
            />
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-orange-400 mb-1 block">Vice City Lore</span>
                  <h4 className="text-sm font-bold text-white mb-1.5 hover:text-orange-400 transition-colors">
                    <Link href="/community">Map scale comparison: Leonida vs. San Andreas & RDR 2</Link>
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>By @ViceCityNavigator</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 48 replies</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 132 likes</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-rose-400 mb-1 block">PC Hardware Discussion</span>
                  <h4 className="text-sm font-bold text-white mb-1.5 hover:text-orange-400 transition-colors">
                    <Link href="/community">Will 16GB VRAM become mandatory for 1440p High settings?</Link>
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>By @RTX_Overclock</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 89 replies</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 210 likes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
