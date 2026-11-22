"use client";

import React, { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Cpu,
  Image as ImageIcon,
} from "lucide-react";
import { AIMessageItem } from "@/lib/problemSolverApi";

interface ChatMessageItemProps {
  message: AIMessageItem;
  onFeedback: (
    messageId: string,
    rating: "helpful" | "not_helpful" | "reported",
    reportReason?: string
  ) => void;
  onOpenReportModal: (messageId: string) => void;
}

export function ChatMessageItem({
  message,
  onFeedback,
  onOpenReportModal,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Render markdown-styled response sections
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4
            key={idx}
            className="text-sm font-bold text-orange-400 mt-4 mb-2 flex items-center gap-1.5 border-b border-[#222a3d] pb-1"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-white mt-4 mb-2">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-xs sm:text-sm my-1 leading-relaxed">
            {line.replace(/^[-*]\s+/, "")}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="ml-3 text-slate-200 text-xs sm:text-sm my-1.5 flex items-start gap-2">
            <span className="font-mono text-orange-400 font-bold shrink-0">
              {line.match(/^\d+\./)?.[0]}
            </span>
            <span className="leading-relaxed">{line.replace(/^\d+\.\s+/, "")}</span>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-300 text-xs sm:text-sm leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  if (isSystem) {
    return (
      <div className="py-2 px-4 my-2 text-center text-xs text-slate-500 italic bg-[#10141f] rounded-lg border border-[#1b2130]">
        {message.content}
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex items-start gap-3 my-4 group ${
          isAssistant ? "justify-start" : "justify-end"
        }`}
      >
        {/* Assistant Avatar */}
        {isAssistant && (
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0 mt-0.5 shadow-md">
            <Bot className="w-4 h-4" />
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`max-w-3xl rounded-2xl p-4 sm:p-5 shadow-lg relative ${
            isAssistant
              ? "bg-[#121624] border border-[#20273a] text-slate-200 rounded-tl-sm"
              : "bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-sm"
          }`}
        >
          {/* Header Row: Hardware context or screenshot notice */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-white/10 text-[11px]">
            <span className="font-semibold opacity-90">
              {isAssistant ? "AI Diagnostic Assistant" : "Player"}
            </span>

            <div className="flex items-center gap-2 text-slate-400">
              {message.hardware_context_attached && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 text-[10px] font-medium"
                  title={message.hardware_summary || "Player PC profile attached"}
                >
                  <Cpu className="w-3 h-3 text-sky-300" />
                  <span>PC Specs Attached</span>
                </div>
              )}
              <span className="text-[10px] opacity-75">{formattedTime}</span>
            </div>
          </div>

          {/* Attached Screenshot preview */}
          {message.attachment_url && (
            <div className="mb-3">
              <button
                onClick={() => setPreviewImage(message.attachment_url!)}
                className="group/img relative inline-block rounded-lg overflow-hidden border border-[#252c40] bg-black/40 hover:border-orange-500/50 transition-colors cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.attachment_url}
                  alt="Error Screenshot Attachment"
                  className="max-h-48 max-w-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-medium">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Click to expand</span>
                </div>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="space-y-1">
            {isAssistant
              ? renderFormattedContent(message.content)
              : (
                <p className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              )}
          </div>

          {/* Action Footer for Assistant Messages */}
          {isAssistant && (
            <div className="mt-4 pt-2.5 border-t border-[#1a2030] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-[#1a2135] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy response to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Actions */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 mr-1">Was this helpful?</span>

                <button
                  onClick={() => onFeedback(message.id, "helpful")}
                  className={`p-1.5 rounded-md hover:bg-[#1a2135] transition-colors ${
                    message.feedback_rating === "helpful"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-slate-400 hover:text-emerald-400"
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onFeedback(message.id, "not_helpful")}
                  className={`p-1.5 rounded-md hover:bg-[#1a2135] transition-colors ${
                    message.feedback_rating === "not_helpful"
                      ? "text-rose-400 bg-rose-500/10"
                      : "text-slate-400 hover:text-rose-400"
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenReportModal(message.id)}
                  className="p-1.5 rounded-md hover:bg-[#1a2135] text-slate-400 hover:text-amber-400 transition-colors ml-1"
                  title="Report response"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Avatar */}
        {!isAssistant && (
          <div className="p-2 rounded-xl bg-[#1e2538] border border-[#2d3752] text-white shrink-0 mt-0.5 shadow-md">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Enlarged Screenshot"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-[#303950]"
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              Click anywhere to close preview
            </p>
          </div>
        </div>
      )}
    </>
  );
}
