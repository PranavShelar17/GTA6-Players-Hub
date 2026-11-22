/**
 * Price & Deals Tracker API Client (Phase 5)
 * Interfaces with FastAPI Backend at /api/v1/prices/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface PriceRegion {
  id: string;
  region_name: string;
  country_code: string;
  currency_code: string;
  currency_symbol: string;
  tax_inclusive: boolean;
  exchange_rate_to_inr: number;
  exchange_rate_to_usd: number;
  rates_last_updated: string;
}

export interface PriceStore {
  id: string;
  store_name: string;
  website_url: string;
  store_type: string;
  seller_authorisation_status: string;
  source_type: string;
}

export interface ConvertedPriceInfo {
  amount_inr: number;
  exchange_rate_used: number;
  rate_timestamp: string;
  is_converted_estimate: boolean;
  disclaimer: string;
}

export interface PriceObservationItem {
  id: string;
  product_id: string;
  store_id: string;
  store_name: string;
  store_type: string;
  seller_authorisation_status: string;
  region_id: string;
  country_code: string;
  current_price: number;
  original_price?: number | null;
  currency_code: string;
  currency_symbol: string;
  discount_percentage: number;
  availability_status: string;
  verification_status: "VERIFIED" | "STALE" | "UNAVAILABLE" | "UNVERIFIED";
  product_url: string;
  observed_at: string;
  tax_inclusive: boolean;
  converted_inr?: ConvertedPriceInfo | null;
}

export interface PriceProductListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  platform: string;
  edition: string;
  image_url?: string | null;
  release_status: string;
  lowest_verified_price?: number | null;
  currency_code?: string | null;
  currency_symbol?: string | null;
  available_stores_count: number;
  pc_pricing_available: boolean;
  pc_status_notice?: string | null;
}

export interface PriceComparisonOffer {
  store_id: string;
  store_name: string;
  store_type: string;
  seller_authorisation_status: string;
  current_price: number;
  original_price?: number | null;
  currency_code: string;
  currency_symbol: string;
  discount_percentage: number;
  availability_status: string;
  verification_status: "VERIFIED" | "STALE" | "UNAVAILABLE" | "UNVERIFIED";
  is_best_price: boolean;
  product_url: string;
  observed_at: string;
  tax_inclusive: boolean;
  converted_inr?: ConvertedPriceInfo | null;
}

export interface PriceComparisonResponse {
  product_id: string;
  product_name: string;
  slug: string;
  platform: string;
  edition: string;
  region: PriceRegion;
  offers: PriceComparisonOffer[];
  best_offer?: PriceComparisonOffer | null;
  pc_pricing_available: boolean;
  pc_status_notice?: string | null;
  tax_disclosure: string;
}

export interface DealItem {
  observation_id: string;
  product_id: string;
  product_name: string;
  slug: string;
  platform: string;
  edition: string;
  image_url?: string | null;
  store_name: string;
  country_code: string;
  currency_code: string;
  currency_symbol: string;
  current_price: number;
  original_price: number;
  discount_percentage: number;
  verification_status: "VERIFIED" | "STALE" | "UNAVAILABLE" | "UNVERIFIED";
  product_url: string;
  observed_at: string;
  tax_inclusive: boolean;
}

export interface PriceHistoryPoint {
  observed_at: string;
  price: number;
  currency_code: string;
  currency_symbol: string;
  store_name: string;
  verification_status: string;
}

export interface PriceHistoryResponse {
  product_id: string;
  product_name: string;
  slug: string;
  platform: string;
  edition: string;
  region: PriceRegion;
  current_verified_price?: number | null;
  historical_lowest_price?: number | null;
  historical_highest_price?: number | null;
  tracking_period_start?: string | null;
  tracking_period_end?: string | null;
  total_observations: number;
  data_points: PriceHistoryPoint[];
  insufficient_data_notice?: string | null;
}

export interface PriceProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  platform: string;
  edition: string;
  official_product_url?: string | null;
  image_url?: string | null;
  release_status: string;
  pc_pricing_available: boolean;
  pc_status_notice?: string | null;
  available_regions: PriceRegion[];
  current_observations: PriceObservationItem[];
  lowest_verified_price?: number | null;
  historical_lowest_price?: number | null;
  historical_highest_price?: number | null;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  slug: string;
  platform: string;
  edition: string;
  image_url?: string | null;
  lowest_verified_price?: number | null;
  currency_code?: string | null;
  currency_symbol?: string | null;
  added_at: string;
}

export interface PriceAlertItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  platform: string;
  edition: string;
  target_price: number;
  currency_code: string;
  region_id: string;
  region_country_code: string;
  is_active: boolean;
  last_triggered_at?: string | null;
  current_verified_price?: number | null;
  is_target_met: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceStats {
  total_products: number;
  total_observations: number;
  total_verified_observations: number;
  total_deals: number;
  supported_regions: number;
  supported_stores: number;
  last_verified_at?: string | null;
}

// Helper fetcher
async function apiGet<T>(endpoint: string, token?: string | null): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(`Price API GET error [${endpoint}]:`, err);
    return null;
  }
}

export async function fetchPriceRegions(): Promise<PriceRegion[]> {
  const data = await apiGet<PriceRegion[]>("/prices/regions");
  return data || [];
}

export async function fetchPriceStores(): Promise<PriceStore[]> {
  const data = await apiGet<PriceStore[]>("/prices/stores");
  return data || [];
}

export async function fetchPriceStats(): Promise<PriceStats | null> {
  return await apiGet<PriceStats>("/prices/stats");
}

export async function fetchPriceProducts(params?: {
  platform?: string;
  edition?: string;
  search?: string;
  country_code?: string;
}): Promise<PriceProductListItem[]> {
  const q = new URLSearchParams();
  if (params?.platform) q.set("platform", params.platform);
  if (params?.edition) q.set("edition", params.edition);
  if (params?.search) q.set("search", params.search);
  if (params?.country_code) q.set("country_code", params.country_code);

  const endpoint = `/prices/products${q.toString() ? `?${q.toString()}` : ""}`;
  const data = await apiGet<PriceProductListItem[]>(endpoint);
  return data || [];
}

export async function fetchPriceProductDetail(
  slug: string,
  country_code: string = "USA"
): Promise<PriceProductDetail | null> {
  return await apiGet<PriceProductDetail>(`/prices/products/${slug}?country_code=${country_code}`);
}

export async function comparePrices(
  slug: string,
  country_code: string = "IND"
): Promise<PriceComparisonResponse | null> {
  return await apiGet<PriceComparisonResponse>(`/prices/compare?slug=${slug}&country_code=${country_code}`);
}

export async function fetchDeals(params?: {
  platform?: string;
  country_code?: string;
  limit?: number;
}): Promise<DealItem[]> {
  const q = new URLSearchParams();
  if (params?.platform) q.set("platform", params.platform);
  if (params?.country_code) q.set("country_code", params.country_code);
  if (params?.limit) q.set("limit", params.limit.toString());

  const endpoint = `/prices/deals${q.toString() ? `?${q.toString()}` : ""}`;
  const data = await apiGet<DealItem[]>(endpoint);
  return data || [];
}

export async function fetchPriceHistory(
  slug: string,
  country_code: string = "USA"
): Promise<PriceHistoryResponse | null> {
  return await apiGet<PriceHistoryResponse>(`/prices/products/${slug}/history?country_code=${country_code}`);
}

export async function fetchPlayerWishlist(
  token: string,
  country_code: string = "USA"
): Promise<WishlistItem[]> {
  const data = await apiGet<WishlistItem[]>(`/prices/wishlist?country_code=${country_code}`, token);
  return data || [];
}

export async function addToWishlist(
  productId: string,
  token: string
): Promise<{ is_wishlisted: boolean; message: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/prices/wishlist/${productId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Add to wishlist error:", err);
    return null;
  }
}

export async function removeFromWishlist(
  productId: string,
  token: string
): Promise<{ is_wishlisted: boolean; message: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/prices/wishlist/${productId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    return null;
  }
}

export async function fetchPlayerPriceAlerts(token: string): Promise<PriceAlertItem[]> {
  const data = await apiGet<PriceAlertItem[]>("/prices/alerts", token);
  return data || [];
}

export async function createPriceAlert(
  payload: {
    product_id: string;
    region_id: string;
    target_price: number;
    currency_code: string;
  },
  token: string
): Promise<PriceAlertItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/prices/alerts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Create price alert error:", err);
    return null;
  }
}

export async function deletePriceAlert(
  alertId: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/prices/alerts/${alertId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Delete price alert error:", err);
    return false;
  }
}
