"use client";

import React from "react";
import { 
  Wrench, 
  ShieldCheck, 
  CheckCircle2
} from "lucide-react";
import { UpgradeAdvisorPlan } from "@/lib/pcCompatibilityApi";

interface UpgradeAdvisorSectionProps {
  plan?: UpgradeAdvisorPlan | null;
  currency?: "USD" | "INR";
}

export function UpgradeAdvisorSection({
  plan,
  currency = "INR",
}: UpgradeAdvisorSectionProps) {
  if (!plan) return null;

  const getStrategyBadge = (strategy: string) => {
    switch (strategy) {
      case "ONE_OR_TWO_COMPONENTS":
        return {
          title: "Targeted 1-2 Component Upgrade",
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          desc: "Your core system platform is sound. Upgrading 1 or 2 targeted components will unlock major performance gains.",
        };
      case "PLATFORM_UPGRADE":
        return {
          title: "Platform Upgrade (CPU + Motherboard + RAM)",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          desc: "Your processor architecture or memory generation is bottlenecked. Upgrading the CPU, motherboard, and RAM together is recommended.",
        };
      case "COMPLETE_NEW_BUILD":
        return {
          title: "Complete New Gaming PC Build",
          color: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          desc: "Multiple core components (CPU, GPU, RAM, PSU, Storage) are severely dated. Building or purchasing a fresh balanced rig provides far better value.",
        };
      case "KEEP_EXISTING":
      default:
        return {
          title: "Keep Existing PC Configuration",
          color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          desc: "Your hardware meets or exceeds balanced 1440p/4K gaming targets. No immediate upgrades are required.",
        };
    }
  };

  const badgeInfo = getStrategyBadge(plan.recommended_strategy);

  const formatCost = (inr: number, usd: number) => {
    if (currency === "INR") {
      return `₹${inr.toLocaleString("en-IN")}`;
    }
    return `$${usd.toLocaleString("en-US")}`;
  };

  return (
    <section id="upgrade-advisor-section" className="space-y-4 pt-4 border-t border-[#1e2330]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Intelligent Upgrade Advisor</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Personalized Hardware Upgrade Path
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Objective recommendation engine evaluating whether you should upgrade 1-2 components, a core platform, or build fresh.
          </p>
        </div>

        {/* Estimated Cost Pill */}
        <div className="p-3 rounded-xl bg-[#141824] border border-[#232b3e] text-right self-start sm:self-auto">
          <div className="text-[10px] uppercase font-bold text-slate-400">Est. Total Upgrade Cost</div>
          <div className="text-lg font-black text-orange-400">
            {formatCost(plan.estimated_total_upgrade_inr, plan.estimated_total_upgrade_usd)}
          </div>
          <div className="text-[10px] text-slate-500">GST Included / Indian Retail</div>
        </div>
      </div>

      {/* Main Strategy Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#141824] via-[#161a29] to-[#121622] border border-[#232c42] space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${badgeInfo.color}`}>
            {badgeInfo.title}
          </span>
          <span className="text-xs text-slate-400">Target Tier: <strong className="text-white">{plan.target_budget_tier}</strong></span>
        </div>

        <div>
          <h4 className="text-base font-bold text-white">{plan.strategy_headline}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{plan.strategy_explanation}</p>
        </div>

        {/* Safety Prerequisite Checklist */}
        {plan.prerequisite_checks && plan.prerequisite_checks.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compatibility & Safety Prerequisites Verified Before Upgrading:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {plan.prerequisite_checks.map((check, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-[#0e121a] border border-white/5 flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px]">{check}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Upgrade Components Table */}
      {plan.suggested_upgrades && plan.suggested_upgrades.length > 0 && (
        <div className="rounded-xl border border-[#232b3e] overflow-x-auto bg-[#11141e]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#232b3e] bg-[#161a27] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-36">Current Hardware</th>
                <th className="p-3 w-48 text-orange-400">Suggested Upgrade</th>
                <th className="p-3">Why It Helps</th>
                <th className="p-3 w-48">Prerequisites Checked</th>
                <th className="p-3 w-28 text-right">Est. Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plan.suggested_upgrades.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#151926] transition-colors">
                  <td className="p-3 font-semibold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{item.existing_component}</span>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{item.suggested_replacement}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300 text-[11px] leading-relaxed">
                    {item.why_it_helps}
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {item.compatibility_prerequisites.map((p, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </td>
                  <td className="p-3 font-mono font-bold text-right text-emerald-400">
                    ₹{item.estimated_cost_inr.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
