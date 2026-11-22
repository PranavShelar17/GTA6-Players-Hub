import React from "react";
import { Globe } from "lucide-react";
import { PriceRegion } from "@/lib/priceApi";

interface RegionSelectorProps {
  regions: PriceRegion[];
  selectedCountryCode: string;
  onSelectRegion: (countryCode: string) => void;
}

export function RegionSelector({
  regions,
  selectedCountryCode,
  onSelectRegion,
}: RegionSelectorProps) {
  const getFlagEmoji = (code: string) => {
    switch (code) {
      case "IND": return "🇮🇳";
      case "USA": return "🇺🇸";
      case "GBR": return "🇬🇧";
      case "EUR": return "🇪🇺";
      case "ARE": return "🇦🇪";
      default: return "🌐";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
        <Globe className="w-4 h-4 text-orange-400" />
        <span>Region & Currency:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {regions.map((reg) => {
          const isSelected = reg.country_code === selectedCountryCode;
          return (
            <button
              key={reg.id}
              onClick={() => onSelectRegion(reg.country_code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                  : "bg-[#12151f] text-slate-300 border border-[#202738] hover:border-slate-600 hover:text-white"
              }`}
            >
              <span>{getFlagEmoji(reg.country_code)}</span>
              <span>{reg.region_name}</span>
              <span className={`text-[11px] font-mono ${isSelected ? "text-slate-950/80" : "text-slate-400"}`}>
                ({reg.currency_symbol}{reg.currency_code})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
