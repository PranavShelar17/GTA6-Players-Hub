"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Cpu, 
  History, 
  Layers, 
  SlidersHorizontal, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { 
  RequirementsStatusResponse, 
  GameSystemRequirement, 
  PCHardwareProfile, 
  PCHardwareProfileCreate,
  CompatibilityCheckResponse,
  CompatibilityCheckHistoryItem,
  fetchHardwareProfiles,
  deleteHardwareProfile,
  runCompatibilityCheck,
  fetchCompatibilityHistory,
  fetchCompatibilityCheckDetail
} from "@/lib/pcCompatibilityApi";
import { RequirementsStatusCard } from "./RequirementsStatusCard";
import { HardwareInputForm } from "./HardwareInputForm";
import { HardwareSummaryCard } from "./HardwareSummaryCard";
import { CompatibilityResultSection } from "./CompatibilityResultSection";
import { HardwareBottleneckAnalysis } from "./HardwareBottleneckAnalysis";
import { UpgradeGuidanceSection } from "./UpgradeGuidanceSection";
import { SavedPCProfilesModal } from "./SavedPCProfilesModal";
import { CompatibilityHistoryModal } from "./CompatibilityHistoryModal";

interface PCCompatibilityClientProps {
  initialStatus: RequirementsStatusResponse;
  initialRequirements?: GameSystemRequirement[];
}

