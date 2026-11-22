"use client";

import React from "react";
import { 
  Clock, 
  History, 
  X, 
  Eye, 
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CompatibilityCheckHistoryItem } from "@/lib/pcCompatibilityApi";

interface CompatibilityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CompatibilityCheckHistoryItem[];
  onSelectCheck: (checkId: string) => Promise<void>;
  isLoading: boolean;
}

export function CompatibilityHistoryModal({
  isOpen,
  onClose,
  history,
  onSelectCheck,
  isLoading,
}: CompatibilityHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#121622] border border-[#232b3e] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-bold text-white">Previous Compatibility Checks</h3>
              <p className="text-xs text-slate-400">Review historical evaluation reports and hardware diagnostics.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">No previous check history found.</p>
              <p className="text-xs text-slate-500">
                Run an evaluation while logged in to view your diagnostic logs here.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#181d2c] border border-[#263044] hover:border-[#384664] transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold text-white">{item.profile_name || "PC Hardware Check"}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.checked_at).toLocaleString()}
                    </span>
                    <Badge variant={item.result_status === "REQUIREMENTS_UNAVAILABLE" ? "unconfirmed" : "verified"}>
                      {item.result_status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {item.analysis_summary}
                </p>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={async () => {
                      await onSelectCheck(item.id);
                      onClose();
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Diagnostic</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#141824] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
