"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import {
  Send,
  Paperclip,
  X,
  Cpu,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatInputAreaProps {
  onSendMessage: (content: string, attachmentUrl?: string, includeHardware?: boolean) => Promise<void>;
  onUploadScreenshot: (file: File) => Promise<string>;
  onOpenHardwareConsentModal: () => void;
  isGenerating: boolean;
  hasHardwareProfile: boolean;
  hardwareProfileSummary?: string | null;
  includeHardwareContext: boolean;
  setIncludeHardwareContext: (include: boolean) => void;
}

export function ChatInputArea({
  onSendMessage,
  onUploadScreenshot,
  onOpenHardwareConsentModal,
  isGenerating,
  hasHardwareProfile,
  hardwareProfileSummary,
  includeHardwareContext,
  setIncludeHardwareContext,
}: ChatInputAreaProps) {
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !attachmentUrl) || isGenerating || uploadingImage) return;

    const messageText = content.trim();
    const url = attachmentUrl || undefined;

    setContent("");
    setAttachmentUrl(null);
    setUploadError(null);

    await onSendMessage(messageText, url, includeHardwareContext);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file size exceeds the 10MB limit.");
      return;
    }

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only PNG, JPG, and WebP images are supported.");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const uploadedUrl = await onUploadScreenshot(file);
      setAttachmentUrl(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setUploadError(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-[#0e111a] border border-[#1f2638] rounded-2xl p-3 sm:p-4 shadow-xl">
      {/* Uploaded Attachment Preview Pill */}
      {attachmentUrl && (
        <div className="mb-3 inline-flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-[#161b2b] border border-[#252d42] text-xs text-slate-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachmentUrl}
            alt="Attachment preview"
            className="w-8 h-8 rounded object-cover border border-[#303a54]"
          />
          <span className="truncate max-w-[200px]">Attached Error Screenshot</span>
          <button
            onClick={() => setAttachmentUrl(null)}
            className="p-1 hover:text-rose-400 text-slate-400 transition-colors ml-1"
            title="Remove screenshot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Progress or Error Banner */}
      {uploadingImage && (
        <div className="mb-2 text-xs text-sky-400 flex items-center gap-2 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading and processing screenshot...</span>
        </div>
      )}

      {uploadError && (
        <div className="mb-2 text-xs text-rose-400 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Textarea Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your game crash, stutter, error code, or driver problem... (Press Enter to send)"
          rows={3}
          disabled={isGenerating}
          className="w-full bg-[#131724] border border-[#20273c] rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none transition-colors"
        />
      </div>

      {/* Footer Controls: Screenshot attachment, Hardware toggle, Send button */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a2030]">
        <div className="flex flex-wrap items-center gap-3">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || isGenerating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161a29] hover:bg-[#1d2336] border border-[#20273c] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Attach screenshot or error dialog (PNG, JPG, WebP max 10MB)"
          >
            <Paperclip className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Attach Screenshot</span>
            <span className="sm:hidden">Attach</span>
          </button>

          {/* Hardware Context Toggle */}
          <div className="flex items-center gap-1.5">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={includeHardwareContext}
                onChange={(e) => setIncludeHardwareContext(e.target.checked)}
                className="rounded border-[#2a334a] bg-[#121624] text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Include PC Specs</span>
              </span>
            </label>

            {hasHardwareProfile && hardwareProfileSummary && (
              <span
                className="hidden md:inline-block text-[10px] text-slate-400 max-w-[150px] truncate"
                title={hardwareProfileSummary}
              >
                ({hardwareProfileSummary})
              </span>
            )}

            <button
              type="button"
              onClick={onOpenHardwareConsentModal}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              title="Learn what hardware details are shared"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={(!content.trim() && !attachmentUrl) || isGenerating || uploadingImage}
          className="gap-2 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-4"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Send Diagnostic</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
