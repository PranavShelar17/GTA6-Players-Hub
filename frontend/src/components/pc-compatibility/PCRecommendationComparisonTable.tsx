"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Info, 
  BatteryCharging, 
  Gauge, 
  Layers 
} from "lucide-react";
import { 
  UserVsRecommendationComparisonResponse, 
  PCHardwareProfileCreate, 
  compareUserPCWithRecommendations 
} from "@/lib/pcCompatibilityApi";

interface PCRecommendationComparisonTableProps {
  currentSpecs?: PCHardwareProfileCreate;
  activeProfileId?: string;
  token?: string;
}

export function PCRecommendationComparisonTable({
  currentSpecs,
  activeProfileId,
  token,
}: PCRecommendationComparisonTableProps) {
  const [data, setData] = useState<UserVsRecommendationComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      })
      .catch((err) => {
        console.error("Failed to load user vs recommendation comparison:", err);
        setErrorMsg(err.message || "Failed to compare your hardware with recommendations.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentSpecs, activeProfileId, token]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EXCEEDS_ALL":
        return (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-950/40 border border-purple-500/40 px-2 py-0.5 rounded">
            Exceeds All
          </span>
        );
      case "MEETS_HIGH":
        return (
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/40 px-2 py-0.5 rounded">
            High-End Level
          </span>
        );
      case "MEETS_MID":
        return (
          <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 border border-orange-500/40 px-2 py-0.5 rounded">
            Mid-Range Level
          </span>
        );
      case "MEETS_ENTRY":
        return (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded">
            Entry-Level
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/40 px-2 py-0.5 rounded">
            Below Entry
          </span>
        );
    }
  };

  return (
    <section id="user-comparison-table" className="space-y-5 pt-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Intelligent Hardware Benchmarking</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Your PC vs. Recommended Gaming Tiers
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Side-by-side component breakdown analyzing where your current hardware sits relative to Entry-Level, Mid-Range, and High-End reference builds.
        </p>
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
                  <th className="p-3 w-28">Component</th>
                  <th className="p-3 font-bold text-white bg-white/5">Your Current PC</th>
                  <th className="p-3">Entry-Level Build</th>
                  <th className="p-3">Mid-Range Build</th>
                  <th className="p-3">High-End Build</th>
                  <th className="p-3 w-28">Standing</th>
                  <th className="p-3 w-24">Upgrade Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.comparison_table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#151926] transition-colors">
                    <td className="p-3 font-bold text-slate-300">{row.component}</td>
                    <td className="p-3 font-semibold text-white bg-white/[0.02]">
                      {row.user_value}
                    </td>
                    <td className="p-3 text-slate-400">{row.entry_level_value}</td>
                    <td className="p-3 text-slate-300">{row.mid_range_value}</td>
                    <td className="p-3 text-slate-300">{row.high_end_value}</td>
                    <td className="p-3">{getStatusBadge(row.compatibility_status)}</td>
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
                    <span className="font-bold text-white">{item.component} Upgrade Advice</span>
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
