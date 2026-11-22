import React from "react";
import Link from "next/link";
import { Cpu, AlertTriangle, ArrowRight, CheckCircle2, Sliders } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PCCompatibilitySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="rounded-2xl border border-[#202738] bg-gradient-to-br from-[#121520] via-[#0f1118] to-[#0c0e14] p-6 sm:p-10 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left: Info & Description */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware Diagnostic Engine</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Is Your PC Ready for Leonida?
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Benchmark your CPU, GPU, RAM, and SSD storage against our speculative next-generation RAGE engine hardware profiles. Identify potential bottlenecks before launch.
            </p>

            {/* Prominent Disclaimer */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-300 max-w-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Official PC Notice:</span> Rockstar Games has officially confirmed Grand Theft Auto VI for PlayStation 5 and Xbox Series X/S. Official PC system requirements have not been announced. All hardware diagnostics represent speculative baseline estimates.
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/pc-compatibility">
                <Button variant="primary" size="md" className="gap-2 shadow-lg shadow-rose-950/20">
                  <Sliders className="w-4 h-4" />
                  Test Your Rig Now
                </Button>
              </Link>
              <Link href="/pc-compatibility">
                <Button variant="outline" size="md" className="gap-2">
                  View Requirements Status
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Modern Gaming Hardware Target Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-[#273045] bg-[#141824] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2638]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Modern Gaming Baseline (1440p Target)
                </span>
                <span className="text-[11px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  Hardware Target
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Processor (CPU)</span>
                  <span className="font-bold text-white">Ryzen 7 7700X / Core i7-13700K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Graphics (GPU)</span>
                  <span className="font-bold text-white">RTX 4070 (12GB) / RX 7800 XT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">System Memory (RAM)</span>
                  <span className="font-bold text-white">32 GB DDR5 High-Speed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Storage</span>
                  <span className="font-bold text-emerald-400">NVMe M.2 SSD Required</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1f2638] flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  DirectStorage Ready
                </span>
                <span>Ray-Tracing Accelerated</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
