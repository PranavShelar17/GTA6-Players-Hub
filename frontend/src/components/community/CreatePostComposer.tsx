"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ImagePlus,
  BarChart2,
  X,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CommunityCategory,
  CreatePostPayload,
  createCommunityPost,
  uploadCommunityMedia,
} from "@/lib/communityApi";

interface CreatePostComposerProps {
  categories: CommunityCategory[];
  token: string;
}

export function CreatePostComposer({ categories, token }: CreatePostComposerProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories.length > 0 ? categories[0].id : ""
  );

  // Media state (up to 4 images)
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Poll state
  const [includePoll, setIncludePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowVoteChange, setAllowVoteChange] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaUrls.length + files.length > 4) {
      setError("Maximum 4 images allowed per community post.");
      return;
    }

    setIsUploadingMedia(true);
    setError(null);

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File '${file.name}' exceeds the 10MB limit.`);
        }
        const res = await uploadCommunityMedia(file, token);
        uploaded.push(res.media_url);
      }
      setMediaUrls([...mediaUrls, ...uploaded]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  // Poll option helpers
  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!content.trim() || content.length < 10) {
      setError("Content must be at least 10 characters.");
      return;
    }
    if (!categoryId) {
      setError("Please select a discussion category.");
      return;
    }

    let pollPayload = null;
    if (includePoll) {
      if (!pollQuestion.trim()) {
        setError("Please enter a question for the poll.");
        return;
      }
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError("Poll must have at least 2 non-empty options.");
        return;
      }
      pollPayload = {
        question: pollQuestion.trim(),
        allow_vote_change: allowVoteChange,
        options: validOptions,
      };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreatePostPayload = {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        media_urls: mediaUrls,
        poll: pollPayload,
      };

      const created = await createCommunityPost(payload, token);
      router.push(`/community/post/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create post.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full text-sm rounded-xl bg-slate-900 border border-slate-800 p-3 text-white focus:border-orange-500 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.description}
            </option>
          ))}
        </select>
      </div>

      {/* Post Title */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Post Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Leonida vehicle handling physics: What are your expectations?"
          maxLength={255}
          className="w-full text-sm font-semibold rounded-xl bg-slate-900 border border-slate-800 p-3.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Post Body Content */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Content
        </label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={10000}
            placeholder="Share your detailed analysis, questions, gameplay setup, or theories with the community..."
            className="w-full text-sm rounded-xl bg-slate-900 border border-slate-800 p-3.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-500">
            {content.length}/10000
          </div>
        </div>
      </div>

      {/* Media Uploads Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Image Attachments ({mediaUrls.length}/4)
          </label>
          <span className="text-[11px] text-slate-500">JPEG, PNG, WebP up to 10MB</span>
        </div>

        {/* Existing Previews */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group"
              >
                <Image src={url} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {mediaUrls.length < 4 && (
          <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-700 hover:border-orange-500/80 bg-slate-950/60 cursor-pointer text-xs text-slate-400 hover:text-white transition-all">
            <ImagePlus className="w-4 h-4 text-orange-400" />
            <span>{isUploadingMedia ? "Uploading image..." : "Add Images (up to 4)"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploadingMedia}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Community Poll Option */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Attach Community Poll
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIncludePoll(!includePoll)}
            className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
              includePoll
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {includePoll ? "Included" : "Add Poll"}
          </button>
        </div>

        {includePoll && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Poll Question
              </label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="e.g. Which platform will you play GTA 6 on at launch?"
                maxLength={255}
                className="w-full text-xs rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Options (2 to 10)
              </label>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    maxLength={255}
                    className="flex-1 text-xs rounded-xl bg-slate-900 border border-slate-700 p-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another option</span>
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={allowVoteChange}
                onChange={(e) => setAllowVoteChange(e.target.checked)}
                className="rounded border-slate-700 text-orange-500 focus:ring-0"
              />
              <span>Allow players to change their vote before poll closes</span>
            </label>
          </div>
        )}
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/community")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isUploadingMedia}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? "Publishing Post..." : "Publish to Community"}</span>
        </Button>
      </div>
    </form>
  );
}
