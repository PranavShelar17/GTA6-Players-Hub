"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Wrench, 
  Sparkles, 
  Bot, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  Monitor, 
  Flame, 
  Gamepad2, 
  Terminal,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const ERROR_CATEGORIES = [
  { icon: Flame, name: "Crash to Desktop", desc: "Game closes with or without error dialog" },
  { icon: Monitor, name: "DirectX & Graphics", desc: "D3D12 device lost or shader compilation errors" },
  { icon: Cpu, name: "Low FPS & Stuttering", desc: "Frame pacing, GPU usage drops, micro-stutters" },
  { icon: AlertCircle, name: "Black Screen on Launch", desc: "Audio plays but display fails to initialize" },
  { icon: Terminal, name: "Driver Timeouts", desc: "NVIDIA / AMD driver reset notifications" },
  { icon: Gamepad2, name: "Controller & Input", desc: "DualSense / Xbox controller mapping issues" },
];

const SUGGESTED_QUERIES = [
  "How to cleanly reinstall graphics drivers using DDU?",
  "Resolving ERR_GFX_D3D_INIT error in Rockstar games",
  "Fixing DirectX 12 launch crash on Windows 11",
  "Optimizing virtual memory paging file for heavy games"
];

export default function ProblemSolverPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          <Wrench className="w-4 h-4" />
          <span>Technical Assistance Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Gaming Problem Solver
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          AI-assisted technical diagnostics, verified error code encyclopedia, safe driver guides, and step-by-step resolution checklists.
        </p>
      </div>

      {/* PHASE NOTICE */}
      <div className="mb-8 p-4 rounded-xl border border-sky-900/40 bg-sky-950/20 text-xs text-sky-200 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sky-300">Phase 1 Interface Foundation:</span> The live AI retrieval engine powered by Google Gemini and PostgreSQL vector knowledge base (`pgvector`) will be activated in Phase 9. The interactive layout below presents the conversation design and error database navigation.
        </div>
      </div>

      {/* Main Diagnostic Input Card */}
      <div className="mb-10">
        <Card className="border-[#1e2330] bg-[#12141c] p-6">
          <label className="block text-sm font-bold text-white mb-2">
            Describe the Technical Problem or Paste Error Code
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Error ERR_GFX_D3D_INIT or game crashes after 15 minutes of play..."
              className="text-base py-3"
            />
            <Button variant="primary" size="lg" className="w-full sm:w-auto shrink-0 gap-2">
              <Bot className="w-4 h-4" />
              Ask Diagnostic Assistant
            </Button>
          </div>

          {/* Suggested Quick Questions */}
          <div className="mt-4 pt-4 border-t border-[#1a1f2b] flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold mr-1">Suggested:</span>
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(q)}
                className="text-xs text-slate-400 hover:text-orange-400 bg-[#161a26] hover:bg-[#1d2334] px-2.5 py-1 rounded-md border border-[#22293b] transition-colors cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Common Problem Categories Grid */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Common Troubleshooting Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ERROR_CATEGORIES.map((cat, idx) => (
            <Card key={idx} className="border-[#1e2330] hover:border-orange-500/30 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-105 transition-transform">
                  <cat.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Conversation Interface Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chat Stream Window (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-[#1e2330] bg-[#0d0e14] min-h-[380px] flex flex-col justify-between">
            <CardHeader className="border-b border-[#181c26] pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <CardTitle className="text-sm font-bold text-white">Diagnostic Session</CardTitle>
                </div>
                <Badge variant="verified">Safe System Advice Only</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 py-6">
              {/* Assistant Welcome Bubble */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-xl bg-[#141824] border border-[#212738] text-xs text-slate-300 space-y-2 max-w-xl">
                  <p className="font-semibold text-white">
                    Hello, Player! I am the GTA 6 Player Hub Technical Diagnostic Assistant.
                  </p>
                  <p>
                    I assist players with crash troubleshooting, DirectX error codes, driver conflict resolutions, and controller configurations using verified knowledge bases.
                  </p>
                  <p className="text-slate-400 text-[11px] pt-1 border-t border-[#1d2333]">
                    🛡️ Safety Guarantee: I will never recommend unsafe registry deletions, unverified third-party executable downloads, or destructive hardware modifications.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-[#181c26] pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>AI Chat session will connect in Phase 9 with live Gemini RAG.</span>
              <Link href="/login" className="text-orange-400 hover:underline flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" />
                Sign in to save chat history
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Safety & Escalation Sidebar */}
        <div className="space-y-6">
          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe Advice Protocol</span>
            </CardTitle>
            <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
              <li>Step-by-step verified software troubleshooting only.</li>
              <li>Transparently identifies hardware uncertainty.</li>
              <li>Encourages official OEM GPU driver updates directly from NVIDIA, AMD, and Intel.</li>
              <li>Never suggests risky BIOS flashing or warranty-voiding steps.</li>
            </ul>
          </Card>

          <Card className="border-[#1e2330]">
            <CardTitle className="text-sm mb-2">Unresolved Issues?</CardTitle>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              When automated diagnostics cannot resolve your issue, escalate to community hardware specialists or official Rockstar support channels.
            </p>
            <Link href="/community">
              <Button variant="outline" size="sm" className="w-full">
                Ask in Hardware Community
              </Button>
            </Link>
          </Card>
        </div>

      </div>

    </div>
  );
}
