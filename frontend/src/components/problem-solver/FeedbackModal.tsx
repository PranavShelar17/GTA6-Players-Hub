"use client";

import React, { useState } from "react";
import { Flag, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: "helpful" | "not_helpful" | "reported";
    report_reason?: string;
    comments?: string;
  }) => void;
  initialRating?: "helpful" | "not_helpful" | "reported";
}

const REPORT_REASONS = [
  "Inaccurate or Incorrect Advice",
  "Dangerous or Harmful Steps",
  "Fabricated / Unannounced GTA 6 Details",
  "Broken Link or Obsolete Tool",
  "Unhelpful / Off-Topic Response",
  "Other Reason",
];

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  initialRating = "reported",
}: FeedbackModalProps) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        rating: initialRating,
        report_reason: initialRating === "reported" ? reason : undefined,
        comments: comments.trim() ? comments.trim() : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121624] border border-[#232a3e] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report AI Diagnostic Response</h3>
              <p className="text-xs text-slate-400">Help improve troubleshooting safety & accuracy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#0d101a] border border-[#232b3f] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Explain what was incorrect, dangerous, or missing..."
              rows={3}
              maxLength={500}
              className="w-full bg-[#0d101a] border border-[#232b3f] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#181d2c] border border-[#222a3d] text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Your feedback is audited by the engineering team to reinforce safety filters and update the troubleshooting knowledge base.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
