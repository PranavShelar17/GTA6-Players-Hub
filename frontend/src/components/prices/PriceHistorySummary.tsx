import React from "react";
import { TrendingDown, TrendingUp, Hash } from "lucide-react";

interface PriceHistorySummaryProps {
  currentPrice?: number | null;
  lowestPrice?: number | null;
  highestPrice?: number | null;
  totalObservations: number;
  trackingStart?: string | null;
  currencySymbol: string;
}

export function PriceHistorySummary({
  currentPrice,
  lowestPrice,
  highestPrice,
  totalObservations,
  trackingStart,
  currencySymbol,
}: PriceHistorySummaryProps) {
  const startDate = trackingStart
    ? new Date(trackingStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recent";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      <div className="bg-[#12151f] border border-[#202738] rounded-xl p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Current Verified Price
        </span>
        <div className="text-xl sm:text-2xl font-mono font-black text-white">
          {currentPrice ? `${currencySymbol}${currentPrice}` : "TBA"}
        </div>
      </div>

      <div className="bg-[#12151f] border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Historical Lowest
          </span>
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
          {lowestPrice ? `${currencySymbol}${lowestPrice}` : "TBA"}
        </div>
      </div>

      <div className="bg-[#12151f] border border-[#202738] rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Historical Highest
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl sm:text-2xl font-mono font-black text-slate-300">
          {highestPrice ? `${currencySymbol}${highestPrice}` : "TBA"}
        </div>
      </div>

      <div className="bg-[#12151f] border border-[#202738] rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tracked Since {startDate}
          </span>
          <Hash className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <div className="text-xl sm:text-2xl font-mono font-black text-orange-400">
          {totalObservations} Observations
        </div>
      </div>
    </div>
  );
}
