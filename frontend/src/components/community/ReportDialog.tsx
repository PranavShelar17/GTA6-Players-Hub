"use client";

import React, { useState } from "react";
import { Flag, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { reportCommunityContent, ReportPayload } from "@/lib/communityApi";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT" | "PLAYER";
  targetId: string;
  targetTitle?: string;
  token?: string;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or Scam", desc: "Commercial promotion, bots, or deceptive links." },
  { value: "HARASSMENT", label: "Harassment or Bullying", desc: "Targeted attacks, threats, or intimidation." },
  { value: "HATE", label: "Hate Speech", desc: "Discrimination or violence against protected groups." },
  { value: "INAPPROPRIATE", label: "Inappropriate Content", desc: "Sexually explicit or excessively violent content." },
  { value: "IMPERSONATION", label: "Impersonation", desc: "Pretending to be another player or official staff." },
  { value: "MISINFORMATION", label: "Deliberate Misinformation", desc: "False release dates, fake leaks, or malicious rumors." },
  { value: "COPYRIGHT", label: "Copyright Violation", desc: "Unauthorized intellectual property or assets." },
  { value: "OTHER", label: "Other Violation", desc: "General violation of community safety rules." },
];

export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  token,
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>("SPAM");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("You must be logged in to file a moderation report.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ReportPayload = {
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      };
      await reportCommunityContent(payload, token);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
            <Flag className="w-5 h-5" />
            <span>Report {targetType.toLowerCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetTitle && (
          <div className="mt-3 text-xs text-slate-400 truncate bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/60">
            Target: <span className="text-slate-200 font-medium">&ldquo;{targetTitle}&rdquo;</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Report Submitted</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Thank you for keeping our community safe. Our moderation team will review this shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Reason
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === r.value
                        ? "bg-rose-950/30 border-rose-500 text-white"
                        : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-0.5 text-rose-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white">{r.label}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Provide any additional context or specific timestamps/quotes..."
                className="w-full text-xs rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-500">
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
