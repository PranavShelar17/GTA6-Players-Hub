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

    storage_type: str = Field(default="NVME_SSD", pattern="^(HDD|SATA_SSD|NVME_SSD)$")
    storage_capacity_gb: Optional[int] = Field(None, ge=10, le=32000)
    storage_free_gb: int = Field(..., ge=0, le=32000)

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

    storage_type: Optional[str] = Field(None, pattern="^(HDD|SATA_SSD|NVME_SSD)$")
    storage_capacity_gb: Optional[int] = Field(None, ge=10, le=32000)
    storage_free_gb: Optional[int] = Field(None, ge=0, le=32000)

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
