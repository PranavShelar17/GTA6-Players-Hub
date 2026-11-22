import React from "react";
import Link from "next/link";
import { PriceProductListItem } from "@/lib/priceApi";
import { Card, CardTitle } from "@/components/ui/Card";
import { PriceWishlistButton } from "./PriceWishlistButton";
import { DiscountBadge } from "./DiscountBadge";

interface PriceComparisonCardProps {
  product: PriceProductListItem;
  token?: string | null;
  onSetAlert?: (productId: string, productName: string, price: number) => void;
}

export function PriceComparisonCard({
  product,
  token,
  onSetAlert,
}: PriceComparisonCardProps) {
  const isPC = product.platform === "PC";

  return (
    <Card className="flex flex-col justify-between border-[#202738] hover:border-slate-700 bg-[#12151f] transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider bg-[#0c0e17] px-2.5 py-1 rounded border border-[#1e2436]">
            {product.platform}
          </span>
          <div className="flex items-center gap-1.5">
            {product.available_stores_count > 0 && (
              <span className="text-[11px] font-semibold text-slate-400 bg-[#0e111a] px-2 py-0.5 rounded border border-[#1b2131]">
                {product.available_stores_count} Stores
              </span>
            )}
            <PriceWishlistButton productId={product.id} token={token} />
          </div>
        </div>

        <CardTitle className="text-lg font-bold text-white mb-2 line-clamp-2">
          {product.name}
        </CardTitle>

        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {product.description || "Base game pre-order listing across authorized digital and retail storefronts."}
        </p>
      </div>

      <div className="pt-3 border-t border-[#1b2131]">
        {isPC ? (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 mb-3 text-center">
            <span className="text-xs font-bold text-amber-400 block mb-0.5">
              Official PC Pricing Unavailable
            </span>
            <span className="text-[11px] text-slate-400 block">
              Pre-orders have not opened
            </span>
          </div>
        ) : (
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium">
                Lowest Verified Price
              </span>
              <span className="text-2xl font-mono font-black text-white">
                {product.lowest_verified_price
                  ? `${product.currency_symbol || ""}${product.lowest_verified_price}`
                  : "Updating..."}
              </span>
            </div>
            <DiscountBadge discountPercentage={0} isBestPrice={true} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={`/price-deals/${product.slug}`}
            className="flex-1 text-center py-2.5 bg-[#181c2b] hover:bg-[#202538] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-[#242b3e]"
          >
            Compare & History
          </Link>

          {!isPC && onSetAlert && (
            <button
              onClick={() =>
                onSetAlert(
                  product.id,
                  product.name,
                  product.lowest_verified_price || 0
                )
              }
              className="py-2.5 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-xl text-xs font-bold transition-colors"
              title="Set Target Price Alert"
            >
              Alert
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
