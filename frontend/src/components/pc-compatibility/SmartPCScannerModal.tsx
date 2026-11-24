"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Copy, 
  Check, 
  Upload, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Info,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PCHardwareProfileCreate } from "@/lib/pcCompatibilityApi";

interface SmartPCScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySpecs: (specs: Partial<PCHardwareProfileCreate>) => void;
}

const POWERSHELL_SCANNER_SCRIPT = `# GTA 6 Player Hub - Read-Only Hardware Diagnostic Utility
# Safely collects local PC hardware configuration and outputs clean JSON.
# ZERO registry modifications, ZERO network calls, ZERO admin privileges required.

$ErrorActionPreference = "SilentlyContinue"

# 1. CPU
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = if ($cpu) { $cpu.Name.Trim() } else { "Unknown Processor" }
$cpuManufacturer = if ($cpuName -match "Intel") { "Intel" } elseif ($cpuName -match "AMD") { "AMD" } else { "Other" }
$cpuCores = if ($cpu.NumberOfCores) { [int]$cpu.NumberOfCores } else { 8 }
$cpuThreads = if ($cpu.NumberOfLogicalProcessors) { [int]$cpu.NumberOfLogicalProcessors } else { 16 }

# 2. GPU
$gpus = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch "Virtual|Remote|Basic|Mirror" }
$gpu = $gpus | Select-Object -First 1
$gpuName = if ($gpu) { $gpu.Name.Trim() } else { "Unknown Graphics Card" }
$gpuManufacturer = if ($gpuName -match "NVIDIA|GeForce|RTX|GTX") { "NVIDIA" } elseif ($gpuName -match "AMD|Radeon") { "AMD" } elseif ($gpuName -match "Intel|Arc") { "Intel" } else { "Other" }

# VRAM estimate (AdapterRAM in bytes -> GB)
$vramBytes = if ($gpu.AdapterRAM) { [double]$gpu.AdapterRAM } else { 0 }
$vramGB = [Math]::Round($vramBytes / 1GB, 1)
if ($vramGB -le 0 -or $vramGB -gt 96) {
    if ($gpuName -match "4090") { $vramGB = 24.0 }
    elseif ($gpuName -match "4080") { $vramGB = 16.0 }
    elseif ($gpuName -match "4070") { $vramGB = 12.0 }
    elseif ($gpuName -match "4060 Ti|7800 XT|7900 GRE") { $vramGB = 16.0 }
    elseif ($gpuName -match "4060|7600|6600") { $vramGB = 8.0 }
    else { $vramGB = 8.0 }
}

# 3. Memory (RAM)
$ramChips = Get-CimInstance Win32_PhysicalMemory
$totalRamBytes = ($ramChips | Measure-Object -Property Capacity -Sum).Sum
$ramGB = if ($totalRamBytes) { [int][Math]::Round($totalRamBytes / 1GB) } else { 16 }
$ramSpeed = ($ramChips | Select-Object -First 1).Speed
$ramSpeedMhz = if ($ramSpeed) { [int]$ramSpeed } else { 3200 }
$ramType = if ($ramSpeedMhz -ge 4800) { "DDR5" } elseif ($ramSpeedMhz -ge 2133) { "DDR4" } else { "DDR4" }

# 4. Motherboard
$baseBoard = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
$motherboard = if ($baseBoard) { "$($baseBoard.Manufacturer) $($baseBoard.Product)".Trim() } else { "Standard Motherboard" }

# 5. Primary Storage Drive
$sysDrive = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $env:SystemDrive }
$freeGB = if ($sysDrive.FreeSpace) { [int][Math]::Round($sysDrive.FreeSpace / 1GB) } else { 250 }
$capGB = if ($sysDrive.Size) { [int][Math]::Round($sysDrive.Size / 1GB) } else { 1000 }
$physDrive = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
$storageType = "NVME_SSD"
if ($physDrive.Model -match "NVMe|M.2|PCIe") { $storageType = "NVME_SSD" }
elseif ($physDrive.MediaType -match "SSD" -or $physDrive.Model -match "SSD") { $storageType = "SATA_SSD" }
elseif ($physDrive.MediaType -match "Fixed hard disk" -and $physDrive.Model -notmatch "SSD") { $storageType = "HDD" }

# 6. Operating System
$os = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
$osCaption = if ($os.Caption) { $os.Caption.Trim() } else { "Windows 11" }
$osName = if ($osCaption -match "Windows 11") { "Windows 11" } elseif ($osCaption -match "Windows 10") { "Windows 10" } else { "Windows 11" }

# Form Factor
$enclosure = Get-CimInstance Win32_SystemEnclosure | Select-Object -First 1
$formFactor = "DESKTOP"
if ($enclosure.ChassisTypes -contains 9 -or $enclosure.ChassisTypes -contains 10) { $formFactor = "LAPTOP" }

$payload = [PSCustomObject]@{
    profile_name = "$env:COMPUTERNAME Detected Rig"
    cpu_manufacturer = $cpuManufacturer
    cpu_model = $cpuName
    cpu_cores = $cpuCores
    cpu_threads = $cpuThreads
    gpu_manufacturer = $gpuManufacturer
    gpu_model = $gpuName
    gpu_vram_gb = $vramGB
    gpu_type = "DEDICATED"
    ram_gb = $ramGB
    ram_type = $ramType
    ram_speed_mhz = $ramSpeedMhz
    motherboard_model = $motherboard
    storage_type = $storageType
    storage_capacity_gb = $capGB
    storage_free_gb = $freeGB
    operating_system = $osName
    os_architecture = "64-bit"
    directx_version = "DirectX 12 Ultimate"
    display_resolution = "2560x1440"
    refresh_rate = 144
    form_factor = $formFactor
    psu_wattage = 750
    cooling_solution = "Air Cooler / AIO"
    is_incomplete = $false
}

$payload | ConvertTo-Json -Compress
`;

