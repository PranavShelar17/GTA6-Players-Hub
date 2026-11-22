/**
 * GTA 6 Player Hub - Community API Client (Phase 7)
 * Interfaces with FastAPI Backend at /api/v1/community/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface CommunityAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  preferred_platform?: string | null;
  is_verified: boolean;
  reputation_score: number;
}

export interface CommunityCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CommunityPostMedia {
  id: string;
  media_url: string;
  media_type: string;
  file_size?: number | null;
  display_order: number;
}

export interface CommunityPollOption {
  id: string;
  option_text: string;
  display_order: number;
  vote_count: number;
  percentage: number;
}

export interface CommunityPoll {
  id: string;
  question: string;
  expires_at?: string | null;
  allow_vote_change: boolean;
  total_votes: number;
  is_expired: boolean;
  user_voted_option_id?: string | null;
  options: CommunityPollOption[];
}

export interface CommunityPostItem {
  id: string;
  title: string;
  content: string;
  post_status: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  category: CommunityCategory;
  author: CommunityAuthor;
  media: CommunityPostMedia[];
  poll?: CommunityPoll | null;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_author: boolean;
}

export type CommunityPostDetail = CommunityPostItem;

export interface CommunityCommentReply {
  id: string;
  post_id: string;
  parent_comment_id: string;
  content: string;
  comment_status: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author: CommunityAuthor;
  is_author: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  content: string;
  comment_status: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author: CommunityAuthor;
  is_author: boolean;
  replies: CommunityCommentReply[];
}

export interface CommunityPlayerProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  preferred_platform?: string | null;
  is_verified: boolean;
  reputation_score: number;
  created_at?: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_blocked: boolean;
  is_muted: boolean;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  category_id: string;
  media_urls?: string[];
  poll?: {
    question: string;
    expires_at?: string | null;
    allow_vote_change?: boolean;
    options: string[];
  } | null;
}

export interface CreateCommentPayload {
  content: string;
  parent_comment_id?: string | null;
}

export interface ReportPayload {
  target_type: "POST" | "COMMENT" | "PLAYER";
  target_id: string;
  reason: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
export async function fetchCommunityCategories(): Promise<CommunityCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/community/categories`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load community categories");
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Error fetching community categories:", err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Posts
// -----------------------------------------------------------------------------
export async function fetchCommunityPosts(
  params: {
    feed_type?: "latest" | "popular" | "following";
    category?: string;
    search?: string;
    player_id?: string;
    limit?: number;
    offset?: number;
  } = {},
  token?: string
): Promise<{ posts: CommunityPostItem[]; total: number }> {
  try {
    const url = new URL(`${API_BASE_URL}/community/posts`);
    if (params.feed_type) url.searchParams.set("feed_type", params.feed_type);
    if (params.category) url.searchParams.set("category", params.category);
    if (params.search) url.searchParams.set("search", params.search);
    if (params.player_id) url.searchParams.set("player_id", params.player_id);
    if (params.limit) url.searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) url.searchParams.set("offset", params.offset.toString());

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load community posts");
    const json = await res.json();
    return {
      posts: json.data || [],
      total: json.meta?.total ?? (json.data?.length || 0),
    };
  } catch (err) {
    console.error("Error fetching community posts:", err);
    return { posts: [], total: 0 };
  }
}

export async function fetchPostDetail(postId: string, token?: string): Promise<CommunityPostDetail> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Community post '${postId}' not found`);
  const json = await res.json();
  return json.data;
}

export async function createCommunityPost(
  payload: CreatePostPayload,
  token: string
): Promise<CommunityPostDetail> {
  const res = await fetch(`${API_BASE_URL}/community/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Failed to create community post");
  }
  const json = await res.json();
  return json.data;
}

export async function updateCommunityPost(
  postId: string,
  payload: { title?: string; content?: string; category_id?: string },
  token: string
): Promise<CommunityPostDetail> {
  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update post");
  const json = await res.json();
  return json.data;
}

export async function deleteCommunityPost(postId: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete post");
  return true;
}

// -----------------------------------------------------------------------------
// Media Upload
// -----------------------------------------------------------------------------
export async function uploadCommunityMedia(
  file: File,
  token: string
): Promise<{ media_url: string; file_size: number; media_type: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/community/media/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail || "Failed to upload image. Must be JPEG, PNG, or WebP under 10MB.");
  }
  const json = await res.json();
  return json.data;
}

// -----------------------------------------------------------------------------
// Likes & Bookmarks
// -----------------------------------------------------------------------------
export async function toggleLikePost(
  postId: string,
  token: string
): Promise<{ is_liked: boolean; likes_count: number }> {
  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to toggle like");
  const json = await res.json();
  return json.data;
}

export async function toggleBookmarkPost(
  postId: string,
  token: string
): Promise<{ is_bookmarked: boolean }> {
  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/bookmark`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to toggle bookmark");
  const json = await res.json();
  return json.data;
}

export async function fetchUserBookmarks(
  token: string,
  limit = 20,
  offset = 0
): Promise<{ posts: CommunityPostItem[]; total: number }> {
  const res = await fetch(
    `${API_BASE_URL}/community/bookmarks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  const json = await res.json();
  return {
    posts: json.data || [],
    total: json.meta?.total ?? (json.data?.length || 0),
  };
}

// -----------------------------------------------------------------------------
// Comments
// -----------------------------------------------------------------------------
export async function fetchPostComments(
  postId: string,
  token?: string
): Promise<CommunityComment[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  const json = await res.json();
  return json.data || [];
}

export async function addPostComment(
  postId: string,
  payload: CreateCommentPayload,
  token: string
): Promise<CommunityComment> {
  const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  const json = await res.json();
  return json.data;
}

export async function updateComment(
  commentId: string,
  content: string,
  token: string
): Promise<CommunityComment> {
  const res = await fetch(`${API_BASE_URL}/community/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update comment");
  const json = await res.json();
  return json.data;
}

export async function deleteComment(commentId: string, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/community/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete comment");
  return true;
}

// -----------------------------------------------------------------------------
// Polls
// -----------------------------------------------------------------------------
export async function voteInPoll(
  pollId: string,
  optionId: string,
  token: string
): Promise<CommunityPoll> {
  const res = await fetch(`${API_BASE_URL}/community/polls/${pollId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ option_id: optionId }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail || "Failed to submit poll vote");
  }
  const json = await res.json();
  return json.data;
}

// -----------------------------------------------------------------------------
// Profiles, Follows, Moderation
// -----------------------------------------------------------------------------
export async function fetchPlayerCommunityProfile(
  username: string,
  token?: string
): Promise<CommunityPlayerProfile> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/community/player/${username}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Player '@${username}' not found`);
  const json = await res.json();
  return json.data;
}

export async function toggleFollowPlayer(
  playerId: string,
  token: string
): Promise<{ is_following: boolean; followers_count: number }> {
  const res = await fetch(`${API_BASE_URL}/community/player/${playerId}/follow`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to update follow status");
  const json = await res.json();
  return json.data;
}

export async function toggleBlockPlayer(
  playerId: string,
  token: string
): Promise<{ is_blocked: boolean }> {
  const res = await fetch(`${API_BASE_URL}/community/player/${playerId}/block`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to update block status");
  const json = await res.json();
  return json.data;
}

export async function toggleMutePlayer(
  playerId: string,
  token: string
): Promise<{ is_muted: boolean }> {
  const res = await fetch(`${API_BASE_URL}/community/player/${playerId}/mute`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to update mute status");
  const json = await res.json();
  return json.data;
}

export async function reportCommunityContent(
  payload: ReportPayload,
  token: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/community/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit moderation report");
  return true;
}
