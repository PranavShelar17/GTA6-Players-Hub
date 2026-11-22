"use client";

import React from "react";
import { 
  CheckSquare, 
  Cpu, 
  Layers, 
  Thermometer, 
  Wrench, 
  Zap 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UpgradeSuggestion } from "@/lib/pcCompatibilityApi";

interface UpgradeGuidanceSectionProps {
  suggestions: UpgradeSuggestion[];
}

export function UpgradeGuidanceSection({ suggestions }: UpgradeGuidanceSectionProps) {
  return (
    <div className="space-y-6">
      {/* Dynamic Tailored Upgrade Recommendations */}
      {suggestions.length > 0 && (
        <Card className="border-[#1e2330] bg-[#11141e]/90">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-400" />
                <span>Tailored Hardware Upgrade Guidance</span>
              </CardTitle>
              <Badge variant="official">Hardware Checklist</Badge>
            </div>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Priority areas identified from your submitted specifications to optimize open-world gaming performance.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sug.component}</span>
                    <Badge variant={sug.priority === "HIGH" ? "rumour" : sug.priority === "MEDIUM" ? "official" : "outline"}>
                      {sug.priority} Priority
                    </Badge>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {sug.summary}
                </p>

                {sug.technical_considerations.length > 0 && (
                  <div className="space-y-1 pt-1.5 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Technical Considerations Before Upgrading:
                    </span>
                    <ul className="space-y-1">
                      {sug.technical_considerations.map((item, cIdx) => (
                        <li key={cIdx} className="text-xs text-slate-400 flex items-start gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Universal Physical & Electrical Compatibility Matrix */}
      <Card className="border-[#1e2330] bg-[#11141e]/90">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Universal PC Upgrade & Compatibility Checklist</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Essential architectural and hardware checks before purchasing or installing PC components.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Socket & Motherboard */}
          <div className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>CPU Socket & Chipset</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Motherboards only support processors matching their physical socket (e.g., AMD AM4 vs AM5, Intel LGA1700 vs LGA1851).
            </p>
            <div className="text-[11px] text-amber-300/90 font-medium">
              Check if your motherboard requires a BIOS firmware update before dropping in a newer generation processor.
            </div>
          </div>

          {/* RAM Incompatibility */}
          <div className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Memory (RAM) Generation</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              DDR4 and DDR5 memory modules are physically notched differently and electrically incompatible.
            </p>
            <div className="text-[11px] text-slate-400">
              Always install RAM in matching dual-channel pairs (slots 2 & 4 on standard motherboards) for optimal CPU memory bandwidth.
            </div>
          </div>

          {/* PSU & GPU Dimensions */}
          <div className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>PSU Wattage & Case Clearance</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              High-tier graphics cards (RTX 4070+, RX 7800+) typically require a 650W to 850W quality Power Supply Unit.
            </p>
            <div className="text-[11px] text-slate-400">
              Measure chassis internal GPU length (e.g. 300mm–340mm) and ensure your PSU provides dedicated 8-pin or 12V-2x6 cables.
            </div>
          </div>

          {/* Storage & Thermal */}
          <div className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Thermal Management & Storage</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Fast NVMe M.2 SSDs require an available M.2 slot and adequate heatsink thermal pads to avoid throttling.
            </p>
            <div className="text-[11px] text-slate-400">
              Verify case airflow (intake vs exhaust fans) and ensure your CPU cooler TDP rating matches your processor&apos;s boost draw.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
