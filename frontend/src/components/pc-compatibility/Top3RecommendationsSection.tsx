"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Cpu, 
  Zap, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  HardDrive, 
  Info, 
  ChevronDown, 
  Layers, 
  ShieldCheck, 
  Tag, 
  Store, 
  Box 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { 
  GamingPCRecommendationsResponse, 
  RecommendedPCBuild, 
  fetchGamingPCRecommendations 
} from "@/lib/pcCompatibilityApi";

interface Top3RecommendationsSectionProps {
  onCompareWithBuild?: (tier: string) => void;
}

export function Top3RecommendationsSection({
  onCompareWithBuild,
}: Top3RecommendationsSectionProps) {
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  const [customBudgetInr, setCustomBudgetInr] = useState<number | undefined>(undefined);
  const [budgetInputText, setBudgetInputText] = useState<string>("");
  const [intendedUse, setIntendedUse] = useState<string>("GTA_6_PREPARATION");
  const [data, setData] = useState<GamingPCRecommendationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [activeTabByTier, setActiveTabByTier] = useState<Record<string, "SPECS" | "PRICE" | "COMPATIBILITY">>({});

  const loadRecommendations = useCallback((budgetInr?: number) => {
    setIsLoading(true);
    fetchGamingPCRecommendations(undefined, intendedUse, currency, budgetInr)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load recommendations:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [intendedUse, currency]);

  useEffect(() => {
    loadRecommendations(customBudgetInr);
  }, [loadRecommendations, customBudgetInr]);

  const handleApplyBudgetInr = (amount?: number) => {
    setCustomBudgetInr(amount);
    if (amount) {
      setBudgetInputText(amount.toString());
      setCurrency("INR");
    } else {
      setBudgetInputText("");
    }
  };

  const formatPrice = (usd?: number | null, inr?: number | null) => {
    if (currency === "INR" && inr) {
      return `₹${inr.toLocaleString("en-IN")}`;
    }
    if (usd) {
      return `$${usd.toLocaleString("en-US")}`;
    }
    return "Market Estimate";
  };

  const toggleTierTab = (tier: string, tab: "SPECS" | "PRICE" | "COMPATIBILITY") => {
    setActiveTabByTier((prev) => ({
      ...prev,
      [tier]: prev[tier] === tab ? "SPECS" : tab,
    }));
  };

  return (
    <section id="gaming-pc-recommendations" className="space-y-6 pt-4 border-t border-[#1e2330]">
      {/* Header and Disclaimer */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Smart PC Architecture & Planning</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Top 3 Recommended Gaming PC Builds
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Objective, curated gaming rigs designed with strict component compatibility, 30% PSU safety headroom, and Indian retail pricing inclusive of 18% GST.
            </p>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-[#131724] p-1 rounded-xl border border-[#232b3c]">
            <button
              onClick={() => setCurrency("INR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currency === "INR"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currency === "USD"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Mandatory GTA 6 Planning Notice */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">GTA 6 Forward-Looking Planning Notice: </span>
            <span>
              Official GTA 6 PC system requirements have not yet been published or confirmed by Rockstar Games. These configurations represent verified hardware planning benchmarks for modern AAA titles and are not guaranteed GTA 6 requirements.
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Indian Rupee (INR) Budget Planner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#121622] via-[#141928] to-[#121622] border border-[#222b40] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Tag className="w-4 h-4 text-orange-400" />
            <span>Budget-Based Recommendation Engine in INR (₹)</span>
          </div>
          {customBudgetInr && (
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
              Active Target: ₹{customBudgetInr.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Presets and Custom Input */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {[
            { label: "₹65,000 (Entry AAA)", amount: 65000 },
            { label: "₹80,000 (1080p Ultra)", amount: 80000 },
            { label: "₹1,00,000 (1440p Target)", amount: 100000 },
            { label: "₹1,50,000 (1440p High-FPS)", amount: 150000 },
            { label: "₹2,00,000 (4K Enthusiast)", amount: 200000 },
          ].map((preset) => (
            <button
              key={preset.amount}
              type="button"
              onClick={() => handleApplyBudgetInr(preset.amount)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                customBudgetInr === preset.amount
                  ? "bg-orange-500 text-white border-orange-400 shadow-sm"
                  : "bg-[#161a29] text-slate-300 border-[#262f44] hover:border-slate-400"
              }`}
            >
              {preset.label}
            </button>
          ))}

          {customBudgetInr && (
            <button
              type="button"
              onClick={() => handleApplyBudgetInr(undefined)}
              className="text-xs px-2.5 py-1 rounded-lg text-slate-400 hover:text-white underline ml-auto"
            >
              Reset to Reference Builds
            </button>
          )}
        </div>

        {/* Custom INR Input and Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5 items-center">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={40000}
              max={500000}
              step={5000}
              value={budgetInputText}
              onChange={(e) => setBudgetInputText(e.target.value)}
              placeholder="Custom budget e.g. 95000"
              className="text-xs bg-[#161a29] border border-[#273046] rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:border-orange-500"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const val = parseFloat(budgetInputText);
                if (!isNaN(val) && val > 0) {
                  handleApplyBudgetInr(val);
                }
              }}
              className="text-xs font-bold border-orange-500/40 text-orange-300 hover:bg-orange-500/10 shrink-0"
            >
              Apply INR
            </Button>
          </div>

          <div>
            <select
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              className="w-full text-xs rounded-lg bg-[#161a27] border border-[#262f42] px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="GTA_6_PREPARATION">GTA 6 Forward-Looking Preparation</option>
              <option value="GENERAL_AAA">General AAA High-Fidelity Gaming</option>
              <option value="COMPETITIVE">Competitive Esports (High FPS / 240Hz)</option>
              <option value="STREAMING_RECORDING">Gaming + Simultaneous Streaming</option>
              <option value="CONTENT_CREATION">Gaming + Video Editing / 3D Work</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-end">
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span>Retailers: PrimeABGB, MDComputers, Vedant, Amazon IN</span>
          </div>
        </div>
      </div>

      {/* Personalized Match Banner */}
      {data?.personalized_match && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-orange-950/40 via-[#1a1c27] to-slate-900 border border-orange-500/40 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Recommended Match for Your Profile</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {data.personalized_match.match_headline}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {data.personalized_match.rationale}
          </p>
          {data.personalized_match.priority_upgrades_from_current.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold">Priority Focus:</span>
              {data.personalized_match.priority_upgrades_from_current.map((focus, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30"
                >
                  {focus}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3 Tier Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading verified gaming PC configurations and retail prices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.recommendations.map((build: RecommendedPCBuild) => {
            const isExpanded = expandedTier === build.tier;
            const activeTab = activeTabByTier[build.tier] || "SPECS";
            const isHighEnd = build.tier === "HIGH_END";
            const isMidRange = build.tier === "MID_RANGE";

            return (
              <div
                key={build.tier}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isHighEnd
                    ? "bg-[#131726] border-purple-500/40 hover:border-purple-500/60 shadow-lg shadow-purple-950/20"
                    : isMidRange
                    ? "bg-[#131826] border-orange-500/40 hover:border-orange-500/60 shadow-lg shadow-orange-950/20"
                    : "bg-[#121622] border-[#222a3d] hover:border-[#34405c]"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider ${
                        isHighEnd
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : isMidRange
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {build.tier_badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {build.target_resolution}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white">{build.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {build.purpose}
                    </p>
                  </div>

                  {/* Price Banner */}
                  <div className="pt-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {formatPrice(build.price_usd, build.price_inr)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {build.gst_status || "GST Included (18% Retail Standard)"}
                      </div>
                    </div>
                    {/* Compatibility Badge */}
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Fully Compatible</span>
                    </span>
                  </div>

                  {/* Inner Tab Buttons (Specs / Price Breakdown / Compatibility) */}
                  <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => toggleTierTab(build.tier, "SPECS")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        activeTab === "SPECS"
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Specs
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTierTab(build.tier, "PRICE")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        activeTab === "PRICE"
                          ? "bg-white/10 text-orange-300"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Price Breakdown
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTierTab(build.tier, "COMPATIBILITY")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        activeTab === "COMPATIBILITY"
                          ? "bg-white/10 text-emerald-300"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Checks (6)
                    </button>
                  </div>
                </div>

                {/* Card Content based on Active Tab */}
                <div className="p-5 space-y-3 flex-1 text-xs">
                  {activeTab === "PRICE" && build.component_price_breakdown ? (
                    /* Price Breakdown Tab */
                    <div className="space-y-2 animate-fadeIn">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center justify-between">
                        <span>Component Retail Pricing</span>
                        <span className="text-[10px] text-slate-500">18% GST Incl.</span>
                      </div>
                      <div className="divide-y divide-white/5 rounded-lg bg-[#0e121a] p-2 border border-white/5">
                        {Object.entries(build.component_price_breakdown).map(([comp, prc]) => (
                          <div key={comp} className="flex justify-between py-1 text-[11px]">
                            <span className="text-slate-400 capitalize">{comp}</span>
                            <span className="font-mono font-bold text-white">₹{prc.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1.5 font-bold text-xs text-orange-400 border-t border-white/10">
                          <span>Total Build</span>
                          <span className="font-mono">₹{build.price_inr?.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1">
                        Sources: PrimeABGB, MDComputers, Vedant Computers, Amazon IN.
                      </div>
                    </div>
                  ) : activeTab === "COMPATIBILITY" && build.compatibility_report ? (
                    /* Compatibility Validation Report Tab */
                    <div className="space-y-2 animate-fadeIn">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>6 Architectural Safety Checks Passed</span>
                      </div>
                      <div className="space-y-1.5">
                        {build.compatibility_report.checks.map((chk, i) => (
                          <div key={i} className="p-2 rounded bg-[#0e121a] border border-white/5 text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between font-bold text-slate-200">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>{chk.component_scope}</span>
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                {chk.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">{chk.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Default Specs Tab */
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-slate-300">
                        <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">Processor (CPU)</div>
                          <div className="font-semibold text-white">{build.cpu}</div>
                          <div className="text-[10px] text-slate-400">Socket: {build.motherboard_socket || "Standard"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">Graphics Card (GPU)</div>
                          <div className="font-semibold text-white">{build.gpu} ({build.vram})</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">RAM & Motherboard</div>
                          <div className="text-slate-200">{build.ram} ({build.ram_generation || "DDR4/DDR5"})</div>
                          <div className="text-[11px] text-slate-400">{build.motherboard} ({build.motherboard_chipset || "Chipset"})</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <HardDrive className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">Storage & Power</div>
                          <div className="text-slate-200">{build.storage}</div>
                          <div className="text-[11px] text-slate-400">{build.psu} ({build.psu_efficiency || "80+ certified"})</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-slate-300">
                        <Box className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500">Cabinet & Cooling</div>
                          <div className="text-slate-200">{build.cabinet || "High-Airflow Case"}</div>
                          <div className="text-[11px] text-slate-400">{build.cooling} (Clearance: {build.cabinet_clearance_gpu_mm || 360}mm)</div>
                        </div>
                      </div>

                      {/* Power Draw & Headroom Pill */}
                      <div className="p-2.5 rounded-lg bg-[#0e121a] border border-white/5 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Estimated Power Draw:</span>
                          <span className="font-mono font-bold text-slate-200">~{build.estimated_system_power_w}W</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">PSU w/ 30% Headroom:</span>
                          <span className="font-mono font-bold text-emerald-400">{build.recommended_psu_wattage}W</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expandable Strengths and Limitations */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-white/5 space-y-3 animate-fadeIn text-xs">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          Key Strengths
                        </div>
                        <ul className="space-y-1">
                          {build.strengths.map((str, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Planning Limitations
                        </div>
                        <ul className="space-y-1">
                          {build.limitations.map((lim, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>{lim}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2 rounded bg-black/30 text-[11px] text-slate-400">
                        <span className="text-slate-300 font-semibold">Upgrade Potential: </span>
                        {build.upgrade_potential}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-white/5 bg-[#10141f] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedTier(isExpanded ? null : build.tier)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <span>{isExpanded ? "Less Details" : "More Specs"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onCompareWithBuild) onCompareWithBuild(build.tier);
                      const tableElem = document.getElementById("user-comparison-table");
                      if (tableElem) tableElem.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs font-bold gap-1"
                  >
                    <span>Compare to My PC</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
