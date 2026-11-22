"use client";

import React, { useState } from "react";
import { BarChart2, CheckCircle2, Clock } from "lucide-react";
import { CommunityPoll, voteInPoll } from "@/lib/communityApi";

interface CommunityPollProps {
  poll: CommunityPoll;
  token?: string;
  onVoteUpdated?: (updatedPoll: CommunityPoll) => void;
}

export function CommunityPollComponent({ poll, token, onVoteUpdated }: CommunityPollProps) {
  const [currentPoll, setCurrentPoll] = useState<CommunityPoll>(poll);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    poll.user_voted_option_id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasVoted = Boolean(currentPoll.user_voted_option_id);
  const showResults = hasVoted || currentPoll.is_expired;

  const handleVote = async (optionId: string) => {
    if (!token) {
      setError("Please sign in to vote in community polls.");
      return;
    }
    if (currentPoll.is_expired) {
      setError("This poll has ended.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await voteInPoll(currentPoll.id, optionId, token);
      setCurrentPoll(updated);
      setSelectedOptionId(optionId);
      if (onVoteUpdated) onVoteUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register vote.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span>Community Poll</span>
        </div>
        {currentPoll.is_expired ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Closed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
        {currentPoll.question}
      </h4>

      {error && (
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300">
          {error}
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2 pt-1">
        {currentPoll.options.map((opt) => {
          const isSelected = currentPoll.user_voted_option_id === opt.id;

          if (showResults) {
            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-xl border p-2.5 transition-all ${
                  isSelected
                    ? "border-orange-500/80 bg-orange-950/20"
                    : "border-slate-800/80 bg-slate-900/60"
                }`}
              >
                {/* Percentage progress bar fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected ? "bg-orange-500/25" : "bg-slate-700/25"
                  }`}
                  style={{ width: `${opt.percentage}%` }}
                />

                <div className="relative flex items-center justify-between text-xs z-10">
                  <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                    <span className="truncate">{opt.option_text}</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 ml-2">
                    <span className="text-slate-400">{opt.vote_count} votes</span>
                    <span className="font-bold text-white">{opt.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isSubmitting}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                selectedOptionId === opt.id
                  ? "border-orange-500 bg-orange-950/30 text-white"
                  : "border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-600 hover:bg-slate-900"
              }`}
            >
              <span>{opt.option_text}</span>
              <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                {selectedOptionId === opt.id && <span className="w-2 h-2 rounded-full bg-orange-500" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
        <span>{currentPoll.total_votes} total votes</span>
        {currentPoll.allow_vote_change && hasVoted && !currentPoll.is_expired && (
          <span className="text-orange-400/80">Vote change allowed</span>
        )}
      </div>
    </div>
  );
}
