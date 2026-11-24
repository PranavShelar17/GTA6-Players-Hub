"use client";

import React from "react";
import { 
  Cpu, 
  HardDrive, 
  Star, 
  Trash2, 
  Upload, 
  X, 
  Layers,
  Zap,
  Sliders,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PCHardwareProfile } from "@/lib/pcCompatibilityApi";

interface SavedPCProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PCHardwareProfile[];
  onSelectProfile: (profile: PCHardwareProfile) => void;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onSetPrimaryProfile?: (profileId: string) => Promise<void>;
  onOpenCompare?: () => void;
  isLoading: boolean;
}

export function SavedPCProfilesModal({
  isOpen,
  onClose,
  profiles,
  onSelectProfile,
  onDeleteProfile,
  onSetPrimaryProfile,
  onOpenCompare,
  isLoading,
}: SavedPCProfilesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#121622] border border-[#232b3e] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-bold text-white">Saved PC Hardware Configurations</h3>
              <p className="text-xs text-slate-400">
                Manage your previous and current gaming rigs ({profiles.length} saved).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profiles.length >= 2 && onOpenCompare && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenCompare();
                }}
                className="text-xs gap-1.5 text-sky-300 hover:text-white"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Compare Rigs</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {profiles.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No saved PC hardware profiles found.</p>
              <p className="text-xs text-slate-500">
                Check &quot;Save specifications to my Player Hardware Profile&quot; in the form to store your rig.
              </p>
            </div>
          ) : (
            profiles.map((prof) => (
              <div
                key={prof.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  prof.is_primary
                    ? "bg-[#182030] border-emerald-500/40"
                    : "bg-[#181d2c] border-[#263044] hover:border-[#384664]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{prof.profile_name}</h4>
                    {prof.is_primary && (
                      <Badge variant="verified" className="text-[10px]">
                        <Star className="w-3 h-3 fill-emerald-400" />
                        <span>Current PC</span>
                      </Badge>
                    )}
                    {prof.is_incomplete && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Incomplete Specs</span>
                      </span>
                    )}
                    {prof.form_factor && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {prof.form_factor}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Saved: {new Date(prof.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{prof.cpu_manufacturer} {prof.cpu_model}</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{prof.gpu_manufacturer} {prof.gpu_model} ({prof.gpu_vram_gb}GB)</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>
                      {prof.ram_gb}GB {prof.ram_type || "RAM"} {prof.ram_speed_mhz ? `@ ${prof.ram_speed_mhz}MHz` : ""}
                    </span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{prof.storage_type.replace('_', ' ')} ({prof.storage_free_gb}GB Free)</span>
                  </div>
                  {prof.motherboard_model && (
                    <div className="text-slate-400 text-[11px] col-span-1 sm:col-span-2">
                      <span className="text-slate-500">Motherboard:</span> {prof.motherboard_model}
                    </div>
                  )}
                  {prof.psu_wattage && (
                    <div className="text-slate-400 text-[11px] col-span-1 sm:col-span-2">
                      <span className="text-slate-500">Power Supply:</span> {prof.psu_wattage}W {prof.psu_model ? `(${prof.psu_model})` : ""}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    {!prof.is_primary && onSetPrimaryProfile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => onSetPrimaryProfile(prof.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Set as Current PC</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => onDeleteProfile(prof.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => {
                        onSelectProfile(prof);
                        onClose();
                      }}
                      className="text-xs gap-1.5 font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Load Specifications</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#141824] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Saved rigs are private to your player account.
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
