import React from "react";
import { ShieldCheck, ExternalLink, Building2 } from "lucide-react";

interface StoreInformationProps {
  storeName: string;
  storeType: string;
  sellerAuthorisationStatus: string;
  productUrl: string;
}

export function StoreInformation({
  storeName,
  storeType,
  sellerAuthorisationStatus,
  productUrl,
}: StoreInformationProps) {
  const isFirstParty = storeType === "FIRST_PARTY" || sellerAuthorisationStatus === "FIRST_PARTY";

  return (
    <div className="flex items-center justify-between text-xs text-slate-400 bg-[#0e111a] p-2.5 rounded-lg border border-[#1b2234]">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
        <span className="font-semibold text-slate-200">{storeName}</span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isFirstParty
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          {isFirstParty ? "Official Publisher/Store" : "Authorised Retailer"}
        </span>
      </div>

      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-400 transition-colors"
      >
        <span>Store Link</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
