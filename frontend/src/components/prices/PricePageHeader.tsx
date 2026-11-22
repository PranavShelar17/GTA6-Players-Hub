import React from "react";
import { Tag, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface PricePageHeaderProps {
  lastUpdated?: string | null;
  totalDeals?: number;
  totalVerified?: number;
}

export function PricePageHeader({
  lastUpdated,
  totalDeals = 0,
  totalVerified = 0,
}: PricePageHeaderProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Live Monitoring";

  return (
    <div className="border-b border-[#202738] bg-[#0c0e17] py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <Tag className="w-3.5 h-3.5" />
                Price Intelligence
              </span>
              <Badge variant="verified">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {totalVerified > 0 ? `${totalVerified} Verified Observations` : "Verified Authorized Stores"}
              </Badge>
              {totalDeals > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {totalDeals} Active Verified Deals
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              GTA 6 Price & Deals Tracker
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed">
              Real-time verified retail pre-order pricing, official store comparisons, and historical tracking across international currencies.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#12151f] border border-[#202738] px-3.5 py-2 rounded-lg self-start md:self-auto shrink-0">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Last Verified Update:</span>
            <span className="font-semibold text-slate-200">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
