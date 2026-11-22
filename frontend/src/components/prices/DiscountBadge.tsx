import React from "react";
import { Tag } from "lucide-react";

interface DiscountBadgeProps {
  discountPercentage: number;
  isBestPrice?: boolean;
}

export function DiscountBadge({ discountPercentage, isBestPrice }: DiscountBadgeProps) {
  if (discountPercentage > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950/20">
        <Tag className="w-3 h-3" />
        Save {discountPercentage}%
      </span>
    );
  }

  if (isBestPrice) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
        Lowest Price
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-800/40 border border-slate-700/40">
      Standard MSRP
    </span>
  );
}
