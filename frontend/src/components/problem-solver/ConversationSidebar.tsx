"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  PlusCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AIConversationItem } from "@/lib/problemSolverApi";

interface ConversationSidebarProps {
  conversations: AIConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isAuthenticated,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered by search term
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(term));
  }, [conversations, searchTerm]);

  // Group conversations: Today, Previous 7 Days, Older
  const grouped = useMemo(() => {
    const today: AIConversationItem[] = [];
    const pastWeek: AIConversationItem[] = [];
    const older: AIConversationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    for (const c of filtered) {
      const time = new Date(c.last_message_at || c.created_at).getTime();
      if (time >= startOfToday) {
        today.push(c);
      } else if (time >= sevenDaysAgo) {
        pastWeek.push(c);
      } else {
        older.push(c);
      }
    }

    return { today, pastWeek, older };
  }, [filtered]);

  const handleStartRename = (c: AIConversationItem) => {
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = async (id: string) => {
    if (editingTitle.trim()) {
      await onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteConversation(id);
    } finally {
      setDeletingId(null);
    }
  };

  const renderGroup = (title: string, items: AIConversationItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 mb-1">
          {title} ({items.length})
        </div>
        <div className="space-y-1">
          {items.map((c) => {
            const isActive = c.id === activeConversationId;
            const isEditing = c.id === editingId;

            return (
              <div
                key={c.id}
                className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-[#1f283d] text-white font-medium border border-orange-500/30"
                    : "text-slate-300 hover:bg-[#161a29] hover:text-white"
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full bg-[#0f121d] border border-orange-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(c.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveRename(c.id)}
                      className="p-1 hover:text-emerald-400 text-slate-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:text-rose-400 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelectConversation(c.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="flex items-center gap-2 truncate text-left w-full mr-2 cursor-pointer"
                    >
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-orange-400" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{c.title}</span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartRename(c)}
                        title="Rename conversation"
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        title="Delete conversation"
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#0d1017] border-r border-[#1a2030] p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Top Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Conversation History</h3>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Conversation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full mb-3 gap-2 text-xs border-[#252c40] bg-[#121624] text-slate-200 hover:text-white hover:bg-[#1a2136]"
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>New Diagnostic Session</span>
          </Button>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#121624] border border-[#202738] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Grouped Lists */}
          <div className="overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p>No previous conversations.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Start a troubleshooting session above!
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No conversations match &quot;{searchTerm}&quot;
              </div>
            ) : (
              <>
                {renderGroup("Today", grouped.today)}
                {renderGroup("Previous 7 Days", grouped.pastWeek)}
                {renderGroup("Older", grouped.older)}
              </>
            )}
          </div>
        </div>

        {/* Footer info: Auth status */}
        <div className="pt-3 border-t border-[#1a2030] text-xs">
          {!isAuthenticated ? (
            <div className="p-3 rounded-lg bg-[#141824] border border-[#20273c] space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Guest Session</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Sign in to save and sync your diagnostic history across devices.
              </p>
              <Link href="/login" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs py-1">
                  Sign In / Register
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
              <span>Cloud Sync Active</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
