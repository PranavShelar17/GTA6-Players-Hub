import { fetchFromApi } from "./api";

export interface NewsSource {
  id: string;
  name: string;
  website_url: string;
  source_type: string;
  trust_level: string;
  is_enabled: boolean;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  articles_count: number;
}

export interface NewsArticleItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  source_id?: string | null;
  source_name: string;
  source_url: string;
  original_article_url: string;
  canonical_url: string;
  verification_status: "OFFICIAL" | "VERIFIED" | "RUMOUR" | "UNCONFIRMED";
  publication_status: string;
  original_published_at: string;
  is_featured: boolean;
  read_time_minutes: number;
  is_bookmarked: boolean;
}

export interface NewsArticleDetail extends NewsArticleItem {
  content: string;
  related_articles: NewsArticleItem[];
}

export interface NewsListResponse {
  items: NewsArticleItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

export interface NewsStats {
  total_articles: number;
  official_count: number;
  verified_count: number;
  rumour_count: number;
  unconfirmed_count: number;
  last_updated?: string | null;
}

export interface NewsBookmarkItem {
  bookmark_id: string;
  article: NewsArticleItem;
  created_at: string;
}

export interface NewsQueryOptions {
  q?: string;
  category?: string;
  source_id?: string;
  verification_status?: string;
  sort?: "latest" | "oldest" | "featured";
  page?: number;
  page_size?: number;
}

// Resilient Fallback Data for Offline Development / SSR Resilience
export const FALLBACK_NEWS_ARTICLES: NewsArticleItem[] = [
  {
    id: "fb-1",
    title: "Take-Two Interactive Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
    slug: "take-two-reconfirms-gta6-fall-2025",
    summary: "In corporate financial remarks and shareholder presentations, publisher Take-Two Interactive reconfirmed that Rockstar Games' schedule for Grand Theft Auto VI remains on track for Fall 2025 across PlayStation 5 and Xbox Series X/S.",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
    category_name: "Official Rockstar Announcements",
    category_slug: "official-announcements",
    source_name: "Take-Two Interactive IR",
    source_url: "https://www.take2games.com/ir",
    original_article_url: "https://www.take2games.com/ir",
    canonical_url: "https://www.take2games.com/ir/news/gta6-fall-2025-status",
    verification_status: "OFFICIAL",
    publication_status: "PUBLISHED",
    original_published_at: "2026-11-15T18:00:00Z",
    is_featured: true,
    read_time_minutes: 3,
    is_bookmarked: false,
  },
  {
    id: "fb-2",
    title: "PlayStation 5 Pro Technical Breakdown: PSSR Machine Learning & Enhanced Ray Tracing",
    slug: "ps5-pro-technical-breakdown-pssr-ray-tracing",
    summary: "Technical analysis examines PlayStation Spectral Super Resolution (PSSR) upscaling and hardware-accelerated ray tracing designed for massive open-world rendering in next-generation titles.",
    image_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1200",
    category_name: "Game Development Updates",
    category_slug: "development-updates",
    source_name: "Digital Foundry",
    source_url: "https://www.eurogamer.net/digitalfoundry",
    original_article_url: "https://www.eurogamer.net/digitalfoundry",
    canonical_url: "https://www.eurogamer.net/digitalfoundry/ps5-pro-next-gen-open-world-tech",
    verification_status: "VERIFIED",
    publication_status: "PUBLISHED",
    original_published_at: "2026-11-10T14:30:00Z",
    is_featured: false,
    read_time_minutes: 5,
    is_bookmarked: false,
  },
  {
    id: "fb-3",
    title: "Vice City Geography Analysis: Leonida State Boundaries and Everglades Scale",
    slug: "vice-city-geography-analysis-leonida-everglades",
    summary: "Geographical comparison explores the scale of the state of Leonida, mapping urban Vice City districts, marshland wetlands, and dynamic wildlife ecosystems.",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
    category_name: "Vice City & Leonida Map",
    category_slug: "map-locations",
    source_name: "IGN Gaming",
    source_url: "https://www.ign.com",
    original_article_url: "https://www.ign.com",
    canonical_url: "https://www.ign.com/articles/gta6-vice-city-leonida-map-breakdown",
    verification_status: "VERIFIED",
    publication_status: "PUBLISHED",
    original_published_at: "2026-11-08T11:15:00Z",
    is_featured: false,
    read_time_minutes: 4,
    is_bookmarked: false,
  },
  {
    id: "fb-4",
    title: "Historical PC Launch Windows for Rockstar Flagships: Analyzing GTA V and RDR 2 Cadences",
    slug: "historical-pc-launch-windows-rockstar-cadence",
    summary: "Industry analysis examines previous PC release cadences for Rockstar titles. Official PC requirements and availability remain unconfirmed.",
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200",
    category_name: "Gaming Industry News",
    category_slug: "industry-news",
    source_name: "GameSpot",
    source_url: "https://www.gamespot.com",
    original_article_url: "https://www.gamespot.com",
    canonical_url: "https://www.gamespot.com/articles/gta6-pc-release-window-historical-analysis",
    verification_status: "UNCONFIRMED",
    publication_status: "PUBLISHED",
    original_published_at: "2026-11-05T09:00:00Z",
    is_featured: false,
    read_time_minutes: 4,
    is_bookmarked: false,
  },
  {
    id: "fb-5",
    title: "Dual-Protagonist Dynamic and Narrative Systems in Next-Gen Storytelling",
    slug: "dual-protagonist-dynamic-narrative-systems",
    summary: "Exploration of the character relationship between Lucia and Jason, examining modern narrative crime dynamics and cooperative mission structures.",
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200",
    category_name: "Characters & Story",
    category_slug: "characters-story",
    source_name: "PlayStation Blog",
    source_url: "https://blog.playstation.com",
    original_article_url: "https://blog.playstation.com",
    canonical_url: "https://blog.playstation.com/2026/11/02/gta6-narrative-lucia-jason-analysis",
    verification_status: "VERIFIED",
    publication_status: "PUBLISHED",
    original_published_at: "2026-11-02T16:45:00Z",
    is_featured: false,
    read_time_minutes: 4,
    is_bookmarked: false,
  },
  {
    id: "fb-6",
    title: "Speculative Engine Physics: Water Simulation and Dynamic Weather Systems in RAGE 9",
    slug: "speculative-engine-physics-rage-9-water-simulation",
    summary: "Community investigation examines proprietary patents and visual clues regarding advanced fluid simulation and hurricane weather mechanics.",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200",
    category_name: "Rumours & Speculation",
    category_slug: "rumours-speculation",
    source_name: "Digital Foundry",
    source_url: "https://www.eurogamer.net/digitalfoundry",
    original_article_url: "https://www.eurogamer.net/digitalfoundry",
    canonical_url: "https://www.eurogamer.net/digitalfoundry/rage9-fluid-dynamics-investigation",
    verification_status: "RUMOUR",
    publication_status: "PUBLISHED",
    original_published_at: "2026-10-28T12:00:00Z",
    is_featured: false,
    read_time_minutes: 5,
    is_bookmarked: false,
  },
];

export const FALLBACK_CATEGORIES: NewsCategory[] = [
  { id: "c1", name: "Official Rockstar Announcements", slug: "official-announcements", is_active: true, articles_count: 1 },
  { id: "c2", name: "Game Development Updates", slug: "development-updates", is_active: true, articles_count: 1 },
  { id: "c3", name: "GTA 6 Gameplay & Features", slug: "gameplay-mechanics", is_active: true, articles_count: 0 },
  { id: "c4", name: "Characters & Story", slug: "characters-story", is_active: true, articles_count: 1 },
  { id: "c5", name: "Vehicles & Weapons", slug: "vehicles-weapons", is_active: true, articles_count: 0 },
  { id: "c6", name: "Vice City & Leonida Map", slug: "map-locations", is_active: true, articles_count: 1 },
  { id: "c7", name: "Gaming Industry News", slug: "industry-news", is_active: true, articles_count: 1 },
  { id: "c8", name: "Rumours & Speculation", slug: "rumours-speculation", is_active: true, articles_count: 1 },
];

export async function fetchNewsList(
  options: NewsQueryOptions = {},
  token?: string | null
): Promise<{ data: NewsListResponse; isFallback: boolean }> {
  const query = new URLSearchParams();
  if (options.q) query.append("q", options.q);
  if (options.category) query.append("category", options.category);
  if (options.source_id) query.append("source_id", options.source_id);
  if (options.verification_status) query.append("verification_status", options.verification_status);
  if (options.sort) query.append("sort", options.sort);
  if (options.page) query.append("page", options.page.toString());
  if (options.page_size) query.append("page_size", options.page_size.toString());

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const endpoint = `/news${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetchFromApi<NewsListResponse>(endpoint, { headers });

  if (res.success && res.data) {
    return { data: res.data, isFallback: false };
  }

  // Filter fallback data client-side if offline
  let filtered = [...FALLBACK_NEWS_ARTICLES];
  if (options.q) {
    const qLower = options.q.toLowerCase();
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(qLower) || a.summary.toLowerCase().includes(qLower)
    );
  }
  if (options.category) {
    filtered = filtered.filter((a) => a.category_slug === options.category);
  }
  if (options.verification_status) {
    filtered = filtered.filter((a) => a.verification_status === options.verification_status);
  }

  const page = options.page || 1;
  const pageSize = options.page_size || 10;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: {
      items: paginated,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      has_more: page < totalPages,
    },
    isFallback: true,
  };
}

export async function fetchFeaturedNews(token?: string | null): Promise<NewsArticleItem | null> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchFromApi<NewsArticleItem>("/news/featured", { headers });
  if (res.success && res.data) {
    return res.data;
  }
  return FALLBACK_NEWS_ARTICLES.find((a) => a.is_featured) || FALLBACK_NEWS_ARTICLES[0];
}

export async function fetchNewsCategories(): Promise<NewsCategory[]> {
  const res = await fetchFromApi<NewsCategory[]>("/news/categories");
  if (res.success && res.data) {
    return res.data;
  }
  return FALLBACK_CATEGORIES;
}

export async function fetchNewsSources(): Promise<NewsSource[]> {
  const res = await fetchFromApi<NewsSource[]>("/news/sources");
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

export async function fetchNewsStats(): Promise<NewsStats> {
  const res = await fetchFromApi<NewsStats>("/news/stats");
  if (res.success && res.data) {
    return res.data;
  }
  return {
    total_articles: FALLBACK_NEWS_ARTICLES.length,
    official_count: FALLBACK_NEWS_ARTICLES.filter((a) => a.verification_status === "OFFICIAL").length,
    verified_count: FALLBACK_NEWS_ARTICLES.filter((a) => a.verification_status === "VERIFIED").length,
    rumour_count: FALLBACK_NEWS_ARTICLES.filter((a) => a.verification_status === "RUMOUR").length,
    unconfirmed_count: FALLBACK_NEWS_ARTICLES.filter((a) => a.verification_status === "UNCONFIRMED").length,
    last_updated: new Date().toISOString(),
  };
}

export async function fetchNewsDetail(
  slug: string,
  token?: string | null
): Promise<NewsArticleDetail | null> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchFromApi<NewsArticleDetail>(`/news/${slug}`, { headers });
  if (res.success && res.data) {
    return res.data;
  }

  const fallback = FALLBACK_NEWS_ARTICLES.find((a) => a.slug === slug);
  if (!fallback) return null;

  return {
    ...fallback,
    content: `Detailed report on ${fallback.title}.\n\nThis article provides structured intelligence regarding Grand Theft Auto VI developments based on authorized statements and verified media publications.`,
    related_articles: FALLBACK_NEWS_ARTICLES.filter((a) => a.id !== fallback.id).slice(0, 3),
  };
}

export async function fetchPlayerBookmarks(token: string): Promise<NewsBookmarkItem[]> {
  const res = await fetchFromApi<NewsBookmarkItem[]>("/news/bookmarks", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

export async function toggleBookmark(
  articleId: string,
  isCurrentlyBookmarked: boolean,
  token: string
): Promise<{ success: boolean; is_bookmarked: boolean; error?: string }> {
  const method = isCurrentlyBookmarked ? "DELETE" : "POST";
  const res = await fetchFromApi<{ article_id: string; is_bookmarked: boolean }>(
    `/news/${articleId}/bookmark`,
    {
      method,
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.success && res.data) {
    return { success: true, is_bookmarked: res.data.is_bookmarked };
  }
  return {
    success: false,
    is_bookmarked: isCurrentlyBookmarked,
    error: res.error?.message || "Failed to update bookmark.",
  };
}
