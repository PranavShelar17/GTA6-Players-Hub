"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  PCHardwareProfile, 
  PCProfileComparisonResponse, 
  compareSavedProfiles, 
  setPrimaryHardwareProfile 
} from "@/lib/pcCompatibilityApi";

interface PCProfileCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PCHardwareProfile[];
  token?: string;
  onProfileUpdated?: () => void;
}

export function PCProfileCompareModal({
  isOpen,
  onClose,
  profiles,
  token,
  onProfileUpdated,
}: PCProfileCompareModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<PCProfileComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize selectedIds when profiles load
  useEffect(() => {
    if (profiles.length >= 2) {
      // Pick primary and most recent other profile
      const primary = profiles.find((p) => p.is_primary);
      const others = profiles.filter((p) => !p.is_primary);
      const initial = primary 
        ? [primary.id, others[0]?.id || profiles[1].id] 
        : [profiles[0].id, profiles[1].id];
      setSelectedIds(initial.filter(Boolean));
    } else if (profiles.length === 1) {
      setSelectedIds([profiles[0].id]);
    }
  }, [profiles]);

  // Execute comparison when selected IDs change and count >= 2
  useEffect(() => {
    if (selectedIds.length >= 2 && token) {
      setIsLoading(true);
      setErrorMsg(null);
      compareSavedProfiles(selectedIds, token)
        .then((res) => {
          setComparison(res);
        })
        .catch((err) => {
          console.error("Comparison error:", err);
          setErrorMsg(err.message || "Failed to compare selected profiles.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setComparison(null);
    }
  }, [selectedIds, token]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSetPrimary = async (profileId: string) => {
    if (!token) return;
    try {
      await setPrimaryHardwareProfile(profileId, token);
      setSuccessMsg("Updated primary active gaming rig!");
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to set primary profile.");
    }
  };

  const getDeltaBadge = (deltaType: string) => {
    switch (deltaType) {
      case "UPGRADE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Upgrade</span>
          </span>
        );
      case "DOWNGRADE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <span>Older/Lower</span>
          </span>
        );
      case "SIDEGRADE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <ArrowRight className="w-3 h-3 text-sky-400" />
            <span>Sidegrade</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            <Minus className="w-3 h-3" />
            <span>Unchanged</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#121622] border border-[#232b3e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white">Compare My Saved PC Rigs</h3>
              <p className="text-xs text-slate-400">
                Track hardware evolution, component upgrades, and specification differences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Selector Chips */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Select 2 to 5 saved configurations to compare:</span>
              <span className="text-slate-400 text-[11px] font-normal">
                {selectedIds.length} of {profiles.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? "bg-sky-500/20 border-sky-500/60 text-sky-200 shadow-sm"
                        : "bg-[#181d2a] border-[#252c3c] text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{p.profile_name}</span>
                    {p.is_primary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                        Current PC
                      </span>
                    )}
                    {p.is_incomplete && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">
                        Incomplete
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedIds.length < 2 ? (
            <div className="text-center py-10 bg-[#151926] rounded-xl border border-white/5 space-y-2">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-medium text-slate-300">
                Please select at least two saved rigs above to compare component specifications.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Analyzing hardware differences across configurations...</p>
            </div>
          ) : comparison ? (
            <div className="space-y-5">
              {/* Upgrade Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-[#161f30] to-slate-900 border border-sky-500/30 space-y-1.5">
                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Hardware Upgrade Trajectory</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {comparison.upgrade_summary}
                </p>
              </div>

              {/* Profiles Header & Primary Rig Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {comparison.profiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-3 rounded-xl bg-[#161b28] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{prof.profile_name}</span>
                        {prof.is_primary && (
                          <Badge variant="verified" className="text-[10px]">
                            <Star className="w-3 h-3 fill-emerald-400" />
                            <span>Current PC</span>
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Saved: {new Date(prof.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {!prof.is_primary && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPrimary(prof.id)}
                        className="text-[11px] gap-1 h-7 text-emerald-300 hover:text-white"
                      >
                        <Star className="w-3 h-3" />
                        <span>Set Current</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Component Differences Table */}
              <div className="rounded-xl border border-[#232b3e] overflow-hidden bg-[#11141e]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#232b3e] bg-[#161a27] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-32">Component</th>
                      <th className="p-3">{comparison.profiles[0]?.profile_name || "Rig A"}</th>
                      <th className="p-3">{comparison.profiles[1]?.profile_name || "Rig B"}</th>
                      <th className="p-3 w-28">Delta</th>
                      <th className="p-3 hidden md:table-cell">Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comparison.differences.map((diff, idx) => (
                      <tr key={idx} className="hover:bg-[#151926] transition-colors">
                        <td className="p-3 font-bold text-slate-300">{diff.component}</td>
                        <td className="p-3 text-slate-200">{diff.profile_1_value}</td>
                        <td className="p-3 text-slate-200">{diff.profile_2_value}</td>
                        <td className="p-3">{getDeltaBadge(diff.delta_type)}</td>
                        <td className="p-3 text-[11px] text-slate-400 hidden md:table-cell leading-relaxed">
                          {diff.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#141824] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
