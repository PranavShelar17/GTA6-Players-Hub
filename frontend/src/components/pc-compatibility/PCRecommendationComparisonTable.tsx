"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  BatteryCharging, 
  Gauge, 
  Layers,
  Filter,
  Code
} from "lucide-react";
import { 
  UserVsRecommendationComparisonResponse, 
  PCHardwareProfileCreate, 
  compareUserPCWithRecommendations,
  UpgradeAdvisorPlan
} from "@/lib/pcCompatibilityApi";

interface PCRecommendationComparisonTableProps {
  currentSpecs?: PCHardwareProfileCreate;
  activeProfileId?: string;
  token?: string;
  onUpgradeAdvisorPlan?: (plan: UpgradeAdvisorPlan | null) => void;
}

export function PCRecommendationComparisonTable({
  currentSpecs,
  activeProfileId,
  token,
  onUpgradeAdvisorPlan,
}: PCRecommendationComparisonTableProps) {
  const [data, setData] = useState<UserVsRecommendationComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View Mode: Simple (Beginner) vs Detailed Technical (Advanced)
  const [viewMode, setViewMode] = useState<"SIMPLE" | "DETAILED">("SIMPLE");

  // Comparison Target: ALL, TOP, MEDIUM, LOW
  const [comparisonTarget, setComparisonTarget] = useState<"ALL" | "TOP" | "MEDIUM" | "LOW">("ALL");

  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);
    compareUserPCWithRecommendations(
      {
        profileId: activeProfileId,
        customSpecs: currentSpecs,
      },
      token
    )
      .then((res) => {
        setData(res);
        if (onUpgradeAdvisorPlan) {
          onUpgradeAdvisorPlan(res.upgrade_advisor || null);
        }
      })
      .catch((err) => {
        console.error("Failed to load user vs recommendation comparison:", err);
        setErrorMsg(err.message || "Failed to compare your hardware with recommendations.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentSpecs, activeProfileId, token, onUpgradeAdvisorPlan]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 border border-rose-500/50">
            Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/25 text-orange-300 border border-orange-500/50">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Medium
          </span>
        );
      case "LOW":
      case "OPTIONAL":
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Low
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            None (Good)
          </span>
        );
    }
  };

  const getCapabilityBadge = (label?: string, fallbackStatus?: string) => {
    const text = label || (
      fallbackStatus === "EXCEEDS_ALL" || fallbackStatus === "MEETS_HIGH"
        ? "Better hardware capability"
        : fallbackStatus === "MEETS_MID"
        ? "Similar hardware capability"
        : fallbackStatus === "MEETS_ENTRY"
        ? "Lower hardware capability"
        : "Lower hardware capability"
    );

    if (text === "Better hardware capability") {
      return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded whitespace-nowrap">
          {text}
        </span>
      );
    }
    if (text === "Similar hardware capability") {
      return (
        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/40 px-2 py-0.5 rounded whitespace-nowrap">
          {text}
        </span>
      );
    }
    if (text === "Lower hardware capability") {
      return (
        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded whitespace-nowrap">
          {text}
        </span>
      );
    }
    if (text === "Not compatible") {
      return (
        <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/40 px-2 py-0.5 rounded whitespace-nowrap">
          {text}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/40 border border-slate-700/40 px-2 py-0.5 rounded whitespace-nowrap">
        {text || "Insufficient information"}
      </span>
    );
  };

  return (
    <section id="user-comparison-table" className="space-y-5 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Intelligent Hardware Benchmarking</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Your PC vs. Recommended Gaming Tiers
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
            Neutral, objective comparison matrix highlighting capability standings, architectural differences, and power headroom.
          </p>
        </div>

        {/* View Mode Toggle (Simple vs Detailed Technical) */}
        <div className="flex items-center gap-2 bg-[#131724] p-1 rounded-xl border border-[#232b3c] self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("SIMPLE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "SIMPLE"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Simple View (Beginner)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("DETAILED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "DETAILED"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Detailed Technical (Advanced)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center bg-[#11141e] rounded-xl border border-white/5 space-y-2">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Comparing your specifications to reference gaming tiers...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Filter Bar: Comparison Targets */}
          <div className="p-3 rounded-xl bg-[#141824] border border-[#21293c] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Filter className="w-4 h-4 text-sky-400" />
              <span>Comparison Target:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All 3 Builds Together" },
                { id: "TOP", label: "Current PC vs TOP (High-End)" },
                { id: "MEDIUM", label: "Current PC vs MEDIUM (Balanced)" },
                { id: "LOW", label: "Current PC vs LOW (Entry-Level)" },
              ].map((tgt) => (
                <button
                  key={tgt.id}
                  type="button"
                  onClick={() => setComparisonTarget(tgt.id as "ALL" | "TOP" | "MEDIUM" | "LOW")}
                  className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                    comparisonTarget === tgt.id
                      ? "bg-sky-500 text-white border-sky-400"
                      : "bg-[#181d2c] text-slate-400 border-[#262f44] hover:text-slate-200"
                  }`}
                >
                  {tgt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overall Assessment Banner */}
          <div className="p-4 rounded-xl bg-[#141824] border border-[#232c40] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
              <span className="text-orange-400 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                <span>Overall Assessment for {data.user_profile_name}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.overall_assessment}
            </p>
          </div>

          {/* Power Headroom Analysis Banner */}
          <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
            data.power_analysis.status === "HEALTHY_HEADROOM"
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
              : data.power_analysis.status === "DEFICIT_WARNING"
              ? "bg-rose-950/25 border-rose-500/40 text-rose-200"
              : "bg-amber-950/20 border-amber-500/30 text-amber-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <BatteryCharging className="w-4 h-4" />
                <span>Power Supply (PSU) & 30% Headroom Analysis</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Est. Peak Load: </span>
                  <span className="font-mono font-bold text-white">{data.power_analysis.estimated_user_power_w}W</span>
                </div>
                <div>
                  <span className="text-slate-400">Your PSU: </span>
                  <span className="font-mono font-bold text-white">
                    {data.power_analysis.user_psu_w ? `${data.power_analysis.user_psu_w}W` : "Unspecified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Recommended PSU: </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {data.power_analysis.recommended_psu_with_headroom_w}W
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              {data.power_analysis.guidance}
            </p>
          </div>

          {/* Comparison Matrix Table */}
          <div className="rounded-xl border border-[#232b3e] overflow-x-auto bg-[#11141e]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#232b3e] bg-[#161a27] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="p-3 w-32">Component</th>
                  <th className="p-3 font-bold text-white bg-white/5">Your Current PC</th>
                  {(comparisonTarget === "ALL" || comparisonTarget === "LOW") && (
                    <th className="p-3">Entry-Level Build (LOW)</th>
                  )}
                  {(comparisonTarget === "ALL" || comparisonTarget === "MEDIUM") && (
                    <th className="p-3">Mid-Range Build (MEDIUM)</th>
                  )}
                  {(comparisonTarget === "ALL" || comparisonTarget === "TOP") && (
                    <th className="p-3">High-End Build (TOP)</th>
                  )}
                  <th className="p-3 w-40">Capability Standing</th>
                  <th className="p-3 w-28">Upgrade Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.comparison_table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#151926] transition-colors">
                    <td className="p-3 font-bold text-slate-300">
                      <div>{row.component}</div>
                      {viewMode === "DETAILED" && row.technical_details && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {Object.entries(row.technical_details).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-white bg-white/[0.02]">
                      {row.user_value}
                    </td>
                    {(comparisonTarget === "ALL" || comparisonTarget === "LOW") && (
                      <td className="p-3 text-slate-400">{row.entry_level_value}</td>
                    )}
                    {(comparisonTarget === "ALL" || comparisonTarget === "MEDIUM") && (
                      <td className="p-3 text-slate-300">{row.mid_range_value}</td>
                    )}
                    {(comparisonTarget === "ALL" || comparisonTarget === "TOP") && (
                      <td className="p-3 text-slate-300">{row.high_end_value}</td>
                    )}
                    <td className="p-3">{getCapabilityBadge(row.capability_label, row.compatibility_status)}</td>
                    <td className="p-3">{getPriorityBadge(row.upgrade_priority)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Guidance Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {data.comparison_table
              .filter((r) => r.upgrade_priority === "CRITICAL" || r.upgrade_priority === "HIGH" || r.upgrade_priority === "MEDIUM")
              .map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#141825] border border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.component} Upgrade Guidance</span>
                    {getPriorityBadge(item.upgrade_priority)}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
