"use client";

import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck 
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RequirementsStatusResponse } from "@/lib/pcCompatibilityApi";

interface RequirementsStatusCardProps {
  statusData: RequirementsStatusResponse;
}

export function RequirementsStatusCard({ statusData }: RequirementsStatusCardProps) {
  const isConfirmed = statusData.is_available && statusData.status === "OFFICIAL_AVAILABLE";

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      isConfirmed
        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-100"
        : "border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#161a26] to-[#121520] text-amber-200"
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {isConfirmed ? (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Specification Status</span>
              <Badge variant={isConfirmed ? "verified" : "unconfirmed"}>
                {isConfirmed ? "Official Requirements Available" : "Requirements Not Yet Confirmed"}
              </Badge>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {statusData.notice_title}
            </h2>
          </div>
        </div>

        {statusData.source_url && (
          <a
            href={statusData.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/30"
          >
            <span>{statusData.source_name || "Rockstar Games Newswire"}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Mandatory Notice Text */}
      <div className="mt-4 space-y-3">
        <div className="p-4 rounded-lg bg-[#0f121b]/80 border border-white/5">
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            {statusData.notice_message}
          </p>
        </div>

        {/* Anti-fabrication policy statement */}
        <div className="flex items-start gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-300">Truth Verification & Player Trust:</strong> GTA 6 Player Hub strictly avoids speculative hardware ratings, fabricated FPS predictions, or arbitrary bottleneck percentages. All checks provide neutral, objective hardware observations until verified specifications are published.
          </p>
        </div>
      </div>
    </div>
  );
}
