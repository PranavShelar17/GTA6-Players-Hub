import React from "react";
import { Gamepad2 } from "lucide-react";

interface PlatformFilterProps {
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}

const PLATFORMS = [
  { id: "ALL", label: "All Platforms" },
  { id: "PLAYSTATION_5", label: "PlayStation 5" },
  { id: "XBOX_SERIES", label: "Xbox Series X/S" },
  { id: "PC", label: "PC (Unannounced)" },
];

export function PlatformFilter({
  selectedPlatform,
  onSelectPlatform,
}: PlatformFilterProps) {
  return (
    <div className="flex items-center gap-1.5 bg-[#12151f] border border-[#202738] p-1 rounded-xl overflow-x-auto scrollbar-none">
      {PLATFORMS.map((p) => {
        const isSelected = selectedPlatform === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPlatform(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#181c2b]"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
