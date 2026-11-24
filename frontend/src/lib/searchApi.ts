import { ApiResponse, fetchFromApi } from "./api";

export interface SearchResultItem {
  id: string;
  content_type: "NEWS" | "DEALS" | "EVENTS" | "COMMUNITY" | "HELP" | string;
  content_id: string;
  title: string;
  description?: string | null;
  category: string;
  url_path: string;
  thumbnail_url?: string | null;
  verification_status: string;
  source_or_author?: string | null;
  published_or_event_at?: string | null;
  price_display?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  query: string;
  category_filter: string;
  sort: string;
}

export interface SearchSuggestionItem {
  title: string;
  category: string;
  content_type: string;
  url_path: string;
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: SearchSuggestionItem[];
  popular: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  category_filter?: string | null;
  results_count: number;
  searched_at: string;
}

export interface SearchCategoriesStats {
  all: number;
  news: number;
  deals: number;
  events: number;
  community: number;
  help: number;
}

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  token?: string | null;
}

export async function fetchSearchResults(params: SearchParams): Promise<ApiResponse<SearchResponse>> {
  const queryParams = new URLSearchParams();
  if (params.q !== undefined) queryParams.set("q", params.q);
  if (params.category) queryParams.set("category", params.category);
  if (params.sort) queryParams.set("sort", params.sort);
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.pageSize) queryParams.set("page_size", params.pageSize.toString());

  const headers: Record<string, string> = {};
  if (params.token) {
    headers["Authorization"] = `Bearer ${params.token}`;
  }

  return fetchFromApi<SearchResponse>(`/search?${queryParams.toString()}`, { headers });
}

export async function fetchSearchSuggestions(q: string, limit = 6): Promise<ApiResponse<SearchSuggestionsResponse>> {
  const queryParams = new URLSearchParams({ q, limit: limit.toString() });
  return fetchFromApi<SearchSuggestionsResponse>(`/search/suggestions?${queryParams.toString()}`);
}

export async function fetchRecentSearches(token: string, limit = 10): Promise<ApiResponse<SearchHistoryItem[]>> {
  return fetchFromApi<SearchHistoryItem[]>(`/search/recent?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function recordRecentSearch(
  token: string,
  data: { query: string; category_filter?: string; results_count?: number }
): Promise<ApiResponse<{ recorded: boolean; id: string; query: string }>> {
  return fetchFromApi<{ recorded: boolean; id: string; query: string }>("/search/recent", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function clearRecentSearches(
  token: string,
  historyId?: string
): Promise<ApiResponse<{ cleared: boolean }>> {
  const queryParams = historyId ? `?history_id=${encodeURIComponent(historyId)}` : "";
  return fetchFromApi<{ cleared: boolean }>(`/search/recent${queryParams}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchSearchCategoriesStats(): Promise<ApiResponse<SearchCategoriesStats>> {
  return fetchFromApi<SearchCategoriesStats>("/search/categories");
}
