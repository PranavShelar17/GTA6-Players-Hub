from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Hardware Profiles
# -----------------------------------------------------------------------------
class PCHardwareProfileCreate(BaseModel):
    profile_name: str = Field(default="My Gaming Rig", min_length=2, max_length=100)
    cpu_manufacturer: str = Field(..., min_length=2, max_length=50)  # Intel, AMD, Other
    cpu_model: str = Field(..., min_length=2, max_length=150)
    cpu_cores: Optional[int] = Field(None, ge=1, le=128)
    cpu_threads: Optional[int] = Field(None, ge=1, le=256)

    gpu_manufacturer: str = Field(..., min_length=2, max_length=50)  # NVIDIA, AMD, Intel, Other
    gpu_model: str = Field(..., min_length=2, max_length=150)
    gpu_vram_gb: float = Field(..., ge=0.5, le=96.0)
    gpu_type: str = Field(default="DEDICATED", pattern="^(DEDICATED|INTEGRATED)$")

    ram_gb: int = Field(..., ge=2, le=512)
    ram_type: Optional[str] = Field(None, max_length=20)  # DDR3, DDR4, DDR5, Other
    ram_speed_mhz: Optional[int] = Field(None, ge=800, le=10000)

    # Motherboard
    motherboard_model: Optional[str] = Field(None, max_length=150)

    storage_type: str = Field(default="NVME_SSD", pattern="^(HDD|SATA_SSD|NVME_SSD)$")
    storage_capacity_gb: Optional[int] = Field(None, ge=10, le=32000)
    storage_free_gb: int = Field(..., ge=0, le=32000)

    # Power Supply & Cooling
    psu_wattage: Optional[int] = Field(None, ge=200, le=2000)
    psu_model: Optional[str] = Field(None, max_length=150)
    cooling_solution: Optional[str] = Field(None, max_length=100)

    # Classification
    form_factor: str = Field(default="DESKTOP", pattern="^(DESKTOP|LAPTOP)$")
    is_incomplete: bool = Field(default=False)
    notes: Optional[str] = None

    operating_system: str = Field(default="Windows 11", max_length=50)
    os_architecture: str = Field(default="64-bit", pattern="^(64-bit|32-bit|Unknown)$")
    directx_version: Optional[str] = Field(default="DirectX 12", max_length=20)

    display_resolution: str = Field(default="1920x1080", max_length=30)
    refresh_rate: Optional[int] = Field(default=60, ge=30, le=500)
    is_primary: bool = Field(default=True)


class PCHardwareProfileUpdate(BaseModel):
    profile_name: Optional[str] = Field(None, min_length=2, max_length=100)
    cpu_manufacturer: Optional[str] = Field(None, min_length=2, max_length=50)
    cpu_model: Optional[str] = Field(None, min_length=2, max_length=150)
    cpu_cores: Optional[int] = Field(None, ge=1, le=128)
    cpu_threads: Optional[int] = Field(None, ge=1, le=256)

    gpu_manufacturer: Optional[str] = Field(None, min_length=2, max_length=50)
    gpu_model: Optional[str] = Field(None, min_length=2, max_length=150)
    gpu_vram_gb: Optional[float] = Field(None, ge=0.5, le=96.0)
    gpu_type: Optional[str] = Field(None, pattern="^(DEDICATED|INTEGRATED)$")

    ram_gb: Optional[int] = Field(None, ge=2, le=512)
    ram_type: Optional[str] = Field(None, max_length=20)
    ram_speed_mhz: Optional[int] = Field(None, ge=800, le=10000)

    motherboard_model: Optional[str] = Field(None, max_length=150)

    storage_type: Optional[str] = Field(None, pattern="^(HDD|SATA_SSD|NVME_SSD)$")
    storage_capacity_gb: Optional[int] = Field(None, ge=10, le=32000)
    storage_free_gb: Optional[int] = Field(None, ge=0, le=32000)

    psu_wattage: Optional[int] = Field(None, ge=200, le=2000)
    psu_model: Optional[str] = Field(None, max_length=150)
    cooling_solution: Optional[str] = Field(None, max_length=100)

    form_factor: Optional[str] = Field(None, pattern="^(DESKTOP|LAPTOP)$")
    is_incomplete: Optional[bool] = None
    notes: Optional[str] = None

    operating_system: Optional[str] = Field(None, max_length=50)
    os_architecture: Optional[str] = Field(None, pattern="^(64-bit|32-bit|Unknown)$")
    directx_version: Optional[str] = Field(None, max_length=20)

    display_resolution: Optional[str] = Field(None, max_length=30)
    refresh_rate: Optional[int] = Field(None, ge=30, le=500)
    is_primary: Optional[bool] = None


