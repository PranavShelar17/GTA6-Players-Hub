"use client";

import React from "react";
import { ShieldCheck, Cpu, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PCHardwareProfile } from "@/lib/pcCompatibilityApi";

interface HardwareContextConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: PCHardwareProfile | null;
}

export function HardwareContextConsentModal({
  isOpen,
  onClose,
  onConfirm,
  profile,
}: HardwareContextConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121624] border border-[#232a3e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Hardware Profile</h3>
              <p className="text-xs text-slate-400">Privacy & Diagnostic Transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Attaching your saved PC Hardware Profile allows the AI Diagnostic Assistant to provide tailor-made advice (e.g. VRAM constraints, driver version links, DirectX 12 capabilities, and thermal profiles).
        </p>

        {profile ? (
          <div className="p-3.5 rounded-xl bg-[#0c0e17] border border-[#1d2334] text-xs space-y-2 mb-4">
            <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              <span>Information to be shared:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-200">
              <div>
                <span className="text-slate-400">CPU:</span> {profile.cpu_manufacturer} {profile.cpu_model}
              </div>
              <div>
                <span className="text-slate-400">GPU:</span> {profile.gpu_manufacturer} {profile.gpu_model} ({profile.gpu_vram_gb}GB)
              </div>
              <div>
                <span className="text-slate-400">RAM:</span> {profile.ram_gb}GB {profile.ram_type || ""}
              </div>
              <div>
                <span className="text-slate-400">Storage:</span> {profile.storage_type} ({profile.storage_free_gb}GB free)
              </div>
              <div>
                <span className="text-slate-400">OS:</span> {profile.operating_system} ({profile.os_architecture})
              </div>
              <div>
                <span className="text-slate-400">Display:</span> {profile.display_resolution}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#0c0e17] border border-amber-900/30 text-xs text-amber-300/90 mb-4">
            No saved primary PC profile found. You can configure your hardware in the{" "}
            <a href="/pc-compatibility" className="underline font-bold text-amber-200 hover:text-white">
              PC Compatibility Checker
            </a>{" "}
            to enable automated hardware diagnostics.
          </div>
        )}

        <div className="space-y-1.5 text-[11px] text-slate-400 mb-6 bg-[#161a29] p-3 rounded-lg border border-[#202738]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Strict Privacy Guarantee:</span>
          </div>
          <p>
            No personal identifying information (PII), MAC addresses, IP addresses, serial numbers, or file directories are ever transmitted or stored.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
          >
            Authorize & Attach Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
