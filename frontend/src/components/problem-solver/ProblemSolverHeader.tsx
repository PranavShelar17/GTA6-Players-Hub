"use client";

import React from "react";
import { 
  Bot, 
  PlusCircle, 
  History, 
  Compass, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AIServiceStatusBadge } from "./AIServiceStatusBadge";
import { AIServiceStatus } from "@/lib/problemSolverApi";

interface ProblemSolverHeaderProps {
  status: AIServiceStatus | null;
  loading?: boolean;
  onStartNewConversation: () => void;
  onToggleHistory: () => void;
  onScrollToCategories: () => void;
  hasActiveConversation: boolean;
}

export function ProblemSolverHeader({
  status,
  loading,
  onStartNewConversation,
  onToggleHistory,
  onScrollToCategories,
  hasActiveConversation,
}: ProblemSolverHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Top Bar with Badge & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AIServiceStatusBadge status={status} loading={loading} />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleHistory}
            className="gap-2 text-xs border-[#252c40] bg-[#121624] text-slate-300 hover:text-white hover:bg-[#1a2136]"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Previous Conversations</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onScrollToCategories}
            className="gap-2 text-xs border-[#252c40] bg-[#121624] text-slate-300 hover:text-white hover:bg-[#1a2136]"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span>Suggested Problems</span>
          </Button>

          {hasActiveConversation && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartNewConversation}
              className="gap-2 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start New Conversation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
          <Bot className="w-4 h-4" />
          <span>AI Technical Diagnostic Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
          AI Gaming Problem Solver
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-1.5 max-w-3xl leading-relaxed">
          Get real-time troubleshooting, error code breakdown, clean driver reinstall instructions, and safe hardware diagnostic checklists for your gaming rig.
        </p>
      </div>

      {/* AI Limitations & Safety Banner */}
      <div className="p-3.5 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            Safety & Information Notice:
          </p>
          <p className="leading-relaxed text-amber-200/80">
            This tool provides verified, reversible PC troubleshooting guidance. It will never recommend unverified third-party software, dangerous registry edits, or irreversible firmware modifications. Official GTA 6 announcements and system requirements will be verified and clearly labeled as they are released by Rockstar Games.
          </p>
        </div>
      </div>
    </div>
  );
}
