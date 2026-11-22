import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { DealItem } from "@/lib/priceApi";
import { DiscountBadge } from "./DiscountBadge";

interface FeaturedBestPriceProps {
  deal: DealItem;
}

export function FeaturedBestPrice({ deal }: FeaturedBestPriceProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171b29] via-[#121520] to-[#1a1523] border border-orange-500/30 p-6 sm:p-8 shadow-xl shadow-orange-950/20 mb-8">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Best Verified Value Deal
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#0e111a] px-2.5 py-1 rounded border border-[#1e2435]">
              {deal.platform}
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-[#0e111a] px-2.5 py-1 rounded border border-[#1e2435]">
              {deal.edition}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {deal.product_name}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Retailer: <strong className="text-white">{deal.store_name}</strong></span>
            </span>
            <span>•</span>
            <span>Region: <strong className="text-white">{deal.country_code}</strong></span>
            <span>•</span>
            <span>{deal.tax_inclusive ? "Taxes Included" : "Taxes Calculated at Checkout"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 bg-[#0c0e17]/80 p-5 rounded-2xl border border-[#202738]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black text-white">
                {deal.currency_symbol}{deal.current_price}
              </span>
              {deal.original_price > deal.current_price && (
                <span className="text-sm sm:text-base font-mono text-slate-500 line-through">
                  {deal.currency_symbol}{deal.original_price}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <DiscountBadge discountPercentage={deal.discount_percentage} isBestPrice={true} />
              <span className="text-xs text-slate-400">Verified Pre-Order</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              href={`/price-deals/${deal.slug}`}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#181c2b] hover:bg-[#22273b] border border-[#262e43] rounded-xl transition-colors"
            >
              Price History
            </Link>
            <a
              href={deal.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              <span>View Deal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
