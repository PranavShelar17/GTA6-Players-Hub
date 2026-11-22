"use client";

import React from "react";
import { 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle2, 
  SlidersHorizontal 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BottleneckNote } from "@/lib/pcCompatibilityApi";

interface HardwareBottleneckAnalysisProps {
  bottleneckNotes: BottleneckNote[];
}

export function HardwareBottleneckAnalysis({ bottleneckNotes }: HardwareBottleneckAnalysisProps) {
  const getSeverityBadge = (severity: BottleneckNote["severity"]) => {
    switch (severity) {
      case "LIMITATION":
        return <Badge variant="rumour">Hard Limitation</Badge>;
      case "WARNING":
        return <Badge variant="official">Potential Bottleneck</Badge>;
      case "INFO":
      default:
        return <Badge variant="outline">Informational</Badge>;
    }
  };

  const getSeverityIcon = (severity: BottleneckNote["severity"]) => {
    switch (severity) {
      case "LIMITATION":
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
      case "INFO":
      default:
        return <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <Card className="border-[#1e2330] bg-[#11141e]/90">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span>Hardware Balance & Bottleneck Observations</span>
          </CardTitle>
          <span className="text-[11px] text-slate-400">Objective System Analysis</span>
        </div>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Architectural considerations for open-world gaming performance, free of speculative percentages.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {bottleneckNotes.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No critical system bottlenecks identified in this hardware configuration. Components appear well-balanced for contemporary gaming workloads.</span>
          </div>
        ) : (
          bottleneckNotes.map((note, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-[#151926] border border-[#222a3d] space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(note.severity)}
                  <div>
                    <h5 className="text-xs font-bold text-white">{note.title}</h5>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Component: {note.component}
                    </span>
                  </div>
                </div>
                <div>{getSeverityBadge(note.severity)}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                {note.description}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