export function SmartPCScannerModal({
  isOpen,
  onClose,
  onApplySpecs,
}: SmartPCScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"browser" | "powershell">("browser");
  const [copiedScript, setCopiedScript] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedBrowserSpecs, setDetectedBrowserSpecs] = useState<Partial<PCHardwareProfileCreate> | null>(null);

  if (!isOpen) return null;

  // Option A: Browser WebGL & Environment Auto-Detection
  const handleDetectBrowser = () => {
    setErrorMsg(null);
    try {
      let detectedGPU = "Generic Graphics Hardware";
      let detectedManufacturer: "NVIDIA" | "AMD" | "Intel" | "Other" = "Other";

      // Detect GPU via WebGL unmasked renderer
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer && typeof renderer === "string") {
              detectedGPU = renderer;
              if (/nvidia|geforce|rtx|gtx/i.test(renderer)) detectedManufacturer = "NVIDIA";
              else if (/amd|radeon/i.test(renderer)) detectedManufacturer = "AMD";
              else if (/intel|arc|iris|uhd/i.test(renderer)) detectedManufacturer = "Intel";
            }
          }
        }
      } catch {
        // Fallback gracefully
      }

      // Logical cores
      const cores = navigator.hardwareConcurrency || 8;
      
      // Memory estimation if navigator.deviceMemory is available (in GB)
      const deviceMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 16;

      // Screen resolution
      const screenRes = `${window.screen.width}x${window.screen.height}`;

      // OS detection via userAgent
      const ua = navigator.userAgent;
      let detectedOS = "Windows 11";
      if (/Windows NT 10.0/i.test(ua)) detectedOS = "Windows 11";
      else if (/Windows NT 6.3|Windows NT 6.2|Windows NT 6.1/i.test(ua)) detectedOS = "Windows 10";
      else if (/Macintosh|Mac OS X/i.test(ua)) detectedOS = "Other";
      else if (/Linux/i.test(ua)) detectedOS = "Linux / SteamOS";

      const specs: Partial<PCHardwareProfileCreate> = {
        profile_name: "Browser Detected Rig",
        gpu_manufacturer: detectedManufacturer,
        gpu_model: detectedGPU,
        gpu_vram_gb: 8.0,
        gpu_type: "DEDICATED",
        cpu_threads: cores,
        cpu_cores: Math.max(1, Math.floor(cores / 2)),
        ram_gb: Math.max(8, deviceMem),
        display_resolution: screenRes,
        operating_system: detectedOS,
        os_architecture: "64-bit",
        storage_type: "NVME_SSD",
        storage_free_gb: 250,
      };

      setDetectedBrowserSpecs(specs);
    } catch (err) {
      console.error("Browser detection error:", err);
      setErrorMsg("Unable to detect all hardware from browser sandbox. Try the PowerShell Diagnostic script.");
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(POWERSHELL_SCANNER_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleImportJson = () => {
    setErrorMsg(null);
    if (!jsonInput.trim()) {
      setErrorMsg("Please paste the JSON output from the diagnostic utility.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.cpu_model || !parsed.gpu_model) {
        throw new Error("JSON is missing required processor or graphics card models.");
      }

      onApplySpecs(parsed);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid JSON format. Please verify the copied output.");
    }
  };

  const handleApplyBrowserSpecs = () => {
    if (detectedBrowserSpecs) {
      onApplySpecs(detectedBrowserSpecs);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#121622] border border-[#232b3e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-bold text-white">Smart PC Hardware Detection</h3>
              <p className="text-xs text-slate-400">
                Choose Browser Auto-Detect or run the optional Windows diagnostic utility.
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-[#10131d] px-5">
          <button
            onClick={() => setActiveTab("browser")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "browser"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Option A: Browser Auto-Detect (Instant)</span>
          </button>
          <button
            onClick={() => setActiveTab("powershell")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "powershell"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Option B: Windows PowerShell Scanner (Complete)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "browser" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#171c2c] border border-white/5 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sandbox-Safe Browser Query</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Extracts available graphics renderer, CPU thread count, display resolution, and OS platform directly through your browser’s standard WebGL and navigation APIs.
                </p>
              </div>

              {!detectedBrowserSpecs ? (
                <div className="text-center py-6">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleDetectBrowser}
                    className="gap-2 font-bold shadow-lg shadow-orange-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scan Browser Hardware Now</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#182032] border border-emerald-500/30 space-y-2.5">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Detected Hardware Attributes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="text-slate-300">
                        <span className="text-slate-500">GPU:</span> {detectedBrowserSpecs.gpu_model}
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Logical Threads:</span> {detectedBrowserSpecs.cpu_threads}
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Resolution:</span> {detectedBrowserSpecs.display_resolution}
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">OS:</span> {detectedBrowserSpecs.operating_system}
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-300/80 pt-1">
                      Note: Browser sandboxes do not reveal exact CPU clock speeds or motherboard model. You can adjust those in the form after applying.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={handleDetectBrowser} className="text-xs">
                      Re-scan
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleApplyBrowserSpecs} className="text-xs font-bold gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Apply to Evaluator</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Permission and Safety Disclosure */}
              <div className="p-4 rounded-xl bg-[#151a28] border border-amber-500/30 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Safe & Transparent PowerShell Diagnostic</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  This read-only script queries your local hardware via Windows Management Instrumentation (<code className="text-slate-200">Get-CimInstance</code>). It does <strong>not</strong> require Administrator privileges, does <strong>not</strong> modify your registry or files, and sends <strong>zero</strong> data over the internet.
                </p>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>• Inspects: CPU, GPU, VRAM, RAM generation, Motherboard, and free disk space.</div>
                  <div>• Result: Emits a single JSON string directly to your PowerShell console.</div>
                </div>
              </div>

              {/* Step 1: Copy script */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <span>1. Copy Script & Run in Windows PowerShell</span>
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Diagnostic Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b0e14] border border-white/5 font-mono text-[11px] text-slate-400 overflow-x-auto max-h-24">
                  <code>Get-CimInstance Win32_Processor; Get-CimInstance Win32_VideoController... (Click Copy to grab full script)</code>
                </div>
              </div>

              {/* Step 2: Paste JSON */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  2. Paste JSON Output Below:
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Paste the output here: {"profile_name": "DESKTOP-Rig", "cpu_model": "...", ...}'
                  rows={4}
                  className="w-full text-xs font-mono rounded-lg bg-[#0d1017] border border-[#232a3c] p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleImportJson}
                  className="text-xs font-bold gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import & Populate Evaluator</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#141824] flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Missing hardware fields can be completed manually at any time.</span>
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
