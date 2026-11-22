"use client";

import React from "react";
import { Sparkles, Eye } from "lucide-react";
import { AIServiceStatus } from "@/lib/problemSolverApi";

interface AIServiceStatusBadgeProps {
  status: AIServiceStatus | null;
  loading?: boolean;
}

export function AIServiceStatusBadge({ status, loading }: AIServiceStatusBadgeProps) {
  if (loading || !status) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151926] border border-[#21283d] text-xs text-slate-400 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-slate-500" />
        <span>Checking AI Diagnostic Engine...</span>
      </div>
    );
  }

  const isOnline = status.status === "ONLINE" || status.status === "MOCK_MODE";
  const isMock = status.status === "MOCK_MODE";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
          isOnline
            ? isMock
              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            : "bg-rose-500/10 text-rose-300 border-rose-500/30"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline
              ? isMock
                ? "bg-amber-400 animate-pulse"
                : "bg-emerald-400 animate-pulse"
              : "bg-rose-500"
          }`}
        />
        <span className="font-semibold">
          {isMock ? "Mock Diagnostic Mode" : "AI Diagnostic Live"}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-300 font-mono text-[11px]">{status.model}</span>
      </div>

      {status.supports_vision && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium">
          <Eye className="w-3 h-3 text-sky-400" />
          <span>Screenshot Analysis Ready</span>
        </div>
      )}

      {status.knowledge_documents_indexed > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>{status.knowledge_documents_indexed} Knowledge Docs</span>
        </div>
      )}
    </div>
  );
}
