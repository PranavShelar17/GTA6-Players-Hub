export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; issue: string }>;
  } | null;
  meta: {
    timestamp: string;
    version: string;
    request_id?: string;
  };
}

export interface HealthData {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface ReadinessData {
  status: string;
  ready: boolean;
  dependencies: Record<string, string>;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to backend server";
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "unknown",
      },
    };
  }
}

export async function getBackendHealth(): Promise<ApiResponse<HealthData>> {
  return fetchFromApi<HealthData>("/health");
}

export async function getBackendReadiness(): Promise<ApiResponse<ReadinessData>> {
  return fetchFromApi<ReadinessData>("/health/ready");
}
