import React from "react";
import Link from "next/link";
import { 
  Wrench, 
  Bot, 
  ArrowRight, 
  AlertCircle, 
  Zap, 
  Gamepad2, 
  Layers, 
  HelpCircle 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProblemSolverSection() {
  const commonCategories = [
    {
      title: "Game Crashes & CTD",
      desc: "Instant crash analysis, memory dump inspections, and Windows event log resolutions.",
      icon: AlertCircle,
      tag: "Stability",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Low FPS & Micro-Stuttering",
      desc: "Frame-pacing diagnostics, shader compilation stutters, and optimal settings profiles.",
      icon: Zap,
      tag: "Performance",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "GPU Driver Compatibility",
      desc: "Clean DDU driver guides, DirectX 12 Ultimate requirements, and Vulkan layer checks.",
      icon: Layers,
      tag: "Drivers",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Controller & Haptic Setup",
      desc: "PlayStation DualSense haptics, Xbox wireless latency, and keybinding solutions.",
      icon: Gamepad2,
      tag: "Input",
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="rounded-2xl border border-[#202738] bg-gradient-to-br from-[#10141f] via-[#0d1017] to-[#090b10] p-6 sm:p-10 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
                <Bot className="w-3.5 h-3.5" />
                <span>AI Technical Problem Solver</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Instant Solutions for Gaming Issues
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Diagnose technical errors, game launch freezes, and performance bottlenecks using verified solutions and AI-assisted troubleshooting.
              </p>
            </div>

            <Link href="/problem-solver" className="shrink-0">
              <Button variant="primary" size="md" className="gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-sky-950/20">
                <Wrench className="w-4 h-4" />
                Launch Problem Solver
              </Button>
            </Link>
          </div>

          {/* 4 Diagnostic Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {commonCategories.map((cat, idx) => (
              <Link
                key={idx}
                href="/problem-solver"
                className="group p-4 rounded-xl border border-[#1f2638] bg-[#121522] hover:border-sky-500/40 hover:bg-[#141828] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg border ${cat.color}`}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {cat.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors mb-1.5">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-[#1b2130] flex items-center justify-between text-[11px] text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Explore Guides</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1a202e] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Have a rare or specific bug? Paste error codes or crash logs directly into the solver.
            </span>
            <Link href="/problem-solver" className="text-sky-400 hover:text-sky-300 font-semibold">
              Browse Error Code Encyclopedia →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
