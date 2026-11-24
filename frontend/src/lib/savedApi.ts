import { ApiResponse, fetchFromApi } from "./api";

export interface UnifiedSavedItem {
  id: string;
  saved_type: "NEWS" | "DEALS" | "EVENTS" | "COMMUNITY";
  saved_at: string;
  title: string;
  description?: string | null;
  url_path: string;
  thumbnail_url?: string | null;
  badge?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UnifiedSavedContentResponse {
  items: UnifiedSavedItem[];
  total: number;
  counts_by_type: {
    ALL: number;
    NEWS: number;
    DEALS: number;
    EVENTS: number;
    COMMUNITY: number;
    [key: string]: number;
  };
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SavedContentParams {
  type?: string;
  page?: number;
  pageSize?: number;
  token: string;
}

export async function fetchPlayerSavedContent(
  params: SavedContentParams
): Promise<ApiResponse<UnifiedSavedContentResponse>> {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.set("type", params.type);
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.pageSize) queryParams.set("page_size", params.pageSize.toString());

  return fetchFromApi<UnifiedSavedContentResponse>(`/users/me/saved?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${params.token}` },
  });
}

export async function removePlayerSavedItem(
  token: string,
  savedType: string,
  itemId: string
): Promise<ApiResponse<{ removed: boolean; saved_type: string; item_id: string }>> {
  return fetchFromApi<{ removed: boolean; saved_type: string; item_id: string }>(
    `/users/me/saved/${encodeURIComponent(savedType)}/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
