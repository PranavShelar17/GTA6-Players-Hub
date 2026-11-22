"use client";

import React from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompatibilityCheckResponse, ComponentResult } from "@/lib/pcCompatibilityApi";

interface CompatibilityResultSectionProps {
  result: CompatibilityCheckResponse;
}

export function CompatibilityResultSection({ result }: CompatibilityResultSectionProps) {
  const isPendingOfficial = result.result_status === "REQUIREMENTS_UNAVAILABLE";

  const getStatusBadge = (status: ComponentResult["status"]) => {
    switch (status) {
      case "EXCEEDS":
        return <Badge variant="verified">Exceeds Target</Badge>;
      case "MEETS":
        return <Badge variant="verified">Meets Target</Badge>;
      case "BELOW":
        return <Badge variant="rumour">Below Baseline</Badge>;
      case "UNABLE_TO_COMPARE":
      default:
        return <Badge variant="unconfirmed">Awaiting Official Data</Badge>;
    }
  };

  const getStatusIcon = (status: ComponentResult["status"]) => {
    switch (status) {
      case "EXCEEDS":
      case "MEETS":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "BELOW":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "UNABLE_TO_COMPARE":
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <Card className="border-[#1e2330] bg-[#11141e]/90">
      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Analysis Diagnostic</span>
              {isPendingOfficial ? (
                <Badge variant="unconfirmed">Official Requirements Pending</Badge>
              ) : result.result_status === "STRONG_MATCH" ? (
                <Badge variant="verified">Strong Match</Badge>
              ) : result.result_status === "RECOMMENDED_MET" ? (
                <Badge variant="verified">Recommended Met</Badge>
              ) : result.result_status === "MINIMUM_MET" ? (
                <Badge variant="official">Minimum Met</Badge>
              ) : (
                <Badge variant="rumour">Below Minimum</Badge>
              )}
            </div>
            <CardTitle className="text-lg text-white">
              {isPendingOfficial 
                ? "Hardware Balance & Readiness Diagnostic" 
                : "Compatibility Check Result"}
            </CardTitle>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-[#161a27] p-3 rounded-lg border border-white/5">
          {result.analysis_summary}
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
          Component Breakdown & Target Comparison
        </h4>

        <div className="space-y-2.5">
          {result.component_results.map((comp, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#151926] border border-[#222a3d] hover:border-[#2f3950] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  {getStatusIcon(comp.status)}
                  <span className="text-xs font-bold text-white">{comp.component}</span>
                </div>
                <div>{getStatusBadge(comp.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Hardware:</span>
                  <div className="text-slate-200 font-medium">{comp.user_value}</div>
                </div>
                {comp.required_value && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required Target:</span>
                    <div className="text-slate-400 font-medium">{comp.required_value}</div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-[#10131e] p-2 rounded border border-white/5">
                {comp.explanation}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
