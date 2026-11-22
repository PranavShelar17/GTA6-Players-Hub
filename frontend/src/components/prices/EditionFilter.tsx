import React from "react";
import { Layers } from "lucide-react";

interface EditionFilterProps {
  selectedEdition: string;
  onSelectEdition: (edition: string) => void;
}

const EDITIONS = [
  { id: "ALL", label: "All Editions" },
  { id: "STANDARD", label: "Standard Edition" },
  { id: "SPECIAL", label: "Special Edition" },
  { id: "ULTIMATE", label: "Ultimate Edition" },
];

export function EditionFilter({
  selectedEdition,
  onSelectEdition,
}: EditionFilterProps) {
  return (
    <div className="flex items-center gap-1.5 bg-[#12151f] border border-[#202738] p-1 rounded-xl overflow-x-auto scrollbar-none">
      {EDITIONS.map((e) => {
        const isSelected = selectedEdition === e.id;
        return (
          <button
            key={e.id}
            onClick={() => onSelectEdition(e.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-slate-700/50 text-slate-100 border border-slate-600/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#181c2b]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>{e.label}</span>
          </button>
        );
      })}
    </div>
  );
}
