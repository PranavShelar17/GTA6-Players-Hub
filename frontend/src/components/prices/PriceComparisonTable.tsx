import React from "react";
import { ExternalLink, ShieldCheck, Info } from "lucide-react";
import { PriceComparisonOffer } from "@/lib/priceApi";
import { DiscountBadge } from "./DiscountBadge";

interface PriceComparisonTableProps {
  offers: PriceComparisonOffer[];
}

export function PriceComparisonTable({
  offers,
}: PriceComparisonTableProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-[#12151f] rounded-2xl border border-[#202738] p-6">
        <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No retailer offers currently recorded for this edition.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#202738] bg-[#12151f]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#202738] bg-[#0d0f17] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4">Retail Store</th>
              <th className="py-3.5 px-4">Authorisation</th>
              <th className="py-3.5 px-4">Verified Price</th>
              <th className="py-3.5 px-4">Discount</th>
              <th className="py-3.5 px-4">Tax Disclosure</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2131] text-xs">
            {offers.map((offer) => (
              <tr
                key={offer.store_id}
                className={`hover:bg-[#181d2c] transition-colors ${
                  offer.is_best_price ? "bg-orange-500/[0.04]" : ""
                }`}
              >
                <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                  <span>{offer.store_name}</span>
                  {offer.is_best_price && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-slate-950">
                      Best Price
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {offer.seller_authorisation_status === "FIRST_PARTY"
                      ? "Official First-Party"
                      : "Authorised Retailer"}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono font-black text-white text-base">
                  {offer.currency_symbol}{offer.current_price}
                  {offer.original_price && offer.original_price > offer.current_price && (
                    <span className="ml-2 text-xs text-slate-500 line-through">
                      {offer.currency_symbol}{offer.original_price}
                    </span>
                  )}
                  {offer.converted_inr && (
                    <span className="block text-[11px] text-slate-400 font-normal">
                      ~₹{offer.converted_inr.amount_inr} est.
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <DiscountBadge
                    discountPercentage={offer.discount_percentage}
                    isBestPrice={offer.is_best_price}
                  />
                </td>
                <td className="py-4 px-4 text-slate-400 text-[11px]">
                  {offer.tax_inclusive ? "Taxes Included" : "+ Local Sales Tax"}
                </td>
                <td className="py-4 px-4 text-right">
                  <a
                    href={offer.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-orange-500/20"
                  >
                    <span>View Deal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {offers.map((offer) => (
          <div
            key={offer.store_id}
            className={`p-4 rounded-xl border bg-[#12151f] space-y-3 ${
              offer.is_best_price ? "border-orange-500/40" : "border-[#202738]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{offer.store_name}</span>
              {offer.is_best_price && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-slate-950">
                  Best Price
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-mono font-black text-white">
                  {offer.currency_symbol}{offer.current_price}
                </span>
                {offer.original_price && offer.original_price > offer.current_price && (
                  <span className="ml-2 text-xs font-mono text-slate-500 line-through">
                    {offer.currency_symbol}{offer.original_price}
                  </span>
                )}
              </div>
              <DiscountBadge
                discountPercentage={offer.discount_percentage}
                isBestPrice={offer.is_best_price}
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-[#1c2233]">
              <span>{offer.tax_inclusive ? "Taxes Included" : "+ Local Sales Tax"}</span>
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Store
              </span>
            </div>

            <a
              href={offer.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg text-xs transition-all"
            >
              <span>View Deal at {offer.store_name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
