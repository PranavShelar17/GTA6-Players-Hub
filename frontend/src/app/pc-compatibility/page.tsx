import React from "react";
import { 
  Cpu, 
  AlertTriangle, 
  Zap, 
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function PcCompatibilityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          <Cpu className="w-4 h-4" />
          <span>Hardware Diagnostics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          PC Compatibility Checker
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Evaluate your hardware setup, identify potential CPU/GPU bottlenecks, and plan budget-conscious component upgrades.
        </p>
      </div>

      {/* MANDATORY OFFICIAL DISCLAIMER CALLOUT BANNER */}
      <div className="mb-8 p-5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-200">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              Official Requirement Status Notice
            </h4>
            <p className="text-sm text-amber-200 leading-relaxed font-semibold">
              &quot;GTA 6 PC system requirements have not been officially confirmed by Rockstar Games.&quot;
            </p>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Any performance ratings, bottleneck estimations, or hardware tiers shown on this platform are modeled against modern AAA current-generation engine standards (RAGE 9, Unreal Engine 5 benchmarks) and must not be interpreted as official publisher requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Specification Input Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#1e2330]">
            <CardHeader>
              <CardTitle className="text-lg">Enter Your PC Hardware Specifications</CardTitle>
              <CardDescription>
                Input your component details below to calculate hardware balance and upgrade recommendations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* CPU Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Processor (CPU)
                </label>
                <Input 
                  placeholder="e.g., AMD Ryzen 5 7600X or Intel Core i7-13700K"
                  defaultValue="AMD Ryzen 7 5800X"
                />
              </div>

              {/* GPU Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Graphics Card (GPU)
                </label>
                <Input 
                  placeholder="e.g., NVIDIA GeForce RTX 4070 Super or AMD Radeon RX 7800 XT"
                  defaultValue="NVIDIA GeForce RTX 3070"
                />
              </div>

              {/* RAM & VRAM row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    System RAM (Memory)
                  </label>
                  <select defaultValue="32" className="w-full rounded-lg bg-[#141722] border border-[#232938] px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                    <option value="16">16 GB DDR4/DDR5</option>
                    <option value="32">32 GB DDR4/DDR5 (Recommended)</option>
                    <option value="64">64 GB DDR5</option>
                    <option value="8">8 GB (Below Expected Minimum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    GPU Video Memory (VRAM)
                  </label>
                  <select defaultValue="8" className="w-full rounded-lg bg-[#141722] border border-[#232938] px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                    <option value="8">8 GB GDDR6</option>
                    <option value="12">12 GB GDDR6X</option>
                    <option value="16">16 GB GDDR6</option>
                    <option value="24">24 GB GDDR6X</option>
                    <option value="6">6 GB or lower</option>
                  </select>
                </div>
              </div>

              {/* Storage & Resolution row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Storage Drive Type
                  </label>
                  <select defaultValue="nvme4" className="w-full rounded-lg bg-[#141722] border border-[#232938] px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                    <option value="nvme4">NVMe M.2 Gen 4 SSD</option>
                    <option value="nvme3">NVMe M.2 Gen 3 SSD</option>
                    <option value="sata">SATA 2.5&quot; SSD</option>
                    <option value="hdd">Mechanical HDD (Not Recommended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Target Display Resolution
                  </label>
                  <select defaultValue="1440p" className="w-full rounded-lg bg-[#141722] border border-[#232938] px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                    <option value="1080p">1080p (Full HD - 1920x1080)</option>
                    <option value="1440p">1440p (Quad HD - 2560x1440)</option>
                    <option value="4k">4K (Ultra HD - 3840x2160)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" className="w-full sm:w-auto gap-2">
                  <Zap className="w-4 h-4" />
                  Analyze Hardware Compatibility (Phase 8 Preview)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compatibility Analysis Result Placeholder */}
          <Card className="border-[#1e2330] bg-[#10131d]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-200">Analysis Preview & Bottleneck Engine</CardTitle>
                <Badge variant="unconfirmed">Phase 8 Calculation</Badge>
              </div>
              <CardDescription>
                Preview of the component balance analysis for the sample specification above.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-lg bg-[#151926] border border-[#232b3c] text-center">
                  <div className="text-xs text-slate-400 mb-1">Processor Balance</div>
                  <div className="text-sm font-bold text-emerald-400">High Suitability</div>
                  <div className="text-[11px] text-slate-500 mt-1">8 Cores / 16 Threads</div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#151926] border border-[#232b3c] text-center">
                  <div className="text-xs text-slate-400 mb-1">Estimated Bottleneck</div>
                  <div className="text-sm font-bold text-amber-400">~12% GPU VRAM Limit</div>
                  <div className="text-[11px] text-slate-500 mt-1">At 1440p High Textures</div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#151926] border border-[#232b3c] text-center">
                  <div className="text-xs text-slate-400 mb-1">Storage Velocity</div>
                  <div className="text-sm font-bold text-emerald-400">DirectStorage Ready</div>
                  <div className="text-[11px] text-slate-500 mt-1">NVMe Gen 4 Throughput</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-[#161a27] p-3 rounded-lg border border-[#22293b]">
                <strong className="text-slate-200">Upgrade Recommendation (Preview):</strong> Upgrading from 8GB to a 12GB+ VRAM GPU (such as RTX 4070 or RX 7800 XT) will yield smoother frame pacing at 1440p for open-world texture streaming.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Planning & Roadmap Sidebar */}
        <div className="space-y-6">
          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400" />
              <span>Budget Upgrade Planner</span>
            </CardTitle>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Plan targeted upgrades by budget tier when preparing your rig for next-generation open world titles:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-[#161a25] border border-[#222938]">
                <div className="font-bold text-white">$100 - $150 Tier</div>
                <div className="text-slate-400 mt-0.5">Upgrade to 32GB 3600MHz RAM + 1TB NVMe Gen 4 SSD</div>
              </div>
              <div className="p-2.5 rounded bg-[#161a25] border border-[#222938]">
                <div className="font-bold text-white">$300 - $450 Tier</div>
                <div className="text-slate-400 mt-0.5">Upgrade GPU to 12GB VRAM class (RTX 4060 Ti 16GB or RX 7700 XT)</div>
              </div>
              <div className="p-2.5 rounded bg-[#161a25] border border-[#222938]">
                <div className="font-bold text-white">$600+ Enthusiast</div>
                <div className="text-slate-400 mt-0.5">Ryzen 7 7800X3D + RTX 4070 Ti Super 16GB</div>
              </div>
            </div>
          </Card>

          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-2">Optional Windows Scanner</CardTitle>
            <p className="text-xs text-slate-400 leading-relaxed">
              In a future enhancement, an optional native Windows hardware scanner (.NET) will allow one-click spec import with zero manual typing, strictly with transparent user permission.
            </p>
          </Card>
        </div>

      </div>

    </div>
  );
}
