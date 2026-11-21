import { fetchFromApi, ApiResponse } from "./api";

export interface HomeNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  verification_status: "OFFICIAL" | "VERIFIED" | "RUMOUR" | "UNCONFIRMED";
  category: string;
  thumbnail_url?: string | null;
}

export interface HomeDealItem {
  id: string;
  edition_name: string;
  platform: string;
  country_code: string;
  current_price: number;
  currency: string;
  original_price?: number | null;
  discount_percentage: number;
  retailer_name: string;
  product_url: string;
  last_checked_at: string;
  is_preorder: boolean;
}

export interface HomeEventItem {
  id: string;
  event_name: string;
  category: string;
  date_string: string;
  start_time_iso: string;
  timezone: string;
  description: string;
  is_official: boolean;
}

export interface HomeCommunityHighlight {
  id: string;
  title: string;
  author_username: string;
  author_avatar_url?: string | null;
  author_platform: string;
  category: string;
  published_at: string;
  replies_count: number;
  likes_count: number;
}

export interface HomeAggregatedResponse {
  news: HomeNewsItem[];
  deals: HomeDealItem[];
  events: HomeEventItem[];
  community: HomeCommunityHighlight[];
  disclaimer: string;
}

export const FALLBACK_HOME_DATA: HomeAggregatedResponse = {
  news: [
    {
      id: "news-fallback-1",
      title: "Take-Two Reconfirms Grand Theft Auto VI Fall 2025 Release Window",
      slug: "take-two-reconfirms-gta6-fall-2025",
      summary: "During corporate earnings remarks, Take-Two Interactive affirmed that Rockstar Games remains on schedule for launch across PS5 and Xbox Series X/S in Fall 2025.",
      source_name: "Rockstar Newswire / Take-Two",
      source_url: "https://www.rockstargames.com/newswire",
      published_at: "2026-11-15T18:00:00Z",
      verification_status: "OFFICIAL",
      category: "Official Announcement",
      thumbnail_url: null,
    },
    {
      id: "news-fallback-2",
      title: "PlayStation 5 Pro Hardware Enhancements for Next-Gen Open World Titles",
      slug: "ps5-pro-hardware-enhancements-gta6",
      summary: "Technical breakdown explores PlayStation Spectral Super Resolution (PSSR) machine learning upscaler and enhanced ray-tracing capabilities built for Leonida scale rendering.",
      source_name: "PlayStation Blog / Digital Foundry",
      source_url: "https://blog.playstation.com",
      published_at: "2026-11-10T14:30:00Z",
      verification_status: "VERIFIED",
      category: "Hardware Analysis",
      thumbnail_url: null,
    },
    {
      id: "news-fallback-3",
      title: "PC Launch Timeline Speculation and Anticipated Engine Physics",
      slug: "pc-release-speculation-rage-engine",
      summary: "Analysis of historical Rockstar PC launch cadences (GTA V, RDR 2) alongside expected memory and VRAM demands. Official PC timeline remains unannounced.",
      source_name: "Industry Technical Report",
      source_url: "https://gta6hub.local/news",
      published_at: "2026-11-05T09:15:00Z",
      verification_status: "UNCONFIRMED",
      category: "Speculation & Analysis",
      thumbnail_url: null,
    },
  ],
  deals: [
    {
      id: "deal-fallback-1",
      edition_name: "Standard Edition",
      platform: "PlayStation 5",
      country_code: "IN",
      current_price: 5999,
      currency: "INR",
      original_price: null,
      discount_percentage: 0,
      retailer_name: "PlayStation Store (India)",
      product_url: "/price-deals",
      last_checked_at: "2026-11-20T12:00:00Z",
      is_preorder: true,
    },
    {
      id: "deal-fallback-2",
      edition_name: "Deluxe Edition",
      platform: "Xbox Series X",
      country_code: "IN",
      current_price: 7499,
      currency: "INR",
      original_price: 7999,
      discount_percentage: 6,
      retailer_name: "Xbox Marketplace",
      product_url: "/price-deals",
      last_checked_at: "2026-11-20T12:00:00Z",
      is_preorder: true,
    },
    {
      id: "deal-fallback-3",
      edition_name: "PC Digital Edition (Anticipated)",
      platform: "PC",
      country_code: "IN",
      current_price: 0,
      currency: "INR",
      original_price: null,
      discount_percentage: 0,
      retailer_name: "Steam / Rockstar Launcher",
      product_url: "/price-deals",
      last_checked_at: "2026-11-20T12:00:00Z",
      is_preorder: true,
    },
  ],
  events: [
    {
      id: "event-fallback-1",
      event_name: "GTA VI Trailer 2 & Gameplay Reveal",
      category: "Milestone",
      date_string: "Early 2026",
      start_time_iso: "2026-03-01T14:00:00Z",
      timezone: "UTC",
      description: "Anticipated second official trailer showcasing Leonida geography and dual-protagonist gameplay dynamic.",
      is_official: false,
    },
    {
      id: "event-fallback-2",
      event_name: "Take-Two Interactive Earnings Conference",
      category: "Corporate Call",
      date_string: "February 2026",
      start_time_iso: "2026-02-08T21:30:00Z",
      timezone: "UTC",
      description: "Take-Two Interactive fiscal results broadcast with expected release window reconfirmations.",
      is_official: true,
    },
  ],
  community: [
    {
      id: "comm-fallback-1",
      title: "Map Scale & Density: Leonida vs San Andreas & RDR 2",
      author_username: "ViceCityNavigator",
      author_avatar_url: null,
      author_platform: "PS5",
      category: "Vice City Lore",
      published_at: "2026-11-18T10:00:00Z",
      replies_count: 52,
      likes_count: 147,
    },
    {
      id: "comm-fallback-2",
      title: "Anticipated PC Specs: Will 16GB VRAM be Required for 1440p Ultra?",
      author_username: "RTX_Overclock",
      author_avatar_url: null,
      author_platform: "PC",
      category: "PC Hardware",
      published_at: "2026-11-19T14:20:00Z",
      replies_count: 94,
      likes_count: 231,
    },
  ],
  disclaimer: "Curated demonstration feed. Live scraping connections integrate in subsequent development phases.",
};

export interface HomeFeedOptions {
  countryCode?: string;
  currency?: string;
  platform?: string;
}

export async function fetchHomeFeed(options?: HomeFeedOptions): Promise<{
  data: HomeAggregatedResponse;
  isFallback: boolean;
  error?: string;
}> {
  const query = new URLSearchParams();
  if (options?.countryCode) query.append("country_code", options.countryCode);
  if (options?.currency) query.append("currency", options.currency);
  if (options?.platform) query.append("platform", options.platform);

  const endpoint = `/home${query.toString() ? `?${query.toString()}` : ""}`;
  const response: ApiResponse<HomeAggregatedResponse> = await fetchFromApi<HomeAggregatedResponse>(endpoint);

  if (response.success && response.data) {
    return {
      data: response.data,
      isFallback: false,
    };
  }

  return {
    data: FALLBACK_HOME_DATA,
    isFallback: true,
    error: response.error?.message || "Using curated offline demonstration feed.",
  };
}