export function PCCompatibilityClient({
  initialStatus,
}: PCCompatibilityClientProps) {
  const { session, isAuthenticated } = useAuth();
  const token = session?.access_token;

  // State
  const [statusData] = useState<RequirementsStatusResponse>(initialStatus);
  const [profiles, setProfiles] = useState<PCHardwareProfile[]>([]);
  const [history, setHistory] = useState<CompatibilityCheckHistoryItem[]>([]);
  const [activeResult, setActiveResult] = useState<CompatibilityCheckResponse | null>(null);
  const [currentSpecs, setCurrentSpecs] = useState<PCHardwareProfileCreate | undefined>(undefined);

  // Modals & UI
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  const loadUserProfiles = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchHardwareProfiles(token);
      setProfiles(data);
      // If user has a primary profile and no active specs set yet, load it
      const primary = data.find((p) => p.is_primary) || data[0];
      if (primary && !currentSpecs) {
        setCurrentSpecs({
          profile_name: primary.profile_name,
          cpu_manufacturer: primary.cpu_manufacturer,
          cpu_model: primary.cpu_model,
          cpu_cores: primary.cpu_cores,
          cpu_threads: primary.cpu_threads,
          gpu_manufacturer: primary.gpu_manufacturer,
          gpu_model: primary.gpu_model,
          gpu_vram_gb: primary.gpu_vram_gb,
          gpu_type: primary.gpu_type,
          ram_gb: primary.ram_gb,
          ram_type: primary.ram_type,
          storage_type: primary.storage_type,
          storage_capacity_gb: primary.storage_capacity_gb,
          storage_free_gb: primary.storage_free_gb,
          operating_system: primary.operating_system,
          os_architecture: primary.os_architecture,
          directx_version: primary.directx_version,
          display_resolution: primary.display_resolution,
          refresh_rate: primary.refresh_rate,
          is_primary: primary.is_primary,
        });
      }
    } catch (err) {
      console.error("Error loading user profiles:", err);
    }
  }, [token, currentSpecs]);

  const loadUserHistory = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchCompatibilityHistory(20, 0, token);
      setHistory(data);
    } catch (err) {
      console.error("Error loading user check history:", err);
    }
  }, [token]);

  // Load profiles and history when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserProfiles();
      loadUserHistory();
    }
  }, [isAuthenticated, token, loadUserProfiles, loadUserHistory]);

  // Form submission handler
  const handleCheckCompatibility = async (
    specs: PCHardwareProfileCreate,
    saveProfile: boolean,
    profileName: string
  ) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const response = await runCompatibilityCheck(
        {
          specs,
          save_profile: saveProfile,
          profile_name: profileName,
        },
        token
      );
      setActiveResult(response);
      setCurrentSpecs(specs);

      if (saveProfile && isAuthenticated) {
        await loadUserProfiles();
        setActionMessage({
          type: "success",
          text: `Hardware profile "${profileName}" saved to your player account successfully!`,
        });
      } else {
        setActionMessage({
          type: "info",
          text: "Compatibility and hardware balance diagnostic completed.",
        });
      }

      if (isAuthenticated) {
        await loadUserHistory();
      }

      // Smooth scroll to results
      const resultsElem = document.getElementById("diagnostic-results");
      if (resultsElem) {
        resultsElem.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: unknown) {
      console.error("Compatibility check failed:", err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to complete compatibility check. Please check inputs.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Profile select
  const handleSelectProfile = (profile: PCHardwareProfile) => {
    setCurrentSpecs({
      profile_name: profile.profile_name,
      cpu_manufacturer: profile.cpu_manufacturer,
      cpu_model: profile.cpu_model,
      cpu_cores: profile.cpu_cores,
      cpu_threads: profile.cpu_threads,
      gpu_manufacturer: profile.gpu_manufacturer,
      gpu_model: profile.gpu_model,
      gpu_vram_gb: profile.gpu_vram_gb,
      gpu_type: profile.gpu_type,
      ram_gb: profile.ram_gb,
      ram_type: profile.ram_type,
      storage_type: profile.storage_type,
      storage_capacity_gb: profile.storage_capacity_gb,
      storage_free_gb: profile.storage_free_gb,
      operating_system: profile.operating_system,
      os_architecture: profile.os_architecture,
      directx_version: profile.directx_version,
      display_resolution: profile.display_resolution,
      refresh_rate: profile.refresh_rate,
      is_primary: profile.is_primary,
    });
    setActionMessage({
      type: "info",
      text: `Loaded saved profile "${profile.profile_name}" into the form.`,
    });
  };

  // Profile delete
  const handleDeleteProfile = async (profileId: string) => {
    if (!token) return;
    try {
      await deleteHardwareProfile(profileId, token);
      await loadUserProfiles();
      setActionMessage({
        type: "info",
        text: "Hardware profile deleted.",
      });
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  // Check detail select from history
  const handleSelectHistoryCheck = async (checkId: string) => {
    setIsLoading(true);
    try {
      const detail = await fetchCompatibilityCheckDetail(checkId, token);
      if (detail) {
        setActiveResult(detail);
        setActionMessage({
          type: "info",
          text: `Loaded previous diagnostic report from ${new Date(detail.checked_at).toLocaleDateString()}.`,
        });
        const resultsElem = document.getElementById("diagnostic-results");
        if (resultsElem) {
          resultsElem.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (err) {
      console.error("Failed to load historical check:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1e2330]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1.5">
            <Cpu className="w-4 h-4" />
            <span>Hardware Diagnostics & Compatibility</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            PC Compatibility Checker
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Evaluate your system hardware, verify official specification status, detect component bottlenecks, and review hardware upgrade guidance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAuthenticated && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsProfilesModalOpen(true)}
                className="gap-2 text-xs"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>My Saved Rigs ({profiles.length})</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsHistoryModalOpen(true)}
                className="gap-2 text-xs"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Previous Checks ({history.length})</span>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const formElem = document.getElementById("hardware-input-form");
              if (formElem) formElem.scrollIntoView({ behavior: "smooth" });
            }}
            className="gap-2 text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            <span>Enter Specifications</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border transition-all ${
          actionMessage.type === "success"
            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
            : actionMessage.type === "error"
            ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
            : "bg-sky-950/30 border-sky-500/40 text-sky-200"
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : actionMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-white/60 hover:text-white text-xs font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mandatory Official Requirements Status Banner */}
      <RequirementsStatusCard statusData={statusData} />

      {/* Main Grid: Form + Summary / Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input Form */}
        <div id="hardware-input-form" className="lg:col-span-2 space-y-6">
          <HardwareInputForm
            key={currentSpecs ? currentSpecs.profile_name : "default"}
            initialSpecs={currentSpecs}
            onSubmit={handleCheckCompatibility}
            isLoading={isLoading}
            isAuthenticated={isAuthenticated}
          />

          {/* Results Section (When Check Has Run) */}
          {activeResult && (
            <div id="diagnostic-results" className="space-y-6 pt-2">
              <CompatibilityResultSection result={activeResult} />
              <HardwareBottleneckAnalysis bottleneckNotes={activeResult.bottleneck_notes} />
              <UpgradeGuidanceSection suggestions={activeResult.upgrade_suggestions} />
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Rig Preview & Check History */}
        <div className="space-y-6">
          {activeResult ? (
            <HardwareSummaryCard
              summary={activeResult.hardware_summary}
              checkedAt={activeResult.checked_at}
            />
          ) : (
            <div className="p-5 rounded-xl border border-[#1e2330] bg-[#11141e] text-slate-400 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-orange-400" />
                <span>Rig Diagnostic Standby</span>
              </div>
              <p className="text-xs leading-relaxed">
                Submit your hardware specifications in the evaluator or select a standard preset to see your system balance summary.
              </p>
            </div>
          )}

          {/* Upgrade Guidance Quick Summary */}
          {!activeResult && (
            <UpgradeGuidanceSection suggestions={[]} />
          )}
        </div>
      </div>

      {/* Modals */}
      <SavedPCProfilesModal
        isOpen={isProfilesModalOpen}
        onClose={() => setIsProfilesModalOpen(false)}
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={handleDeleteProfile}
        isLoading={isLoading}
      />

      <CompatibilityHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectCheck={handleSelectHistoryCheck}
        isLoading={isLoading}
      />
    </div>
  );
}
