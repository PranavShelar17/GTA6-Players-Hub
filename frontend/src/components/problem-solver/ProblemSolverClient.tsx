"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AIServiceStatus,
  SuggestedProblemCategory,
  AIConversationItem,
  AIConversationDetail,
  AIMessageItem,
  fetchAIServiceStatus,
  fetchSuggestedCategories,
  createConversation,
  fetchConversations,
  fetchConversation,
  updateConversation,
  deleteConversation,
  sendMessage,
  uploadScreenshotAttachment,
  submitResponseFeedback,
} from "@/lib/problemSolverApi";
import { fetchHardwareProfiles, PCHardwareProfile } from "@/lib/pcCompatibilityApi";
import { ProblemSolverHeader } from "./ProblemSolverHeader";
import { SuggestedProblemCategories } from "./SuggestedProblemCategories";
import { ConversationSidebar } from "./ConversationSidebar";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInputArea } from "./ChatInputArea";
import { HardwareContextConsentModal } from "./HardwareContextConsentModal";
import { FeedbackModal } from "./FeedbackModal";
import { Button } from "@/components/ui/Button";

interface ProblemSolverClientProps {
  initialStatus?: AIServiceStatus | null;
  initialCategories?: SuggestedProblemCategory[];
}

export function ProblemSolverClient({
  initialStatus = null,
  initialCategories = [],
}: ProblemSolverClientProps) {
  const { session, isAuthenticated } = useAuth();
  const token = session?.access_token || null;

  // AI & Categories State
  const [status, setStatus] = useState<AIServiceStatus | null>(initialStatus);
  const [categories, setCategories] = useState<SuggestedProblemCategory[]>(initialCategories);
  const [loadingInitial, setLoadingInitial] = useState(!initialStatus);

  // Conversations State
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<AIConversationDetail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hardware Profile Context
  const [primaryProfile, setPrimaryProfile] = useState<PCHardwareProfile | null>(null);
  const [includeHardwareContext, setIncludeHardwareContext] = useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  // Feedback Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetMessageId, setReportTargetMessageId] = useState<string | null>(null);

  // UI Drawer State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Load initial status & categories if not provided via SSR
  useEffect(() => {
    async function loadConfig() {
      try {
        if (!initialStatus) {
          const s = await fetchAIServiceStatus();
          setStatus(s);
        }
        if (initialCategories.length === 0) {
          const c = await fetchSuggestedCategories();
          setCategories(c);
        }
      } catch (err) {
        console.error("Error loading AI setup:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadConfig();
  }, [initialStatus, initialCategories]);

  // Load player's PC hardware profile if logged in
  useEffect(() => {
    async function loadHardware() {
      if (!token) return;
      try {
        const profiles = await fetchHardwareProfiles(token);
        if (profiles && profiles.length > 0) {
          const primary = profiles.find((p) => p.is_primary) || profiles[0];
          setPrimaryProfile(primary);
        }
      } catch (e) {
        console.warn("Could not load hardware profile:", e);
      }
    }
    loadHardware();
  }, [token]);

  // Load conversation history when auth state changes
  useEffect(() => {
    async function loadUserConversations() {
      if (!token) {
        setConversations([]);
        return;
      }
      try {
        const list = await fetchConversations(30, 0, token);
        setConversations(list.items || []);
      } catch (err) {
        console.warn("Could not load user conversations:", err);
      }
    }
    loadUserConversations();
  }, [token]);

  // Scroll on new messages
  useEffect(() => {
    if (activeConversation?.messages?.length) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);

  // Handle starting a new conversation
  const handleStartNewConversation = () => {
    setActiveConversation(null);
    setErrorMsg(null);
  };

  // Select an existing conversation from history
  const handleSelectConversation = async (conversationId: string) => {
    setErrorMsg(null);
    try {
      const detail = await fetchConversation(conversationId, token);
      setActiveConversation(detail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load conversation";
      setErrorMsg(msg);
    }
  };

  // Rename a conversation
  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const updated = await updateConversation(conversationId, { title: newTitle }, token);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: updated.title } : c))
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation((prev) => (prev ? { ...prev, title: updated.title } : null));
      }
    } catch (err: unknown) {
      console.error("Failed to rename conversation:", err);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId, token);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    } catch (err: unknown) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Send a message (creates conversation if not active)
  const handleSendMessage = async (
    content: string,
    attachmentUrl?: string,
    includeHardware = includeHardwareContext
  ) => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      let currentConvoId = activeConversation?.id;

      // 1. If no active conversation, create one first
      if (!currentConvoId) {
        const titleSnippet = content.slice(0, 45) + (content.length > 45 ? "..." : "");
        const newConvo = await createConversation(
          {
            title: titleSnippet || "Diagnostic Session",
            initial_query: content,
            include_hardware_context: includeHardware,
          },
          token
        );
        currentConvoId = newConvo.id;
        setActiveConversation(newConvo);

        // Prepend to conversation history if logged in
        if (token) {
          setConversations((prev) => [
            {
              id: newConvo.id,
              user_id: newConvo.user_id,
              title: newConvo.title,
              category: newConvo.category,
              message_count: newConvo.message_count,
              last_message_at: newConvo.last_message_at,
              created_at: newConvo.created_at,
              updated_at: newConvo.updated_at,
            },
            ...prev,
          ]);
        }
        return;
      }

      // 2. If conversation exists, add player message optimistically
      const optimisticPlayerMsg: AIMessageItem = {
        id: `temp-player-${Date.now()}`,
        conversation_id: currentConvoId,
        role: "player",
        content,
        attachment_url: attachmentUrl || null,
        hardware_context_attached: includeHardware,
        hardware_summary: primaryProfile
          ? `${primaryProfile.cpu_model} / ${primaryProfile.gpu_model} / ${primaryProfile.ram_gb}GB`
          : null,
        created_at: new Date().toISOString(),
      };

      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, optimisticPlayerMsg],
            }
          : null
      );

      // 3. Send message to backend and get assistant response
      const assistantMsg = await sendMessage(
        currentConvoId,
        {
          content,
          attachment_url: attachmentUrl,
          include_hardware_context: includeHardware,
        },
        token
      );

      // 4. Update state with actual assistant message
      setActiveConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, assistantMsg],
              last_message_at: assistantMsg.created_at,
              message_count: prev.messages.length + 1,
            }
          : null
      );

      // Update sidebar preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvoId
            ? {
                ...c,
                last_message_at: assistantMsg.created_at,
                message_count: c.message_count + 2,
              }
            : c
        )
      );
    } catch (err: unknown) {
      console.error("Message send failure:", err);
      const msg = err instanceof Error ? err.message : "Failed to process diagnostic query. Please retry.";
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload screenshot
  const handleUploadScreenshot = async (file: File): Promise<string> => {
    const res = await uploadScreenshotAttachment(file);
    return res.attachment_url;
  };

  // Handle feedback (helpful / not helpful)
  const handleFeedback = async (
    messageId: string,
    rating: "helpful" | "not_helpful" | "reported",
    reportReason?: string
  ) => {
    if (!activeConversation) return;

    try {
      await submitResponseFeedback(
        {
          message_id: messageId,
          conversation_id: activeConversation.id,
          rating,
          report_reason: reportReason,
        },
        token
      );

      // Update message feedback locally
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, feedback_rating: rating === "reported" ? m.feedback_rating : rating } : m
          ),
        };
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  // Open report modal
  const handleOpenReportModal = (messageId: string) => {
    setReportTargetMessageId(messageId);
    setIsReportModalOpen(true);
  };

  // Submit report modal
  const handleSubmitReport = async (data: {
    rating: "helpful" | "not_helpful" | "reported";
    report_reason?: string;
    comments?: string;
  }) => {
    if (!reportTargetMessageId || !activeConversation) return;
    try {
      await submitResponseFeedback(
        {
          message_id: reportTargetMessageId,
          conversation_id: activeConversation.id,
          rating: "reported",
          report_reason: data.report_reason,
          comments: data.comments,
        },
        token
      );
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  };

  // Click on a sample query from category cards
  const handleSelectSampleQuery = (query: string, categoryId: string) => {
    if (categoryId) {
      // Diagnostic category context acknowledged
    }
    handleSendMessage(query, undefined, includeHardwareContext);
  };

  // Retry last player query
  const handleRetryLastMessage = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const playerMessages = activeConversation.messages.filter((m) => m.role === "player");
    if (playerMessages.length > 0) {
      const lastMsg = playerMessages[playerMessages.length - 1];
      handleSendMessage(lastMsg.content, lastMsg.attachment_url || undefined, lastMsg.hardware_context_attached);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <ProblemSolverHeader
        status={status}
        loading={loadingInitial}
        onStartNewConversation={handleStartNewConversation}
        onToggleHistory={() => setSidebarOpen((prev) => !prev)}
        onScrollToCategories={() => {
          document.getElementById("suggested-categories-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        hasActiveConversation={!!activeConversation}
      />

      {/* Main Layout: Conversation Sidebar + Diagnostic Window */}
      <div className="flex gap-6 items-start relative">
        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleStartNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          isAuthenticated={isAuthenticated}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Diagnostic Workspace */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {/* Active Conversation or Welcome Session */}
          <div className="rounded-2xl border border-[#1e2330] bg-[#0b0d14] flex flex-col min-h-[520px] shadow-2xl relative overflow-hidden">
            {/* Ambient Background subtle glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Conversation Window Header */}
            <div className="px-5 py-3.5 border-b border-[#181d2a] flex flex-wrap items-center justify-between gap-3 bg-[#0d1018]/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-white truncate max-w-md">
                  {activeConversation ? activeConversation.title : "New Diagnostic Session"}
                </h2>
              </div>

              {activeConversation && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {activeConversation.messages.length} messages
                  </span>
                  <button
                    onClick={handleRetryLastMessage}
                    disabled={isGenerating}
                    className="p-1 text-slate-400 hover:text-orange-400 transition-colors"
                    title="Retry / Regenerate response"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[600px] custom-scrollbar">
              {/* If no conversation active, show welcome onboarding bubble */}
              {!activeConversation || activeConversation.messages.length === 0 ? (
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0 shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-5 rounded-2xl bg-[#121624] border border-[#20273a] text-slate-300 text-xs sm:text-sm space-y-3 shadow-lg">
                      <h3 className="font-extrabold text-white text-base">
                        Welcome to the AI Gaming Problem Solver
                      </h3>
                      <p className="leading-relaxed">
                        I am your dedicated technical troubleshooting assistant. I can diagnose PC gaming crashes, DirectX 12 errors, low FPS stutters, driver conflicts, and controller mapping issues.
                      </p>
                      <div className="p-3 rounded-xl bg-[#0c0e17] border border-[#1c2233] text-xs space-y-1 text-slate-300">
                        <span className="font-semibold text-orange-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>5-Part Structured Troubleshooting Standard:</span>
                        </span>
                        <p className="text-[11px] text-slate-400 leading-normal pl-5">
                          Every resolution follows: 1) Problem Understanding, 2) Possible Causes, 3) Recommended Steps (safe and reversible), 4) Expected Result, and 5) Next Step.
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1a2133]">
                        💡 Choose a suggested problem below, attach an error screenshot, or type your issue in the box below to start!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeConversation.messages.map((msg) => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      onFeedback={handleFeedback}
                      onOpenReportModal={handleOpenReportModal}
                    />
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3 rounded-xl bg-[#121624] border border-[#20273a] text-xs text-slate-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                        <span>Diagnosing error and compiling step-by-step checklist...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryLastMessage}
                    className="text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/20 py-0.5 px-2"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Input Box Footer */}
            <div className="p-4 border-t border-[#181d2a] bg-[#0c0e16]/95">
              <ChatInputArea
                onSendMessage={handleSendMessage}
                onUploadScreenshot={handleUploadScreenshot}
                onOpenHardwareConsentModal={() => setIsConsentModalOpen(true)}
                isGenerating={isGenerating}
                hasHardwareProfile={!!primaryProfile}
                hardwareProfileSummary={
                  primaryProfile
                    ? `${primaryProfile.cpu_model} / ${primaryProfile.gpu_model} (${primaryProfile.gpu_vram_gb}GB)`
                    : null
                }
                includeHardwareContext={includeHardwareContext}
                setIncludeHardwareContext={setIncludeHardwareContext}
              />
            </div>
          </div>

          {/* 8 Suggested Troubleshooting Categories Grid */}
          <SuggestedProblemCategories
            categories={categories}
            onSelectQuery={handleSelectSampleQuery}
          />
        </div>
      </div>

      {/* Hardware Profile Sharing Consent Modal */}
      <HardwareContextConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirm={() => {
          setIncludeHardwareContext(true);
          setIsConsentModalOpen(false);
        }}
        profile={primaryProfile}
      />

      {/* Report AI Response Modal */}
      <FeedbackModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSubmitReport}
        initialRating="reported"
      />
    </div>
  );
}
