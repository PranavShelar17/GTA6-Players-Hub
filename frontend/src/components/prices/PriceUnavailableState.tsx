import React from "react";
import { Info, AlertCircle } from "lucide-react";

interface PriceUnavailableStateProps {
  title?: string;
  message?: string;
  isPC?: boolean;
}

export function PriceUnavailableState({
  title = "Pricing Not Currently Available",
  message = "Official verified store listings and pre-orders have not yet been activated by publisher.",
  isPC = false,
}: PriceUnavailableStateProps) {
  return (
    <div className="bg-[#12151f] border border-amber-500/20 rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
        {isPC ? <AlertCircle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
        {isPC ? "Official PC Pricing Is Not Currently Available" : title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-4">
        {isPC
          ? "Rockstar Games and Take-Two Interactive have confirmed GTA 6 for PlayStation 5 and Xbox Series X/S in Fall 2025. Official PC pre-orders and pricing have not been announced. We do not display fabricated or speculative PC prices."
          : message}
      </p>
      <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-300/90 bg-amber-950/30 border border-amber-500/20 px-3.5 py-1.5 rounded-lg">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Transparent Verification Standard Level 4: Transparent Disclosure</span>
      </div>
    </div>
  );
}
