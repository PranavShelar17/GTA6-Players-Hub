/**
 * GTA 6 Player Hub - PC Compatibility API Client (Phase 8)
 * Interfaces with FastAPI Backend at /api/v1/pc/*
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// -----------------------------------------------------------------------------
// Interfaces & Types
// -----------------------------------------------------------------------------
export interface PCHardwareProfile {
  id: string;
  user_id: string;
  profile_name: string;
  cpu_manufacturer: string;
  cpu_model: string;
  cpu_cores?: number | null;
  cpu_threads?: number | null;
  gpu_manufacturer: string;
  gpu_model: string;
  gpu_vram_gb: number;
  gpu_type: "DEDICATED" | "INTEGRATED";
  ram_gb: number;
  ram_type?: string | null;
  ram_speed_mhz?: number | null;
  motherboard_model?: string | null;
  storage_type: "HDD" | "SATA_SSD" | "NVME_SSD";
  storage_capacity_gb?: number | null;
  storage_free_gb: number;
  psu_wattage?: number | null;
  psu_model?: string | null;
  cooling_solution?: string | null;
  form_factor?: "DESKTOP" | "LAPTOP";
  is_incomplete?: boolean;
  notes?: string | null;
  operating_system: string;
  os_architecture: "64-bit" | "32-bit" | "Unknown";
  directx_version?: string | null;
  display_resolution: string;
  refresh_rate?: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type PCHardwareProfileCreate = Omit<
  PCHardwareProfile,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type PCHardwareProfileUpdate = Partial<PCHardwareProfileCreate>;

export interface GameSystemRequirement {
  id: string;
  game_name: string;
  platform: string;
  requirement_category: "MINIMUM" | "RECOMMENDED" | "ULTRA";
  cpu_requirement?: string | null;
  cpu_min_cores?: number | null;
  gpu_requirement?: string | null;
  vram_requirement_gb?: number | null;
  ram_requirement_gb?: number | null;
  storage_requirement_gb?: number | null;
  storage_type_requirement?: string | null;
  operating_system_requirement?: string | null;
  directx_requirement?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  verification_status: "OFFICIAL" | "VERIFIED" | "UNCONFIRMED";
  is_active: boolean;
  notes?: string | null;
  published_at?: string | null;
  last_verified_at: string;
}

export interface RequirementsStatusResponse {
  status: "NOT_YET_CONFIRMED" | "OFFICIAL_AVAILABLE" | "SOURCE_UNVERIFIED";
  is_available: boolean;
  notice_title: string;
  notice_message: string;
  publisher: string;
  source_name?: string | null;
  source_url?: string | null;
  last_checked_at: string;
  requirements: GameSystemRequirement[];
}

export interface ComponentResult {
  component: string;
  user_value: string;
  required_value?: string | null;
  status: "MEETS" | "BELOW" | "EXCEEDS" | "UNABLE_TO_COMPARE" | "INFO_MISSING";
  explanation: string;
}

export interface BottleneckNote {
  component: string;
  severity: "INFO" | "WARNING" | "LIMITATION";
  title: string;
  description: string;
}

export interface UpgradeSuggestion {
  component: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  technical_considerations: string[];
}

export interface CompatibilityCheckRequest {
  hardware_profile_id?: string | null;
  specs?: PCHardwareProfileCreate | null;
  save_profile?: boolean;
  profile_name?: string | null;
}

export interface CompatibilityCheckResponse {
  id: string;
  result_status:
    | "REQUIREMENTS_UNAVAILABLE"
    | "BELOW_MINIMUM"
    | "MINIMUM_MET"
    | "RECOMMENDED_MET"
    | "STRONG_MATCH";
  requirements_status: string;
  analysis_summary: string;
  hardware_summary: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    os?: string;
    display?: string;
    [key: string]: string | undefined;
  };
  component_results: ComponentResult[];
  bottleneck_notes: BottleneckNote[];
  upgrade_suggestions: UpgradeSuggestion[];
  saved_profile_id?: string | null;
  checked_at: string;
}

export interface CompatibilityCheckHistoryItem {
  id: string;
  result_status: string;
  analysis_summary: string;
  profile_name?: string | null;
  checked_at: string;
}

// -----------------------------------------------------------------------------
// Requirements API
// -----------------------------------------------------------------------------
export async function fetchRequirementsStatus(): Promise<RequirementsStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/pc/requirements/status`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load official requirements status");
    return await res.json();
  } catch (err) {
    console.error("Error fetching requirements status:", err);
    return {
      status: "NOT_YET_CONFIRMED",
      is_available: false,
      notice_title: "Official GTA 6 PC System Requirements Not Yet Confirmed",
      notice_message:
        "Official GTA 6 PC system requirements have not yet been confirmed. You can enter and save your PC specifications now, but an official compatibility result cannot be generated until verified requirements are available.",
      publisher: "Rockstar Games",
      source_name: "Rockstar Games Official Newswire",
      source_url: "https://www.rockstargames.com/newswire",
      last_checked_at: new Date().toISOString(),
      requirements: [],
    };
  }
}

export async function fetchSystemRequirements(): Promise<GameSystemRequirement[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pc/requirements`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load system requirements");
    return await res.json();
  } catch (err) {
    console.error("Error fetching system requirements:", err);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Profiles API (Authenticated)
// -----------------------------------------------------------------------------
export async function fetchHardwareProfiles(token: string): Promise<PCHardwareProfile[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pc/profiles`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch hardware profiles");
    return await res.json();
  } catch (err) {
    console.error("Error fetching profiles:", err);
    return [];
  }
}

export async function createHardwareProfile(
  payload: PCHardwareProfileCreate,
  token: string
): Promise<PCHardwareProfile> {
  const res = await fetch(`${API_BASE_URL}/pc/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Failed to create hardware profile");
  }
  return await res.json();
}

export async function updateHardwareProfile(
  profileId: string,
  payload: PCHardwareProfileUpdate,
  token: string
): Promise<PCHardwareProfile> {
  const res = await fetch(`${API_BASE_URL}/pc/profiles/${profileId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Failed to update hardware profile");
  }
  return await res.json();
}

export async function deleteHardwareProfile(
  profileId: string,
  token: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/pc/profiles/${profileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to delete hardware profile");
  }
  return true;
}

// -----------------------------------------------------------------------------
// Compatibility Check & Diagnostics
// -----------------------------------------------------------------------------
export async function runCompatibilityCheck(
  payload: CompatibilityCheckRequest,
  token?: string
): Promise<CompatibilityCheckResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/pc/compatibility/check`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Failed to run compatibility check");
  }

  return await res.json();
}

export async function fetchCompatibilityHistory(
  limit: number = 20,
  offset: number = 0,
  token: string
): Promise<CompatibilityCheckHistoryItem[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/pc/compatibility/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch compatibility history");
    return await res.json();
  } catch (err) {
    console.error("Error fetching compatibility history:", err);
    return [];
  }
}

export async function fetchCompatibilityCheckDetail(
  checkId: string,
  token?: string
): Promise<CompatibilityCheckResponse | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/pc/compatibility/history/${checkId}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch check detail");
    return await res.json();
  } catch (err) {
    console.error("Error fetching check detail:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// PC History & Profile Management
// -----------------------------------------------------------------------------
export async function setPrimaryHardwareProfile(
  profileId: string,
  token: string
): Promise<PCHardwareProfile> {
  const res = await fetch(`${API_BASE_URL}/pc/profiles/${profileId}/set-primary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to set primary hardware profile");
  }
  return await res.json();
}

export interface PCProfileDifference {
  component: string;
  profile_1_name: string;
  profile_1_value: string;
  profile_2_name: string;
  profile_2_value: string;
  delta_type: "UPGRADE" | "SIDEGRADE" | "DOWNGRADE" | "UNCHANGED";
  explanation: string;
}

export interface PCProfileComparisonResponse {
  profiles: PCHardwareProfile[];
  differences: PCProfileDifference[];
  upgrade_summary: string;
}

export async function compareSavedProfiles(
  profileIds: string[],
  token: string
): Promise<PCProfileComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/pc/profiles/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ profile_ids: profileIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to compare hardware profiles");
  }
  return await res.json();
}

// -----------------------------------------------------------------------------
// Top 3 Gaming PC Recommendations & Smart Comparison
// -----------------------------------------------------------------------------
export interface RecommendedPCBuild {
  tier: "HIGH_END" | "MID_RANGE" | "ENTRY_LEVEL";
  title: string;
  tier_badge: string;
  purpose: string;
  target_resolution: string;
  cpu: string;
  gpu: string;
  vram: string;
  ram: string;
  motherboard: string;
  storage: string;
  psu: string;
  cooling: string;
  case_airflow: string;
  upgrade_potential: string;
  estimated_system_power_w: number;
  recommended_psu_wattage: number;
  price_usd?: number | null;
  price_inr?: number | null;
  price_source_date: string;
  price_status: "VERIFIED_ESTIMATE" | "PRICE_UNAVAILABLE";
  strengths: string[];
  limitations: string[];
  ideal_for: string[];
}

export interface PersonalizedMatchRecommendation {
  recommended_tier: "HIGH_END" | "MID_RANGE" | "ENTRY_LEVEL";
  budget_category: string;
  intended_use: string;
  match_headline: string;
  rationale: string;
  priority_upgrades_from_current: string[];
}

export interface GamingPCRecommendationsResponse {
  recommendations: RecommendedPCBuild[];
  personalized_match?: PersonalizedMatchRecommendation | null;
  currency_requested: string;
  gta6_disclaimer: string;
}

export async function fetchGamingPCRecommendations(
  budget?: number,
  intendedUse?: string,
  currency: string = "USD"
): Promise<GamingPCRecommendationsResponse> {
  const params = new URLSearchParams();
  if (budget) params.append("budget", budget.toString());
  if (intendedUse) params.append("intended_use", intendedUse);
  if (currency) params.append("currency", currency);

  const res = await fetch(`${API_BASE_URL}/pc/recommendations?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch gaming PC recommendations");
  }
  return await res.json();
}

export interface UserVsRecommendationComparisonRow {
  component: string;
  user_value: string;
  entry_level_value: string;
  mid_range_value: string;
  high_end_value: string;
  performance_difference: string;
  compatibility_status:
    | "BELOW_ENTRY"
    | "MEETS_ENTRY"
    | "MEETS_MID"
    | "MEETS_HIGH"
    | "EXCEEDS_ALL";
  upgrade_priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "OPTIONAL" | "NONE";
  explanation: string;
}

export interface PowerHeadroomAnalysis {
  estimated_user_power_w: number;
  user_psu_w?: number | null;
  recommended_psu_with_headroom_w: number;
  status: "HEALTHY_HEADROOM" | "MARGINAL_HEADROOM" | "DEFICIT_WARNING" | "PSU_UNKNOWN";
  guidance: string;
}

export interface UserVsRecommendationComparisonResponse {
  user_profile_name: string;
  comparison_table: UserVsRecommendationComparisonRow[];
  power_analysis: PowerHeadroomAnalysis;
  overall_assessment: string;
  gta6_disclaimer: string;
}

export async function compareUserPCWithRecommendations(
  params: {
    profileId?: string;
    customSpecs?: PCHardwareProfileCreate;
  },
  token?: string
): Promise<UserVsRecommendationComparisonResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/pc/recommendations/compare`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      profile_id: params.profileId || null,
      custom_specs: params.customSpecs || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to compare PC with recommendations");
  }

  return await res.json();
}
