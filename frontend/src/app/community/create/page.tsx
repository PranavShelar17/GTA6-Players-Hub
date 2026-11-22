"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  CommunityCategory,
  fetchCommunityCategories,
} from "@/lib/communityApi";
import { CreatePostComposer } from "@/components/community/CreatePostComposer";

export default function CreatePostPage() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const token = session?.access_token;

  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    async function init() {
      const cats = await fetchCommunityCategories();
      setCategories(cats);
      setLoadingCats(false);
    }
    init();
  }, []);

  if (isLoading || loadingCats) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Loading composer...</p>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <MessageSquarePlus className="w-12 h-12 text-orange-400 mx-auto" />
        <h1 className="text-2xl font-black text-white">Sign In to Post</h1>
        <p className="text-sm text-slate-400">
          You must be logged in to your GTA 6 Player Hub account to publish discussions and polls.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link href="/community">
            <Button variant="secondary" size="md">
              Back to Community
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="primary" size="md">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/community">
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-slate-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel & Back</span>
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Discussion</span>
        </div>
        <h1 className="text-3xl font-black text-white">Create a Community Post</h1>
        <p className="text-sm text-slate-400 mt-1">
          Start a topic, ask questions, attach up to 4 images, or create an interactive poll.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <CreatePostComposer categories={categories} token={token} />
      </div>
    </div>
  );
}
