"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, CornerDownRight, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CommunityComment,
  CommunityCommentReply,
  addPostComment,
  deleteComment,
} from "@/lib/communityApi";

interface CommentSectionProps {
  postId: string;
  initialComments: CommunityComment[];
  token?: string;
  onCommentsUpdated?: () => void;
}

export function CommentSection({
  postId,
  initialComments,
  token,
  onCommentsUpdated,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommunityComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add top-level comment
  const handleAddTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please sign in to join the conversation.");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const added = await addPostComment(
        postId,
        { content: newComment.trim() },
        token
      );
      setComments([added, ...comments]);
      setNewComment("");
      if (onCommentsUpdated) onCommentsUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async (parentCommentId: string) => {
    if (!token) {
      setError("Please sign in to reply.");
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const added = await addPostComment(
        postId,
        { content: replyContent.trim(), parent_comment_id: parentCommentId },
        token
      );

      // Append reply to matching parent
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: [...c.replies, added as unknown as CommunityCommentReply],
            };
          }
          return c;
        })
      );
      setReplyingToId(null);
      setReplyContent("");
      if (onCommentsUpdated) onCommentsUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!token || !confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId, token);
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies.filter((r) => r.id !== commentId),
          }))
      );
      if (onCommentsUpdated) onCommentsUpdated();
    } catch (err) {
      alert("Failed to delete comment: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-base font-bold text-white border-b border-slate-800 pb-3">
        <MessageSquare className="w-5 h-5 text-orange-400" />
        <span>Discussion ({comments.length})</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* New Top-Level Comment Composer */}
      {token ? (
        <form onSubmit={handleAddTopComment} className="space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion... Share theories, answers, or insights."
              rows={3}
              maxLength={2000}
              className="w-full text-xs sm:text-sm rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
            <div className="absolute bottom-3 right-3 text-[11px] text-slate-500">
              {newComment.length}/2000
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Posting..." : "Post Comment"}</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          <Link href="/auth/login" className="text-orange-400 font-bold hover:underline">
            Sign in
          </Link>{" "}
          to post comments and join player discussions.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3"
            >
              {/* Comment Author Header */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/community/player/${comment.author.username}`}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {comment.author.avatar_url ? (
                      <Image
                        src={comment.author.avatar_url}
                        alt={comment.author.display_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>{comment.author.display_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white group-hover:text-orange-400 transition-colors">
                      {comment.author.display_name}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      @{comment.author.username}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {comment.is_author && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line pl-9">
                {comment.content}
              </p>

              {/* Reply Trigger */}
              <div className="pl-9 flex items-center gap-3 text-xs">
                {token && (
                  <button
                    onClick={() =>
                      setReplyingToId(replyingToId === comment.id ? null : comment.id)
                    }
                    className="flex items-center gap-1 text-slate-400 hover:text-orange-400 transition-colors font-medium text-[11px]"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>{replyingToId === comment.id ? "Cancel" : "Reply"}</span>
                  </button>
                )}
              </div>

              {/* Inline Reply Composer */}
              {replyingToId === comment.id && (
                <div className="pl-9 mt-2 space-y-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to @${comment.author.username}...`}
                    rows={2}
                    className="w-full text-xs rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReplyingToId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting || !replyContent.trim()}
                      onClick={() => handleAddReply(comment.id)}
                    >
                      {isSubmitting ? "Replying..." : "Post Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Nested Replies List */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-9 pt-2 space-y-2 border-l-2 border-slate-800 ml-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/community/player/${reply.author.username}`}
                          className="font-bold text-white hover:text-orange-400 transition-colors"
                        >
                          {reply.author.display_name}{" "}
                          <span className="text-[11px] text-slate-500 font-normal">
                            @{reply.author.username}
                          </span>
                        </Link>
                        {reply.is_author && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-line">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
