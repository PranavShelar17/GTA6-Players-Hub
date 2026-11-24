import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class PCHardwareProfile(Base):
    __tablename__ = "pc_hardware_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    profile_name = Column(String(100), nullable=False, default="My Gaming Rig")

    # Processor (CPU)
    cpu_manufacturer = Column(String(50), nullable=False)  # Intel, AMD, Other
    cpu_model = Column(String(150), nullable=False)
    cpu_cores = Column(Integer, nullable=True)
    cpu_threads = Column(Integer, nullable=True)

    # Graphics Card (GPU)
    gpu_manufacturer = Column(String(50), nullable=False)  # NVIDIA, AMD, Intel, Other
    gpu_model = Column(String(150), nullable=False)
    gpu_vram_gb = Column(Numeric(5, 1), nullable=False)
    gpu_type = Column(String(20), nullable=False, default="DEDICATED")  # DEDICATED, INTEGRATED

    # System Memory (RAM)
    ram_gb = Column(Integer, nullable=False)
    ram_type = Column(String(20), nullable=True)  # DDR3, DDR4, DDR5, Other
    ram_speed_mhz = Column(Integer, nullable=True)  # e.g. 3200, 3600, 5600, 6000

    # Motherboard
    motherboard_model = Column(String(150), nullable=True)

    # Storage
    storage_type = Column(String(20), nullable=False, default="NVME_SSD")  # HDD, SATA_SSD, NVME_SSD
    storage_capacity_gb = Column(Integer, nullable=True)
    storage_free_gb = Column(Integer, nullable=False)

    # Power Supply (PSU) & Cooling
    psu_wattage = Column(Integer, nullable=True)  # e.g. 550, 650, 750, 850, 1000
    psu_model = Column(String(150), nullable=True)
    cooling_solution = Column(String(100), nullable=True)  # Stock, Air Cooler, 240mm AIO, 360mm AIO, Custom Loop

    # Hardware Classification
    form_factor = Column(String(30), nullable=False, default="DESKTOP")  # DESKTOP, LAPTOP
    is_incomplete = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)

    # Operating System & Environment
    operating_system = Column(String(50), nullable=False, default="Windows 11")
    os_architecture = Column(String(20), nullable=False, default="64-bit")  # 64-bit, 32-bit, Unknown
    directx_version = Column(String(20), nullable=True, default="DirectX 12")

    # Display / Monitor
    display_resolution = Column(String(30), nullable=False, default="1920x1080")
    refresh_rate = Column(Integer, nullable=True, default=60)

    is_primary = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    checks = relationship("PCCompatibilityCheck", back_populates="hardware_profile", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_pc_profiles_user_created", "user_id", "created_at"),
    )


class GameSystemRequirement(Base):
    __tablename__ = "game_system_requirements"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    game_name = Column(String(100), nullable=False, default="Grand Theft Auto VI")
    platform = Column(String(30), nullable=False, default="PC")
    requirement_category = Column(String(30), nullable=False)  # MINIMUM, RECOMMENDED, ULTRA

    # Required Hardware Targets
    cpu_requirement = Column(String(255), nullable=True)
    cpu_min_cores = Column(Integer, nullable=True)
    gpu_requirement = Column(String(255), nullable=True)
    vram_requirement_gb = Column(Numeric(5, 1), nullable=True)
    ram_requirement_gb = Column(Integer, nullable=True)
    storage_requirement_gb = Column(Integer, nullable=True)
    storage_type_requirement = Column(String(50), nullable=True, default="SSD Required")
    operating_system_requirement = Column(String(100), nullable=True)
    directx_requirement = Column(String(50), nullable=True, default="DirectX 12")

    # Truth and Source Verification
    source_url = Column(String(1024), nullable=True)
    source_name = Column(String(100), nullable=True)
    verification_status = Column(
        String(32), nullable=False, default="UNCONFIRMED"
    )  # OFFICIAL, VERIFIED, UNCONFIRMED
    is_active = Column(Boolean, nullable=False, default=False)  # False until officially confirmed
    notes = Column(Text, nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    checks = relationship("PCCompatibilityCheck", back_populates="requirements_version")

    __table_args__ = (
        Index("idx_game_reqs_status_active", "verification_status", "is_active"),
    )


class PCCompatibilityCheck(Base):
    __tablename__ = "pc_compatibility_checks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=True, index=True)  # Nullable for anonymous checks
    hardware_profile_id = Column(GUID(), ForeignKey("pc_hardware_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    requirements_version_id = Column(GUID(), ForeignKey("game_system_requirements.id", ondelete="SET NULL"), nullable=True, index=True)

    # Result Overview
    result_status = Column(
        String(50), nullable=False, default="REQUIREMENTS_UNAVAILABLE"
    )  # REQUIREMENTS_UNAVAILABLE, BELOW_MINIMUM, MINIMUM_MET, RECOMMENDED_MET, STRONG_MATCH

    # Detailed Analysis Payloads (JSON)
    component_results = Column(JSON, nullable=False, default=dict)
    hardware_summary = Column(JSON, nullable=False, default=dict)
    bottleneck_notes = Column(JSON, nullable=False, default=list)
    upgrade_suggestions = Column(JSON, nullable=False, default=list)
    analysis_summary = Column(Text, nullable=False)

    checked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    hardware_profile = relationship("PCHardwareProfile", back_populates="checks")
    requirements_version = relationship("GameSystemRequirement", back_populates="checks")

    __table_args__ = (
        Index("idx_compat_checks_user_time", "user_id", "checked_at"),
    )
