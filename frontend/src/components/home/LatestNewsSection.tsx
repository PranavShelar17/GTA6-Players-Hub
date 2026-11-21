import React from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HomeNewsItem } from "@/lib/homeApi";
import { HomePageEmptyState } from "./HomePageEmptyState";

interface LatestNewsSectionProps {
  news: HomeNewsItem[];
  isFallback?: boolean;
}

export function LatestNewsSection({ news, isFallback }: LatestNewsSectionProps) {
  if (!news || news.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          tag="Editorial Feed"
          title="Latest GTA 6 News & Bulletins"
          subtitle="Strictly verified updates with transparent source citations."
          viewAllHref="/news"
          viewAllLabel="All News"
        />
        <HomePageEmptyState
          title="No News Available"
          description="There are currently no published news articles. Check back shortly for updates from Rockstar Newswire."
        />
      </section>
    );
  }

  const badgeVariantFor = (status: string): "official" | "verified" | "rumour" | "unconfirmed" => {
    switch (status.toUpperCase()) {
      case "OFFICIAL":
        return "official";
      case "VERIFIED":
        return "verified";
      case "RUMOUR":
        return "rumour";
      default:
        return "unconfirmed";
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <SectionHeader
        tag="Editorial Feed"
        title="Latest GTA 6 News & Bulletins"
        subtitle="Strictly verified updates with transparent source citations."
        viewAllHref="/news"
        viewAllLabel="All News & Bulletins"
      />

      {isFallback && (
        <div className="mb-4 text-xs text-slate-400 bg-[#12151f] border border-[#202738] rounded-lg px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-400">[SAMPLE CONTENT]:</span>
            <span>Sample news entries demonstrating layout and 4-tier verification badges. Real automated ingestion connects in Phase 4.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between hover:border-orange-500/40 transition-all duration-200">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant={badgeVariantFor(item.verification_status)}>
                  {item.verification_status}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[160px]" title={item.source_name}>
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.source_name}</span>
                </span>
              </div>

              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider block mb-1.5">
                {item.category}
              </span>

              <CardTitle className="text-lg leading-snug">
                <Link href="/news" className="hover:text-orange-400 transition-colors">
                  {item.title}
                </Link>
              </CardTitle>

              <CardDescription className="mt-2.5 leading-relaxed text-sm">
                {item.summary}
              </CardDescription>
            </div>

            <CardFooter className="justify-between text-xs text-slate-400 pt-5 mt-4 border-t border-[#181d2a]">
              <span>{formatDate(item.published_at)}</span>
              <Link href="/news" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 group">
                Read More
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
