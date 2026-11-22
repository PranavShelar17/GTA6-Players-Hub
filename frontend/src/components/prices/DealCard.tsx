import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { DealItem } from "@/lib/priceApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { DiscountBadge } from "./DiscountBadge";

interface DealCardProps {
  deal: DealItem;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Card className="flex flex-col justify-between border-[#202738] hover:border-orange-500/40 bg-[#12151f] transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#0c0e17] px-2 py-0.5 rounded border border-[#1d2335]">
            {deal.platform}
          </span>
          <DiscountBadge discountPercentage={deal.discount_percentage} />
        </div>

        <CardTitle className="text-base font-bold text-white mb-2 line-clamp-2">
          {deal.product_name}
        </CardTitle>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{deal.store_name}</span>
          <span>•</span>
          <span>{deal.country_code}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-[#1b2131]">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-2xl font-mono font-black text-white">
              {deal.currency_symbol}{deal.current_price}
            </div>
            {deal.original_price > deal.current_price && (
              <span className="text-xs font-mono text-slate-500 line-through">
                {deal.currency_symbol}{deal.original_price}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {deal.tax_inclusive ? "Tax incl." : "+ Tax"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/price-deals/${deal.slug}`}
            className="flex-1 text-center py-2 bg-[#181c2b] hover:bg-[#202538] text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-[#242b3e]"
          >
            History
          </Link>
          <a
            href={deal.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-500/20"
          >
            <span>View Deal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
