import React from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface NewsDetailProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { slug } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back button */}
      <Link href="/news" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to News & Updates
      </Link>

      {/* Article Header */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="official">Official Announcement</Badge>
          <span className="text-xs text-slate-400">• Published: Nov 2026</span>
          <span className="text-xs text-slate-400">• Article ID: {slug}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Take-Two Interactive Officially Reconfirms Grand Theft Auto VI Fall 2025 Release Window
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
          Executive leadership affirms that Rockstar Games is on schedule for the anticipated autumn launch on PlayStation 5 and Xbox Series X/S platforms.
        </p>

        {/* Source Meta Box */}
        <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Primary Source:</span>
            <span className="font-semibold text-white">Take-Two Interactive Software, Inc. (Investor Relations)</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-slate-300 hover:text-orange-400 transition-colors">
              <Bookmark className="w-3.5 h-3.5" /> Bookmark
            </button>
            <button className="flex items-center gap-1 text-slate-300 hover:text-orange-400 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <article className="prose prose-invert max-w-none text-slate-300 space-y-6 leading-relaxed text-sm sm:text-base border-t border-[#1a1f2b] pt-8">
        <p>
          In its latest quarterly earnings call, Take-Two Interactive management provided high-confidence affirmations regarding the release schedule of Grand Theft Auto VI. Despite widespread online rumors suggesting possible delays into 2026, the company confirmed the calendar window remains anchored to Fall 2025.
        </p>

        <h3 className="text-xl font-bold text-white pt-4">Official Affirmation from Leadership</h3>
        <p>
          The company highlighted the unprecedented audience engagement with the initial reveal trailer, which surpassed 200 million views faster than any entertainment video in history. Rockstar Games continues full-scale development across its worldwide studio network to deliver an unmatched standard of open-world simulation in the state of Leonida.
        </p>

        <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-900/30 text-orange-200 text-sm">
          <strong>Key Takeaway:</strong> Release remains officially planned for Fall 2025 on PlayStation 5 and Xbox Series X/S. PC edition status has not been officially confirmed by Rockstar Games.
        </div>

        <h3 className="text-xl font-bold text-white pt-4">Transparent Verification Policy</h3>
        <p>
          GTA 6 Player Hub enforces a strict factual verification protocol. Statements from Take-Two financial disclosures and Rockstar Newswire represent Level 1 Official records. Community analyses or third-party retailer listings are strictly segregated under Rumour and Unconfirmed tiers.
        </p>
      </article>

      {/* Footer Navigation */}
      <div className="mt-12 pt-6 border-t border-[#1a1f2b] flex items-center justify-between">
        <Link href="/news">
          <Button variant="secondary" size="sm">
            ← Browse All News
          </Button>
        </Link>
        <Link href="/pc-compatibility">
          <Button variant="primary" size="sm">
            Next: Check PC Compatibility →
          </Button>
        </Link>
      </div>

    </div>
  );
}