class PCHardwareProfileRead(PCHardwareProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Game System Requirements
# -----------------------------------------------------------------------------
class GameSystemRequirementRead(BaseModel):
    id: str
    game_name: str
    platform: str
    requirement_category: str  # MINIMUM, RECOMMENDED, ULTRA
    cpu_requirement: Optional[str] = None
    cpu_min_cores: Optional[int] = None
    gpu_requirement: Optional[str] = None
    vram_requirement_gb: Optional[float] = None
    ram_requirement_gb: Optional[int] = None
    storage_requirement_gb: Optional[int] = None
    storage_type_requirement: Optional[str] = None
    operating_system_requirement: Optional[str] = None
    directx_requirement: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    verification_status: str  # OFFICIAL, VERIFIED, UNCONFIRMED
    is_active: bool
    notes: Optional[str] = None
    published_at: Optional[datetime] = None
    last_verified_at: datetime


class RequirementsStatusResponse(BaseModel):
    status: str  # NOT_YET_CONFIRMED, OFFICIAL_AVAILABLE, SOURCE_UNVERIFIED
    is_available: bool
    notice_title: str
    notice_message: str
    publisher: str = "Rockstar Games"
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    last_checked_at: datetime
    requirements: List[GameSystemRequirementRead] = []


# -----------------------------------------------------------------------------
# Compatibility Analysis & Diagnostics
# -----------------------------------------------------------------------------
class ComponentResult(BaseModel):
    component: str  # CPU, GPU, VRAM, RAM, STORAGE, OS, DIRECTX
    user_value: str
    required_value: Optional[str] = None
    status: str  # MEETS, BELOW, EXCEEDS, UNABLE_TO_COMPARE, INFO_MISSING
    explanation: str


class BottleneckNote(BaseModel):
    component: str
    severity: str  # INFO, WARNING, LIMITATION
    title: str
    description: str


class UpgradeSuggestion(BaseModel):
    component: str
    priority: str  # HIGH, MEDIUM, LOW
    summary: str
    technical_considerations: List[str] = []


class CompatibilityCheckRequest(BaseModel):
    hardware_profile_id: Optional[str] = None
    specs: Optional[PCHardwareProfileCreate] = None
    save_profile: bool = False
    profile_name: Optional[str] = None


class CompatibilityCheckResponse(BaseModel):
    id: str
    result_status: str  # REQUIREMENTS_UNAVAILABLE, BELOW_MINIMUM, MINIMUM_MET, RECOMMENDED_MET, STRONG_MATCH
    requirements_status: str
    analysis_summary: str
    hardware_summary: Dict[str, Any]
    component_results: List[ComponentResult]
    bottleneck_notes: List[BottleneckNote]
    upgrade_suggestions: List[UpgradeSuggestion]
    saved_profile_id: Optional[str] = None
    checked_at: datetime


class CompatibilityCheckHistoryItem(BaseModel):
    id: str
    result_status: str
    analysis_summary: str
    profile_name: Optional[str] = None
    checked_at: datetime


# -----------------------------------------------------------------------------
# PC History & Multi-Profile Comparison
# -----------------------------------------------------------------------------
class PCProfileComparisonRequest(BaseModel):
    profile_ids: List[str] = Field(..., min_length=2, max_length=5)


class PCProfileDifference(BaseModel):
    component: str  # CPU, GPU, VRAM, RAM, Motherboard, Storage, PSU, Cooling, Resolution
    profile_1_name: str
    profile_1_value: str
    profile_2_name: str
    profile_2_value: str
    delta_type: str  # UPGRADE, SIDEGRADE, DOWNGRADE, UNCHANGED
    explanation: str


class PCProfileComparisonResponse(BaseModel):
    profiles: List[PCHardwareProfileRead]
    differences: List[PCProfileDifference]
    upgrade_summary: str


# -----------------------------------------------------------------------------
# Top 3 Recommended Gaming PCs & Smart Recommendations
# -----------------------------------------------------------------------------
class RecommendedPCBuild(BaseModel):
    tier: str  # HIGH_END, MID_RANGE, ENTRY_LEVEL
    title: str
    tier_badge: str
    purpose: str
    target_resolution: str
    cpu: str
    gpu: str
    vram: str
    ram: str
    motherboard: str
    storage: str
    psu: str
    cooling: str
    case_airflow: str
    upgrade_potential: str
    estimated_system_power_w: int
    recommended_psu_wattage: int
    price_usd: Optional[float] = None
    price_inr: Optional[float] = None
    price_source_date: str
    price_status: str  # VERIFIED_ESTIMATE, PRICE_UNAVAILABLE
    strengths: List[str]
    limitations: List[str]
    ideal_for: List[str]


class PersonalizedMatchRecommendation(BaseModel):
    recommended_tier: str  # HIGH_END, MID_RANGE, ENTRY_LEVEL
    budget_category: str  # BUDGET, MID, HIGH, ANY
    intended_use: str  # GTA_6_PREPARATION, GENERAL_AAA, COMPETITIVE, STREAMING_RECORDING, CONTENT_CREATION
    match_headline: str
    rationale: str
    priority_upgrades_from_current: List[str]


class GamingPCRecommendationsResponse(BaseModel):
    recommendations: List[RecommendedPCBuild]
    personalized_match: Optional[PersonalizedMatchRecommendation] = None
    currency_requested: str = "USD"
    gta6_disclaimer: str


# -----------------------------------------------------------------------------
# User PC vs Top 3 Recommendations Comparison
# -----------------------------------------------------------------------------
class UserPCRecommendationComparisonRequest(BaseModel):
    profile_id: Optional[str] = None
    custom_specs: Optional[PCHardwareProfileCreate] = None


class UserVsRecommendationComparisonRow(BaseModel):
    component: str  # CPU, GPU, VRAM, RAM, Motherboard, Storage, PSU, Cooling
    user_value: str
    entry_level_value: str
    mid_range_value: str
    high_end_value: str
    performance_difference: str
    compatibility_status: str  # BELOW_ENTRY, MEETS_ENTRY, MEETS_MID, MEETS_HIGH, EXCEEDS_ALL
    upgrade_priority: str  # CRITICAL, HIGH, MEDIUM, LOW, OPTIONAL, NONE
    explanation: str


class PowerHeadroomAnalysis(BaseModel):
    estimated_user_power_w: int
    user_psu_w: Optional[int] = None
    recommended_psu_with_headroom_w: int
    status: str  # HEALTHY_HEADROOM, MARGINAL_HEADROOM, DEFICIT_WARNING, PSU_UNKNOWN
    guidance: str


class UserVsRecommendationComparisonResponse(BaseModel):
    user_profile_name: str
    comparison_table: List[UserVsRecommendationComparisonRow]
    power_analysis: PowerHeadroomAnalysis
    overall_assessment: str
    gta6_disclaimer: str
