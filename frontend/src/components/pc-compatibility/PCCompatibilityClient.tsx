"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Cpu, 
  History, 
  Layers, 
  SlidersHorizontal, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Scale
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
  setPrimaryHardwareProfile,
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
import { SmartPCScannerModal } from "./SmartPCScannerModal";
import { PCProfileCompareModal } from "./PCProfileCompareModal";
import { Top3RecommendationsSection } from "./Top3RecommendationsSection";
import { PCRecommendationComparisonTable } from "./PCRecommendationComparisonTable";

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
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>(undefined);

  // Modals
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // UI status
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
        setActiveProfileId(primary.id);
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
          ram_speed_mhz: primary.ram_speed_mhz,
          motherboard_model: primary.motherboard_model,
          storage_type: primary.storage_type,
          storage_capacity_gb: primary.storage_capacity_gb,
          storage_free_gb: primary.storage_free_gb,
          psu_wattage: primary.psu_wattage,
          psu_model: primary.psu_model,
          cooling_solution: primary.cooling_solution,
          form_factor: primary.form_factor,
          is_incomplete: primary.is_incomplete,
          notes: primary.notes,
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
    setActiveProfileId(profile.id);
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
      ram_speed_mhz: profile.ram_speed_mhz,
      motherboard_model: profile.motherboard_model,
      storage_type: profile.storage_type,
      storage_capacity_gb: profile.storage_capacity_gb,
      storage_free_gb: profile.storage_free_gb,
      psu_wattage: profile.psu_wattage,
      psu_model: profile.psu_model,
      cooling_solution: profile.cooling_solution,
      form_factor: profile.form_factor,
      is_incomplete: profile.is_incomplete,
      notes: profile.notes,
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
        text: "Hardware profile deleted from your player account.",
      });
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  // Set primary profile
  const handleSetPrimaryProfile = async (profileId: string) => {
    if (!token) return;
    try {
      await setPrimaryHardwareProfile(profileId, token);
      await loadUserProfiles();
      setActionMessage({
        type: "success",
        text: "Updated active primary gaming PC!",
      });
    } catch (err) {
      console.error("Failed to set primary profile:", err);
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

  // Apply auto-detected hardware specs
  const handleApplyDetectedSpecs = (detected: Partial<PCHardwareProfileCreate>) => {
    setCurrentSpecs((prev) => ({
      profile_name: detected.profile_name || prev?.profile_name || "Auto-Detected Rig",
      cpu_manufacturer: detected.cpu_manufacturer || prev?.cpu_manufacturer || "AMD",
      cpu_model: detected.cpu_model || prev?.cpu_model || "Ryzen 7 7800X3D",
      cpu_cores: detected.cpu_cores || prev?.cpu_cores || 8,
      cpu_threads: detected.cpu_threads || prev?.cpu_threads || 16,
      gpu_manufacturer: detected.gpu_manufacturer || prev?.gpu_manufacturer || "NVIDIA",
      gpu_model: detected.gpu_model || prev?.gpu_model || "GeForce RTX 4070 Super",
      gpu_vram_gb: detected.gpu_vram_gb || prev?.gpu_vram_gb || 12.0,
      gpu_type: detected.gpu_type || prev?.gpu_type || "DEDICATED",
      ram_gb: detected.ram_gb || prev?.ram_gb || 32,
      ram_type: detected.ram_type || prev?.ram_type || "DDR5",
      ram_speed_mhz: detected.ram_speed_mhz || prev?.ram_speed_mhz || 6000,
      motherboard_model: detected.motherboard_model || prev?.motherboard_model || null,
      storage_type: detected.storage_type || prev?.storage_type || "NVME_SSD",
      storage_capacity_gb: detected.storage_capacity_gb || prev?.storage_capacity_gb || 1000,
      storage_free_gb: detected.storage_free_gb || prev?.storage_free_gb || 300,
      psu_wattage: detected.psu_wattage || prev?.psu_wattage || 750,
      psu_model: detected.psu_model || prev?.psu_model || null,
      cooling_solution: detected.cooling_solution || prev?.cooling_solution || null,
      form_factor: detected.form_factor || prev?.form_factor || "DESKTOP",
      is_incomplete: detected.is_incomplete || false,
      notes: detected.notes || null,
      operating_system: detected.operating_system || prev?.operating_system || "Windows 11",
      os_architecture: detected.os_architecture || prev?.os_architecture || "64-bit",
      directx_version: detected.directx_version || prev?.directx_version || "DirectX 12 Ultimate",
      display_resolution: detected.display_resolution || prev?.display_resolution || "2560x1440",
      refresh_rate: detected.refresh_rate || prev?.refresh_rate || 144,
      is_primary: false,
    }));
    setActionMessage({
      type: "success",
      text: "Detected hardware specifications applied to the evaluator form!",
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1e2330]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1.5">
            <Cpu className="w-4 h-4" />
            <span>Hardware Diagnostics & Smart Recommendations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            PC Compatibility Checker
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Evaluate your PC hardware, save previous rigs, compare configurations side-by-side, and explore top 3 verified gaming recommendations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Smart Auto-Detect Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerModalOpen(true)}
            className="gap-2 text-xs border-orange-500/40 text-orange-300 hover:bg-orange-500/10 font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Auto-Scan PC</span>
          </Button>

          {isAuthenticated && (
            <>
              {/* Compare Saved PCs */}
              {profiles.length >= 2 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="gap-2 text-xs text-sky-300 hover:text-white"
                >
                  <Scale className="w-3.5 h-3.5 text-sky-400" />
                  <span>Compare My PCs ({profiles.length})</span>
                </Button>
              )}

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
            onOpenScanner={() => setIsScannerModalOpen(true)}
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

        {/* Right Sidebar: Active Rig Preview & Standby Guidance */}
        <div className="space-y-6">
          {activeResult ? (
            <HardwareSummaryCard
              summary={activeResult.hardware_summary}
              checkedAt={activeResult.checked_at}
            />
          ) : currentSpecs ? (
            <HardwareSummaryCard
              summary={{
                cpu: `${currentSpecs.cpu_manufacturer} ${currentSpecs.cpu_model}`,
                gpu: `${currentSpecs.gpu_manufacturer} ${currentSpecs.gpu_model} (${currentSpecs.gpu_vram_gb}GB)`,
                ram: `${currentSpecs.ram_gb}GB ${currentSpecs.ram_type || "RAM"}`,
                storage: `${currentSpecs.storage_type.replace('_', ' ')} (${currentSpecs.storage_free_gb}GB Free)`,
                os: currentSpecs.operating_system,
                display: `${currentSpecs.display_resolution} @ ${currentSpecs.refresh_rate || 60}Hz`,
                motherboard: currentSpecs.motherboard_model || undefined,
                psu: currentSpecs.psu_wattage ? `${currentSpecs.psu_wattage}W ${currentSpecs.psu_model || ""}` : undefined,
                cooling: currentSpecs.cooling_solution || undefined,
              }}
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

      {/* Top 3 Gaming PC Recommendations Section */}
      <Top3RecommendationsSection />

      {/* Intelligent User PC Comparison Table & Power Headroom */}
      <PCRecommendationComparisonTable
        currentSpecs={currentSpecs}
        activeProfileId={activeProfileId}
        token={token}
      />

      {/* Modals */}
      <SmartPCScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onApplySpecs={handleApplyDetectedSpecs}
      />

      <SavedPCProfilesModal
        isOpen={isProfilesModalOpen}
        onClose={() => setIsProfilesModalOpen(false)}
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={handleDeleteProfile}
        onSetPrimaryProfile={handleSetPrimaryProfile}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        isLoading={isLoading}
      />

      {token && (
        <PCProfileCompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          profiles={profiles}
          token={token}
          onProfileUpdated={loadUserProfiles}
        />
      )}

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
