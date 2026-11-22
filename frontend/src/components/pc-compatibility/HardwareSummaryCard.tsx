"use client";

import React from "react";
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Layers, 
  Zap, 
  Clock 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface HardwareSummaryCardProps {
  summary: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    os?: string;
    display?: string;
    [key: string]: string | undefined;
  };
  checkedAt?: string;
}

export function HardwareSummaryCard({ summary, checkedAt }: HardwareSummaryCardProps) {
  return (
    <Card className="border-[#1e2330] bg-[#111520]/80">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span>Submitted Hardware Rig</span>
          </CardTitle>
          {checkedAt && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(checkedAt).toLocaleDateString()}</span>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-2.5">
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161a27] border border-white/5">
          <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Processor</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{summary.cpu || "Not Specified"}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161a27] border border-white/5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Graphics Card</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{summary.gpu || "Not Specified"}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161a27] border border-white/5">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Memory</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{summary.ram || "Not Specified"}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161a27] border border-white/5">
          <HardDrive className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage</div>
            <div className="text-xs font-semibold text-slate-200 truncate">{summary.storage || "Not Specified"}</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161a27] border border-white/5">
          <Monitor className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">OS & Display Target</div>
            <div className="text-xs font-semibold text-slate-200 truncate">
              {summary.os} | {summary.display}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
