"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  RotateCcw, 
  Zap, 
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { PCHardwareProfileCreate } from "@/lib/pcCompatibilityApi";

interface HardwareInputFormProps {
  initialSpecs?: PCHardwareProfileCreate;
  onSubmit: (specs: PCHardwareProfileCreate, saveProfile: boolean, profileName: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const DEFAULT_SPECS: PCHardwareProfileCreate = {
  profile_name: "My Gaming Rig",
  cpu_manufacturer: "AMD",
  cpu_model: "Ryzen 7 7800X3D",
  cpu_cores: 8,
  cpu_threads: 16,
  gpu_manufacturer: "NVIDIA",
  gpu_model: "GeForce RTX 4070 Super",
  gpu_vram_gb: 12.0,
  gpu_type: "DEDICATED",
  ram_gb: 32,
  ram_type: "DDR5",
  storage_type: "NVME_SSD",
  storage_capacity_gb: 2000,
  storage_free_gb: 850,
  operating_system: "Windows 11",
  os_architecture: "64-bit",
  directx_version: "DirectX 12 Ultimate",
  display_resolution: "2560x1440",
  refresh_rate: 165,
  is_primary: true,
};

const PRESETS: Record<string, { label: string; specs: PCHardwareProfileCreate }> = {
  enthusiast: {
    label: "Enthusiast 4K (Ryzen 7 7800X3D / RTX 4080 / 32GB DDR5 / NVMe)",
    specs: {
      profile_name: "Enthusiast 4K Rig",
      cpu_manufacturer: "AMD",
      cpu_model: "Ryzen 7 7800X3D",
      cpu_cores: 8,
      cpu_threads: 16,
      gpu_manufacturer: "NVIDIA",
      gpu_model: "GeForce RTX 4080 16GB",
      gpu_vram_gb: 16.0,
      gpu_type: "DEDICATED",
      ram_gb: 32,
      ram_type: "DDR5",
      storage_type: "NVME_SSD",
      storage_capacity_gb: 2000,
      storage_free_gb: 1200,
      operating_system: "Windows 11",
      os_architecture: "64-bit",
      directx_version: "DirectX 12 Ultimate",
      display_resolution: "3840x2160",
      refresh_rate: 144,
      is_primary: false,
    },
  },
  mainstream: {
    label: "Mainstream 1440p (i5-13600K / RTX 4070 / 32GB DDR5 / NVMe)",
    specs: {
      profile_name: "Mainstream 1440p Rig",
      cpu_manufacturer: "Intel",
      cpu_model: "Core i5-13600K",
      cpu_cores: 14,
      cpu_threads: 20,
      gpu_manufacturer: "NVIDIA",
      gpu_model: "GeForce RTX 4070 12GB",
      gpu_vram_gb: 12.0,
      gpu_type: "DEDICATED",
      ram_gb: 32,
      ram_type: "DDR5",
      storage_type: "NVME_SSD",
      storage_capacity_gb: 1000,
      storage_free_gb: 450,
      operating_system: "Windows 11",
      os_architecture: "64-bit",
      directx_version: "DirectX 12 Ultimate",
      display_resolution: "2560x1440",
      refresh_rate: 144,
      is_primary: false,
    },
  },
  budget: {
    label: "Budget 1080p (Ryzen 5 5600 / RX 6600 / 16GB DDR4 / SATA SSD)",
    specs: {
      profile_name: "Budget 1080p Rig",
      cpu_manufacturer: "AMD",
      cpu_model: "Ryzen 5 5600",
      cpu_cores: 6,
      cpu_threads: 12,
      gpu_manufacturer: "AMD",
      gpu_model: "Radeon RX 6600 8GB",
      gpu_vram_gb: 8.0,
      gpu_type: "DEDICATED",
      ram_gb: 16,
      ram_type: "DDR4",
      storage_type: "SATA_SSD",
      storage_capacity_gb: 1000,
      storage_free_gb: 320,
      operating_system: "Windows 10",
      os_architecture: "64-bit",
      directx_version: "DirectX 12",
      display_resolution: "1920x1080",
      refresh_rate: 75,
      is_primary: false,
    },
  },
  legacy: {
    label: "Legacy PC (Core i5-6500 / GTX 1060 3GB / 8GB DDR3 / HDD)",
    specs: {
      profile_name: "Legacy Desktop",
      cpu_manufacturer: "Intel",
      cpu_model: "Core i5-6500",
      cpu_cores: 4,
      cpu_threads: 4,
      gpu_manufacturer: "NVIDIA",
      gpu_model: "GeForce GTX 1060 3GB",
      gpu_vram_gb: 3.0,
      gpu_type: "DEDICATED",
      ram_gb: 8,
      ram_type: "DDR3",
      storage_type: "HDD",
      storage_capacity_gb: 1000,
      storage_free_gb: 140,
      operating_system: "Windows 10",
      os_architecture: "64-bit",
      directx_version: "DirectX 12",
      display_resolution: "1920x1080",
      refresh_rate: 60,
      is_primary: false,
    },
  },
};

export function HardwareInputForm({
  initialSpecs,
  onSubmit,
  isLoading,
  isAuthenticated,
}: HardwareInputFormProps) {
  const [specs, setSpecs] = useState<PCHardwareProfileCreate>(initialSpecs || DEFAULT_SPECS);
  const [saveProfile, setSaveProfile] = useState<boolean>(isAuthenticated);
  const [profileName, setProfileName] = useState<string>(specs.profile_name || "My Gaming Rig");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFieldChange = (field: keyof PCHardwareProfileCreate, value: string | number | boolean | null) => {
    setSpecs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLoadPreset = (presetKey: string) => {
    if (!PRESETS[presetKey]) return;
    const preset = PRESETS[presetKey].specs;
    setSpecs(preset);
    setProfileName(preset.profile_name);
  };

  const handleReset = () => {
    setSpecs(DEFAULT_SPECS);
    setProfileName("My Gaming Rig");
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!specs.cpu_model.trim()) {
      setValidationError("Please specify your Processor (CPU) model.");
      return;
    }
    if (!specs.gpu_model.trim()) {
      setValidationError("Please specify your Graphics Card (GPU) model.");
      return;
    }
    if (specs.ram_gb < 2) {
      setValidationError("RAM capacity must be at least 2 GB.");
      return;
    }
    if (specs.gpu_vram_gb <= 0) {
      setValidationError("Dedicated VRAM must be greater than 0 GB.");
      return;
    }
    if (specs.storage_free_gb < 0) {
      setValidationError("Available free storage cannot be negative.");
      return;
    }

    await onSubmit(specs, saveProfile, profileName);
  };

  return (
    <Card className="border-[#1e2330] bg-[#11141e]/90">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-400" />
              <span>Enter PC Hardware Specifications</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Provide your system configuration manually or load a standard hardware preset.
            </CardDescription>
          </div>

          {/* Preset Hardware Loader */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Load Preset:</span>
            <select
              aria-label="Load Preset Hardware Rig"
              onChange={(e) => handleLoadPreset(e.target.value)}
              defaultValue=""
              className="text-xs bg-[#171b28] border border-[#262e40] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="" disabled>Select Rig Template...</option>
              {Object.entries(PRESETS).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {validationError}
            </div>
          )}

          {/* Section 1: Processor (CPU) */}
          <div className="space-y-3 pt-1 border-t border-[#1e2330]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>1. Processor (CPU)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Manufacturer *
                </label>
                <select
                  value={specs.cpu_manufacturer}
                  onChange={(e) => handleFieldChange("cpu_manufacturer", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Intel">Intel</option>
                  <option value="AMD">AMD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Processor Model *
                </label>
                <Input
                  value={specs.cpu_model}
                  onChange={(e) => handleFieldChange("cpu_model", e.target.value)}
                  placeholder="e.g. Ryzen 7 7800X3D or Core i7-13700K"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Physical Cores (Optional)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={64}
                  value={specs.cpu_cores || ""}
                  onChange={(e) => handleFieldChange("cpu_cores", e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="e.g. 8"
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total Threads (Optional)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={128}
                  value={specs.cpu_threads || ""}
                  onChange={(e) => handleFieldChange("cpu_threads", e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="e.g. 16"
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Graphics Card (GPU) */}
          <div className="space-y-3 pt-2 border-t border-[#1e2330]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>2. Graphics Card (GPU)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Manufacturer *
                </label>
                <select
                  value={specs.gpu_manufacturer}
                  onChange={(e) => handleFieldChange("gpu_manufacturer", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="AMD">AMD</option>
                  <option value="Intel">Intel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  GPU Model *
                </label>
                <Input
                  value={specs.gpu_model}
                  onChange={(e) => handleFieldChange("gpu_model", e.target.value)}
                  placeholder="e.g. GeForce RTX 4070 Super or Radeon RX 7800 XT"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Dedicated VRAM (GB) *
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={48}
                    value={specs.gpu_vram_gb}
                    onChange={(e) => handleFieldChange("gpu_vram_gb", parseFloat(e.target.value) || 0)}
                    className="text-xs h-9 w-28"
                    required
                  />
                  <div className="flex gap-1">
                    {[6, 8, 12, 16].map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => handleFieldChange("gpu_vram_gb", v)}
                        className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                          specs.gpu_vram_gb === v
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold"
                            : "bg-[#181d2a] border-[#252c3c] text-slate-400 hover:text-white"
                        }`}
                      >
                        {v}GB
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  GPU Type *
                </label>
                <select
                  value={specs.gpu_type}
                  onChange={(e) => handleFieldChange("gpu_type", e.target.value as "DEDICATED" | "INTEGRATED")}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="DEDICATED">Dedicated Graphics Card</option>
                  <option value="INTEGRATED">Integrated CPU Graphics</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Memory & Storage */}
          <div className="space-y-3 pt-2 border-t border-[#1e2330]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              <span>3. System Memory & Storage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* RAM */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total System RAM (GB) *
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={2}
                    max={256}
                    value={specs.ram_gb}
                    onChange={(e) => handleFieldChange("ram_gb", parseInt(e.target.value, 10) || 0)}
                    className="text-xs h-9 w-24"
                    required
                  />
                  <div className="flex gap-1">
                    {[8, 16, 32, 64].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => handleFieldChange("ram_gb", amt)}
                        className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                          specs.ram_gb === amt
                            ? "bg-orange-500/20 border-orange-500/50 text-orange-300 font-bold"
                            : "bg-[#181d2a] border-[#252c3c] text-slate-400 hover:text-white"
                        }`}
                      >
                        {amt}GB
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  RAM Generation
                </label>
                <select
                  value={specs.ram_type || "DDR4"}
                  onChange={(e) => handleFieldChange("ram_type", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="DDR5">DDR5</option>
                  <option value="DDR4">DDR4</option>
                  <option value="DDR3">DDR3</option>
                  <option value="Other">Other / Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Storage Drive Type *
                </label>
                <select
                  value={specs.storage_type}
                  onChange={(e) => handleFieldChange("storage_type", e.target.value as "NVME_SSD" | "SATA_SSD" | "HDD")}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="NVME_SSD">NVMe PCIe M.2 SSD</option>
                  <option value="SATA_SSD">2.5&quot; SATA SSD</option>
                  <option value="HDD">Mechanical Hard Drive (HDD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Free Disk Space (GB) *
                </label>
                <Input
                  type="number"
                  min={0}
                  value={specs.storage_free_gb}
                  onChange={(e) => handleFieldChange("storage_free_gb", parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 500"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total Capacity (GB)
                </label>
                <Input
                  type="number"
                  min={10}
                  value={specs.storage_capacity_gb || ""}
                  onChange={(e) => handleFieldChange("storage_capacity_gb", e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="e.g. 1000 or 2000"
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 4: OS & Display Environment */}
          <div className="space-y-3 pt-2 border-t border-[#1e2330]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>4. Operating System & Monitor Target</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Operating System *
                </label>
                <select
                  value={specs.operating_system}
                  onChange={(e) => handleFieldChange("operating_system", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Windows 11">Windows 11</option>
                  <option value="Windows 10">Windows 10</option>
                  <option value="Windows 7 / 8">Windows 7 / 8 (Unsupported)</option>
                  <option value="Linux / SteamOS">Linux / SteamOS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  OS Architecture *
                </label>
                <select
                  value={specs.os_architecture}
                  onChange={(e) => handleFieldChange("os_architecture", e.target.value as "64-bit" | "32-bit" | "Unknown")}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="64-bit">64-bit (x86_64)</option>
                  <option value="32-bit">32-bit (x86 - Legacy)</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  DirectX Support
                </label>
                <select
                  value={specs.directx_version || "DirectX 12"}
                  onChange={(e) => handleFieldChange("directx_version", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="DirectX 12 Ultimate">DirectX 12 Ultimate (Feature Level 12_2)</option>
                  <option value="DirectX 12">DirectX 12 (Feature Level 12_0)</option>
                  <option value="DirectX 11">DirectX 11</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Resolution *
                </label>
                <select
                  value={specs.display_resolution}
                  onChange={(e) => handleFieldChange("display_resolution", e.target.value)}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="1920x1080">1920x1080 (1080p Full HD)</option>
                  <option value="2560x1440">2560x1440 (1440p Quad HD)</option>
                  <option value="3840x2160">3840x2160 (4K Ultra HD)</option>
                  <option value="1280x720">1280x720 (720p HD)</option>
                  <option value="3440x1440">3440x1440 (Ultrawide 21:9)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Monitor Refresh Rate (Hz)
                </label>
                <select
                  value={specs.refresh_rate || 60}
                  onChange={(e) => handleFieldChange("refresh_rate", parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-lg bg-[#151926] border border-[#232a3c] px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="60">60 Hz Standard</option>
                  <option value="75">75 Hz</option>
                  <option value="120">120 Hz</option>
                  <option value="144">144 Hz Gaming</option>
                  <option value="165">165 Hz Gaming</option>
                  <option value="240">240 Hz Competitive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Save Profile Option */}
          <div className="pt-3 border-t border-[#1e2330] bg-[#0d1017] p-3.5 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={saveProfile}
                  onChange={(e) => setSaveProfile(e.target.checked)}
                  disabled={!isAuthenticated}
                  className="rounded border-[#2b3548] bg-[#141824] text-orange-500 focus:ring-orange-500/20"
                />
                <span className="font-semibold">Save specifications to my Player Hardware Profile</span>
              </label>

              {saveProfile && isAuthenticated && (
                <div className="w-full sm:w-64">
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Profile Name (e.g. Main Rig)"
                    className="text-xs h-8"
                  />
                </div>
              )}
            </div>

            {!isAuthenticated && (
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Sign in to save this hardware configuration to your player account for 1-click re-testing.</span>
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 w-full sm:w-auto text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto font-bold shadow-lg shadow-orange-500/20 text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Hardware...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Evaluate Hardware Compatibility</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
