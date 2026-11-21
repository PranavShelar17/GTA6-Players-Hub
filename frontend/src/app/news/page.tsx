import React from "react";
import Link from "next/link";
import { 
  Newspaper, 
  Search, 
  Clock, 
  ExternalLink, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const DEMO_NEWS = [
  {
    slug: "take-two-reconfirms-gta-6-fall-2025",
    title: "Take-Two Interactive Officially Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
    summary: "In its Q2 financial disclosure and earnings presentation, publisher Take-Two confirmed that Rockstar Games' development timeline remains securely targeted for Fall 2025.",
    status: "official" as const,
    source: "Rockstar Newswire / Take-Two IR",
    sourceUrl: "https://www.take2games.com",
    date: "Nov 2026",
    category: "Release & Corporate",
    readTime: "3 min read",
    isFeatured: true
  },
  {
    slug: "digital-foundry-trailer-engine-breakdown",
    title: "Digital Foundry Technical Analysis: RAGE 9 Global Illumination & Volumetric Clouds",
    summary: "In-depth technical breakdown of the initial Leonida trailer showcasing hardware-accelerated ray tracing, real-world fluid simulations, and hair physics running on 9th-generation consoles.",
    status: "verified" as const,
    source: "Digital Foundry / Eurogamer",
    sourceUrl: "https://www.eurogamer.net",
    date: "Nov 2026",
    category: "Engine & Graphics",
    readTime: "6 min read",
    isFeatured: false
  },
  {
    slug: "pc-version-cadence-and-hardware-speculation",
    title: "Industry Analysts Evaluate Historical PC Release Windows for Rockstar Titles",
    summary: "Reviewing previous Rockstar launch schedules indicates PC editions historically follow 12 to 18 months post-console release. Official PC availability remains unannounced.",
    status: "unconfirmed" as const,
    source: "Gaming Business Journal",
    sourceUrl: "https://www.gamesindustry.biz",
    date: "Nov 2026",
    category: "PC Gaming",
    readTime: "4 min read",
    isFeatured: false
  },
  {
    slug: "leonida-wildlife-and-dynamic-ecosystems",
    title: "Community Breakdown: AI Animal Behavior and Florida Everglades Parallels",
    summary: "Detailed visual catalog of wildlife observed across coastal regions, swamps, and urban Vice City streets, pointing toward an evolutionary leap in dynamic environmental simulation.",
    status: "verified" as const,
    source: "GTA Community Analysis",
    sourceUrl: "https://www.ign.com",
    date: "Nov 2026",
    category: "Community Discoveries",
    readTime: "5 min read",
    isFeatured: false
  }
];

export default function NewsPage() {
  const featuredArticle = DEMO_NEWS.find((n) => n.isFeatured) || DEMO_NEWS[0];
  const regularArticles = DEMO_NEWS.filter((n) => !n.isFeatured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          <Newspaper className="w-4 h-4" />
          <span>Information Bureau</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          GTA 6 News & Updates
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Verified bulletins, official Rockstar statements, technical analyses, and clear 4-tier truth labeling.
        </p>
      </div>

      {/* Label Legend Explanation */}
      <div className="mb-8 p-4 rounded-xl border border-[#1e2330] bg-[#10121a] flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-slate-300">Verification Standard:</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="official">Official</Badge>
          <span className="text-slate-400">Direct from Rockstar / Take-Two</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="verified">Verified</Badge>
          <span className="text-slate-400">Reputable press investigation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="rumour">Rumour</Badge>
          <span className="text-slate-400">Uncorroborated report</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="unconfirmed">Unconfirmed</Badge>
          <span className="text-slate-400">Pending publisher validation</span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <Input 
          icon={<Search className="w-4 h-4" />}
          placeholder="Filter news by keywords, source, or topic..."
          className="w-full sm:max-w-md"
        />
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Button variant="primary" size="sm">All</Button>
          <Button variant="secondary" size="sm">Official Only</Button>
          <Button variant="secondary" size="sm">Engine & Tech</Button>
          <Button variant="secondary" size="sm">Platforms</Button>
        </div>
      </div>

      {/* Featured Big Card */}
      <div className="mb-10">
        <Card className="border-orange-500/30 bg-gradient-to-br from-[#151824] to-[#0e1017] p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={featuredArticle.status}>{featuredArticle.status}</Badge>
              <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
                Featured Announcement
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {featuredArticle.date} • {featuredArticle.readTime}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 hover:text-orange-400 transition-colors">
            <Link href={`/news/${featuredArticle.slug}`}>
              {featuredArticle.title}
            </Link>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-3xl">
            {featuredArticle.summary}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-[#202738] text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Source:</span>
              <a 
                href={featuredArticle.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {featuredArticle.source}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Link href={`/news/${featuredArticle.slug}`}>
              <Button variant="primary" size="sm" className="gap-1.5">
                Read Full Story
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Grid of Other Articles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {regularArticles.map((article) => (
          <Card key={article.slug} className="flex flex-col justify-between border-[#1e2330]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant={article.status}>{article.status}</Badge>
                <span className="text-xs text-slate-500">{article.date}</span>
              </div>

              <CardTitle className="text-base sm:text-lg mb-2 leading-snug">
                <Link href={`/news/${article.slug}`} className="hover:text-orange-400 transition-colors">
                  {article.title}
                </Link>
              </CardTitle>

              <CardDescription className="leading-relaxed text-xs sm:text-sm line-clamp-3">
                {article.summary}
              </CardDescription>
            </div>

            <CardFooter className="justify-between pt-4 border-t border-[#1a1f2b] text-xs text-slate-400">
              <span className="font-medium text-slate-300">{article.source}</span>
              <Link href={`/news/${article.slug}`} className="text-orange-400 hover:text-orange-300 font-semibold">
                Read →
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

    </div>
  );
}
