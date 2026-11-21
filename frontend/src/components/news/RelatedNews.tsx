import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { NewsArticleItem } from "@/lib/newsApi";
import { NewsVerificationBadge } from "./NewsVerificationBadge";

interface RelatedNewsProps {
  articles: NewsArticleItem[];
}

export function RelatedNews({ articles }: RelatedNewsProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="pt-10 border-t border-[#1a1f2b] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
            Related Coverage
          </span>
          <h3 className="text-2xl font-black text-white">More on this Topic</h3>
        </div>
        <Link
          href="/news"
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 group"
        >
          <span>View All News</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between hover:border-orange-500/40 transition-all p-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <NewsVerificationBadge status={item.verification_status} />
                <span className="text-[11px] text-slate-500">{item.source_name}</span>
              </div>
              <CardTitle className="text-base leading-snug line-clamp-2 mb-2">
                <Link href={`/news/${item.slug}`} className="hover:text-orange-400 transition-colors">
                  {item.title}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                {item.summary}
              </CardDescription>
            </div>

            <CardFooter className="p-0 pt-4 mt-3 border-t border-[#181d2a] justify-between text-xs">
              <span className="text-slate-500">{item.read_time_minutes}m read</span>
              <Link href={`/news/${item.slug}`} className="text-orange-400 hover:text-orange-300 font-medium">
                Read →
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
