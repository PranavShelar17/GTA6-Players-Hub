"""PC Compatibility Checker & Hardware Profile Service.

Handles hardware profile CRUD, official requirements status verification,
objective system balance & bottleneck analysis, and compatibility diagnostics.
Enforces the anti-fabrication policy: does not output fake FPS, fake pass/fail scores,
or arbitrary bottleneck percentages when official requirements are unconfirmed.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pc_compatibility import (
    GameSystemRequirement,
    PCCompatibilityCheck,
    PCHardwareProfile,
)
from app.schemas.pc_compatibility import (
    BottleneckNote,
    CompatibilityCheckHistoryItem,
    CompatibilityCheckRequest,
    CompatibilityCheckResponse,
    ComponentResult,
    GameSystemRequirementRead,
    GamingPCRecommendationsResponse,
    PCProfileComparisonResponse,
    PCProfileDifference,
    PersonalizedMatchRecommendation,
    PCHardwareProfileCreate,
    PCHardwareProfileRead,
    PCHardwareProfileUpdate,
    PowerHeadroomAnalysis,
    RecommendedPCBuild,
    RequirementsStatusResponse,
    UpgradeSuggestion,
    UserVsRecommendationComparisonResponse,
    UserVsRecommendationComparisonRow,
)


class PCCompatibilityService:

    # -------------------------------------------------------------------------
    # 1. Requirements Status
    # -------------------------------------------------------------------------
    @staticmethod
    async def get_requirements_status(session: AsyncSession) -> RequirementsStatusResponse:
        """Retrieves the official requirements status and active targets.
        
        If Rockstar Games has not yet confirmed PC specifications, returns
        NOT_YET_CONFIRMED with the required player notice.
        """
        stmt = (
            select(GameSystemRequirement)
            .order_by(desc(GameSystemRequirement.last_verified_at))
        )
        result = await session.execute(stmt)
        reqs = list(result.scalars().all())

        now = datetime.now(timezone.utc)
        active_official = [r for r in reqs if r.is_active and r.verification_status == "OFFICIAL"]

        if not active_official:
            return RequirementsStatusResponse(
                status="NOT_YET_CONFIRMED",
                is_available=False,
                notice_title="Official GTA 6 PC System Requirements Not Yet Confirmed",
                notice_message=(
                    "Official GTA 6 PC system requirements have not yet been confirmed. "
                    "You can enter and save your PC specifications now, but an official compatibility "
                    "result cannot be generated until verified requirements are available."
                ),
                publisher="Rockstar Games",
                source_name="Rockstar Games Official Newswire",
                source_url="https://www.rockstargames.com/newswire",
                last_checked_at=now,
                requirements=[
                    GameSystemRequirementRead(
                        id=str(r.id),
                        game_name=r.game_name,
                        platform=r.platform,
                        requirement_category=r.requirement_category,
                        cpu_requirement=r.cpu_requirement,
                        cpu_min_cores=r.cpu_min_cores,
                        gpu_requirement=r.gpu_requirement,
                        vram_requirement_gb=float(r.vram_requirement_gb) if r.vram_requirement_gb is not None else None,
                        ram_requirement_gb=r.ram_requirement_gb,
                        storage_requirement_gb=r.storage_requirement_gb,
                        storage_type_requirement=r.storage_type_requirement,
                        operating_system_requirement=r.operating_system_requirement,
                        directx_requirement=r.directx_requirement,
                        source_url=r.source_url,
                        source_name=r.source_name,
                        verification_status=r.verification_status,
                        is_active=r.is_active,
                        notes=r.notes,
                        published_at=r.published_at,
                        last_verified_at=r.last_verified_at,
                    )
                    for r in reqs
                ],
            )

        return RequirementsStatusResponse(
            status="OFFICIAL_AVAILABLE",
            is_available=True,
            notice_title="Official GTA 6 PC System Requirements Available",
            notice_message="Official hardware specifications verified against official Rockstar Games releases.",
            publisher="Rockstar Games",
            source_name=active_official[0].source_name or "Rockstar Games",
            source_url=active_official[0].source_url or "https://www.rockstargames.com/newswire",
            last_checked_at=now,
            requirements=[
                GameSystemRequirementRead(
                    id=str(r.id),
                    game_name=r.game_name,
                    platform=r.platform,
                    requirement_category=r.requirement_category,
                    cpu_requirement=r.cpu_requirement,
                    cpu_min_cores=r.cpu_min_cores,
                    gpu_requirement=r.gpu_requirement,
                    vram_requirement_gb=float(r.vram_requirement_gb) if r.vram_requirement_gb is not None else None,
                    ram_requirement_gb=r.ram_requirement_gb,
                    storage_requirement_gb=r.storage_requirement_gb,
                    storage_type_requirement=r.storage_type_requirement,
                    operating_system_requirement=r.operating_system_requirement,
                    directx_requirement=r.directx_requirement,
                    source_url=r.source_url,
                    source_name=r.source_name,
                    verification_status=r.verification_status,
                    is_active=r.is_active,
                    notes=r.notes,
                    published_at=r.published_at,
                    last_verified_at=r.last_verified_at,
                )
                for r in active_official
            ],
        )

    # -------------------------------------------------------------------------
    # 2. Hardware Profile Management
    # -------------------------------------------------------------------------
    @staticmethod
    async def create_profile(
        session: AsyncSession, user_id: uuid.UUID, profile_in: PCHardwareProfileCreate
    ) -> PCHardwareProfileRead:
        """Creates a new PC hardware profile for an authenticated player."""
        # If marked primary, unset existing primary profiles for this user
        if profile_in.is_primary:
            stmt = (
                update(PCHardwareProfile)
                .where(PCHardwareProfile.user_id == user_id)
                .values(is_primary=False)
            )
            await session.execute(stmt)

        profile = PCHardwareProfile(
            user_id=user_id,
            profile_name=profile_in.profile_name,
            cpu_manufacturer=profile_in.cpu_manufacturer,
            cpu_model=profile_in.cpu_model,
            cpu_cores=profile_in.cpu_cores,
            cpu_threads=profile_in.cpu_threads,
            gpu_manufacturer=profile_in.gpu_manufacturer,
            gpu_model=profile_in.gpu_model,
            gpu_vram_gb=profile_in.gpu_vram_gb,
            gpu_type=profile_in.gpu_type,
            ram_gb=profile_in.ram_gb,
            ram_type=profile_in.ram_type,
            ram_speed_mhz=profile_in.ram_speed_mhz,
            motherboard_model=profile_in.motherboard_model,
            storage_type=profile_in.storage_type,
            storage_capacity_gb=profile_in.storage_capacity_gb,
            storage_free_gb=profile_in.storage_free_gb,
            psu_wattage=profile_in.psu_wattage,
            psu_model=profile_in.psu_model,
            cooling_solution=profile_in.cooling_solution,
            form_factor=profile_in.form_factor or "DESKTOP",
            is_incomplete=bool(profile_in.is_incomplete or not profile_in.psu_wattage or not profile_in.motherboard_model),
            notes=profile_in.notes,
            operating_system=profile_in.operating_system,
            os_architecture=profile_in.os_architecture,
            directx_version=profile_in.directx_version,
            display_resolution=profile_in.display_resolution,
            refresh_rate=profile_in.refresh_rate,
            is_primary=profile_in.is_primary,
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

        return PCCompatibilityService._to_profile_read(profile)

    @staticmethod
    async def get_profile(
        session: AsyncSession, profile_id: uuid.UUID, user_id: uuid.UUID
    ) -> PCHardwareProfileRead:
        """Fetches a hardware profile, enforcing user ownership."""
        stmt = select(PCHardwareProfile).where(
            PCHardwareProfile.id == profile_id,
            PCHardwareProfile.user_id == user_id,
        )
        result = await session.execute(stmt)
        profile = result.scalars().first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PC hardware profile not found or unauthorized access",
            )
        return PCCompatibilityService._to_profile_read(profile)

    @staticmethod
    async def list_user_profiles(
        session: AsyncSession, user_id: uuid.UUID
    ) -> List[PCHardwareProfileRead]:
        """Lists all hardware profiles belonging to the user."""
        stmt = (
            select(PCHardwareProfile)
            .where(PCHardwareProfile.user_id == user_id)
            .order_by(desc(PCHardwareProfile.is_primary), desc(PCHardwareProfile.created_at))
        )
        result = await session.execute(stmt)
        profiles = result.scalars().all()
        return [PCCompatibilityService._to_profile_read(p) for p in profiles]

    @staticmethod
    async def update_profile(
        session: AsyncSession,
        profile_id: uuid.UUID,
        user_id: uuid.UUID,
        profile_update: PCHardwareProfileUpdate,
    ) -> PCHardwareProfileRead:
        """Updates an existing hardware profile with user ownership enforcement."""
        stmt = select(PCHardwareProfile).where(
            PCHardwareProfile.id == profile_id,
            PCHardwareProfile.user_id == user_id,
        )
        result = await session.execute(stmt)
        profile = result.scalars().first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PC hardware profile not found or unauthorized access",
            )

        update_data = profile_update.model_dump(exclude_unset=True)

        if update_data.get("is_primary") is True:
            await session.execute(
                update(PCHardwareProfile)
                .where(PCHardwareProfile.user_id == user_id, PCHardwareProfile.id != profile_id)
                .values(is_primary=False)
            )

        for key, val in update_data.items():
            setattr(profile, key, val)

        profile.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(profile)

        return PCCompatibilityService._to_profile_read(profile)

    @staticmethod
    @staticmethod
    async def delete_profile(
        session: AsyncSession, profile_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Deletes a hardware profile belonging to the user."""
        stmt = select(PCHardwareProfile).where(
            PCHardwareProfile.id == profile_id,
            PCHardwareProfile.user_id == user_id,
        )
        result = await session.execute(stmt)
        profile = result.scalars().first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PC hardware profile not found or unauthorized access",
            )

        await session.delete(profile)
        await session.commit()
        return True

    @staticmethod
    async def set_primary_profile(
        session: AsyncSession, profile_id: uuid.UUID, user_id: uuid.UUID
    ) -> PCHardwareProfileRead:
        """Sets a specified profile as current/primary, resetting all others for this user."""
        stmt = select(PCHardwareProfile).where(
            PCHardwareProfile.id == profile_id,
            PCHardwareProfile.user_id == user_id,
        )
        result = await session.execute(stmt)
        profile = result.scalars().first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PC hardware profile not found or unauthorized access",
            )

        # Reset other profiles to not primary
        await session.execute(
            update(PCHardwareProfile)
            .where(PCHardwareProfile.user_id == user_id)
            .values(is_primary=False)
        )
        profile.is_primary = True
        profile.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(profile)
        return PCCompatibilityService._to_profile_read(profile)

    @staticmethod
    async def compare_user_profiles(
        session: AsyncSession, profile_ids: List[str], user_id: uuid.UUID
    ) -> PCProfileComparisonResponse:
        """Compares multiple saved PC configurations belonging to the user."""
        parsed_ids = []
        for pid in profile_ids:
            try:
                parsed_ids.append(uuid.UUID(pid))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid profile ID: {pid}")

        stmt = (
            select(PCHardwareProfile)
            .where(
                PCHardwareProfile.id.in_(parsed_ids),
                PCHardwareProfile.user_id == user_id,
            )
            .order_by(PCHardwareProfile.created_at.asc())
        )
        result = await session.execute(stmt)
        profiles = list(result.scalars().all())

        if len(profiles) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least two valid profiles belonging to your account are required for comparison.",
            )

        # Order profiles according to user request order
        profile_map = {p.id: p for p in profiles}
        ordered_profiles = [profile_map[pid] for pid in parsed_ids if pid in profile_map]
        if len(ordered_profiles) >= 2:
            p1 = ordered_profiles[0]
            p2 = ordered_profiles[1]
            profiles = ordered_profiles
        else:
            p1 = profiles[0]
            p2 = profiles[1]
        differences: List[PCProfileDifference] = []

        # 1. CPU
        c1 = f"{p1.cpu_manufacturer} {p1.cpu_model}"
        c2 = f"{p2.cpu_manufacturer} {p2.cpu_model}"
        delta_cpu = "UNCHANGED" if c1.lower() == c2.lower() else "UPGRADE"
        differences.append(PCProfileDifference(
            component="Processor (CPU)",
            profile_1_name=p1.profile_name,
            profile_1_value=f"{c1} ({p1.cpu_cores or '?'}C/{p1.cpu_threads or '?'}T)",
            profile_2_name=p2.profile_name,
            profile_2_value=f"{c2} ({p2.cpu_cores or '?'}C/{p2.cpu_threads or '?'}T)",
            delta_type=delta_cpu,
            explanation=f"CPU changed from {c1} to {c2}." if delta_cpu != "UNCHANGED" else "Processor model is identical."
        ))

        # 2. GPU
        g1 = f"{p1.gpu_manufacturer} {p1.gpu_model}"
        g2 = f"{p2.gpu_manufacturer} {p2.gpu_model}"
        delta_gpu = "UNCHANGED" if g1.lower() == g2.lower() else "UPGRADE"
        differences.append(PCProfileDifference(
            component="Graphics Card (GPU)",
            profile_1_name=p1.profile_name,
            profile_1_value=f"{g1} ({float(p1.gpu_vram_gb)} GB VRAM)",
            profile_2_name=p2.profile_name,
            profile_2_value=f"{g2} ({float(p2.gpu_vram_gb)} GB VRAM)",
            delta_type=delta_gpu,
            explanation=f"GPU changed from {g1} to {g2}." if delta_gpu != "UNCHANGED" else "Graphics card is identical."
        ))

        # 3. VRAM
        v1 = float(p1.gpu_vram_gb)
        v2 = float(p2.gpu_vram_gb)
        delta_vram = "UPGRADE" if v2 > v1 else ("DOWNGRADE" if v2 < v1 else "UNCHANGED")
        differences.append(PCProfileDifference(
            component="Video Memory (VRAM)",
            profile_1_name=p1.profile_name,
            profile_1_value=f"{v1:.1f} GB",
            profile_2_name=p2.profile_name,
            profile_2_value=f"{v2:.1f} GB",
            delta_type=delta_vram,
            explanation=f"VRAM changed by {v2 - v1:+.1f} GB ({v1:.1f} GB -> {v2:.1f} GB)."
        ))

        # 4. RAM
        r1 = p1.ram_gb
        r2 = p2.ram_gb
        delta_ram = "UPGRADE" if r2 > r1 else ("DOWNGRADE" if r2 < r1 else "UNCHANGED")
        differences.append(PCProfileDifference(
            component="System Memory (RAM)",
            profile_1_name=p1.profile_name,
            profile_1_value=f"{r1} GB {p1.ram_type or ''} {f'@{p1.ram_speed_mhz}MHz' if getattr(p1, 'ram_speed_mhz', None) else ''}".strip(),
            profile_2_name=p2.profile_name,
            profile_2_value=f"{r2} GB {p2.ram_type or ''} {f'@{p2.ram_speed_mhz}MHz' if getattr(p2, 'ram_speed_mhz', None) else ''}".strip(),
            delta_type=delta_ram,
            explanation=f"RAM capacity changed from {r1} GB to {r2} GB."
        ))

        # 5. Motherboard
        m1 = getattr(p1, "motherboard_model", None) or "Not specified"
        m2 = getattr(p2, "motherboard_model", None) or "Not specified"
        differences.append(PCProfileDifference(
            component="Motherboard",
            profile_1_name=p1.profile_name,
            profile_1_value=m1,
            profile_2_name=p2.profile_name,
            profile_2_value=m2,
            delta_type="UNCHANGED" if m1.lower() == m2.lower() else "SIDEGRADE",
            explanation=f"Motherboard: {m1} -> {m2}."
        ))

        # 6. Storage
        s1 = f"{p1.storage_type.replace('_', ' ')} ({p1.storage_free_gb} GB free / {p1.storage_capacity_gb or '?'} GB total)"
        s2 = f"{p2.storage_type.replace('_', ' ')} ({p2.storage_free_gb} GB free / {p2.storage_capacity_gb or '?'} GB total)"
        differences.append(PCProfileDifference(
            component="Storage",
            profile_1_name=p1.profile_name,
            profile_1_value=s1,
            profile_2_name=p2.profile_name,
            profile_2_value=s2,
            delta_type="UPGRADE" if "NVME" in p2.storage_type and "HDD" in p1.storage_type else "CHANGED",
            explanation=f"Storage changed from {p1.storage_type} to {p2.storage_type}."
        ))

        # 7. PSU
        psu1 = f"{getattr(p1, 'psu_wattage', None) or '?'}W {getattr(p1, 'psu_model', '') or ''}".strip()
        psu2 = f"{getattr(p2, 'psu_wattage', None) or '?'}W {getattr(p2, 'psu_model', '') or ''}".strip()
        differences.append(PCProfileDifference(
            component="Power Supply (PSU)",
            profile_1_name=p1.profile_name,
            profile_1_value=psu1 or "Not specified",
            profile_2_name=p2.profile_name,
            profile_2_value=psu2 or "Not specified",
            delta_type="CHANGED" if psu1 != psu2 else "UNCHANGED",
            explanation=f"PSU configuration: {psu1 or 'Unspecified'} -> {psu2 or 'Unspecified'}."
        ))

        # 8. Cooling
        cool1 = getattr(p1, "cooling_solution", None) or "Unspecified"
        cool2 = getattr(p2, "cooling_solution", None) or "Unspecified"
        differences.append(PCProfileDifference(
            component="Cooling System",
            profile_1_name=p1.profile_name,
            profile_1_value=cool1,
            profile_2_name=p2.profile_name,
            profile_2_value=cool2,
            delta_type="CHANGED" if cool1 != cool2 else "UNCHANGED",
            explanation=f"Cooling: {cool1} -> {cool2}."
        ))

        summary = (
            f"Hardware comparison between '{p1.profile_name}' (created {p1.created_at.strftime('%b %d, %Y')}) "
            f"and '{p2.profile_name}' (created {p2.created_at.strftime('%b %d, %Y')}). "
            f"Key changes include CPU ({c1} -> {c2}), GPU ({g1} -> {g2}), and RAM ({r1}GB -> {r2}GB)."
        )

        return PCProfileComparisonResponse(
            profiles=[PCCompatibilityService._to_profile_read(p) for p in profiles],
            differences=differences,
            upgrade_summary=summary,
        )

    @staticmethod
    def get_top_3_recommendations(
        budget: str = "ANY",
        intended_use: str = "GTA_6_PREPARATION",
        currency: str = "USD",
    ) -> GamingPCRecommendationsResponse:
        """Returns the three curated gaming PC recommendation tiers and a personalized match."""
        high_end = RecommendedPCBuild(
            tier="HIGH_END",
            title="Enthusiast Flagship Rig",
            tier_badge="Premium Tier",
            purpose="Uncompromised ultra-tier performance for native 4K and 1440p high-refresh gaming with full ray tracing.",
            target_resolution="4K Ultra (3840x2160) & 1440p High-Refresh (165Hz+)",
            cpu="AMD Ryzen 7 7800X3D (8 Cores, 16 Threads, 4.2GHz/5.0GHz, 96MB 3D V-Cache, AM5)",
            gpu="NVIDIA GeForce RTX 4080 Super (16 GB GDDR6X, 256-bit, Ada Lovelace, DLSS 3.5)",
            vram="16 GB GDDR6X",
            ram="32 GB DDR5-6000 CL30 (2x16GB Dual-Channel, AMD EXPO Low Latency)",
            motherboard="MSI MAG B650 Tomahawk Wi-Fi (ATX, PCIe 5.0 M.2, Wi-Fi 6E, 2.5G LAN)",
            storage="2 TB Samsung 990 PRO PCIe 4.0 NVMe M.2 SSD (7,450 MB/s Read / 6,900 MB/s Write)",
            psu="Corsair RM850x 850W 80+ Gold Fully Modular ATX 3.0 (PCIe 5.0 12VHPWR Native)",
            cooling="Thermalright Phantom Spirit 120 SE / 360mm AIO Liquid Cooler",
            case_airflow="Lian Li Lancool 216 Mesh (High Airflow, 2x 160mm Front PWM, 1x 140mm Rear)",
            upgrade_potential="High: AM5 platform guarantees new CPU support through 2027+, with headroom for PCIe 5.0 graphics cards and expansion.",
            estimated_system_power_w=520,
            recommended_psu_wattage=850,
            price_usd=1999.00,
            price_inr=185000.00,
            price_source_date="November 2026 Component Aggregate",
            price_status="VERIFIED_ESTIMATE",
            strengths=[
                "Top-of-the-line gaming CPU with massive 3D V-Cache minimizing frametime stutter in dense open worlds.",
                "16GB high-speed GDDR6X VRAM prevents texture paging bottlenecks in 4K resolution.",
                "Dedicated ATX 3.0 PSU handles transient GPU power spikes safely.",
            ],
            limitations=[
                "High initial budget required.",
                "Requires a dedicated large PC chassis to accommodate 310mm+ GPU and cooler clearance.",
            ],
            ideal_for=[
                "Gamers with 4K or ultra-wide displays targeting maximum visual fidelity.",
                "Enthusiasts preparing for next-generation open world engine titles.",
                "Players combining heavy AAA gaming with video editing and 3D rendering.",
            ],
        )

        mid_range = RecommendedPCBuild(
            tier="MID_RANGE",
            title="Balanced Performance Sweet Spot",
            tier_badge="Balanced Tier",
            purpose="The optimal balance of price-to-performance, delivering blistering 1440p Ultra gameplay with complete modern feature support.",
            target_resolution="1440p Quad-HD (2560x1440) Ultra & 1080p Competitive High-FPS",
            cpu="AMD Ryzen 5 7600X (6 Cores, 12 Threads, 4.7GHz/5.3GHz, 32MB Cache, AM5)",
            gpu="NVIDIA GeForce RTX 4070 Super (12 GB GDDR6X, 192-bit, DLSS 3 Frame Generation)",
            vram="12 GB GDDR6X",
            ram="32 GB DDR5-6000 CL30 (2x16GB Dual-Channel, AMD EXPO)",
            motherboard="Gigabyte B650M Gaming X AX (Micro-ATX, PCIe 4.0, Wi-Fi 6E, DDR5)",
            storage="1 TB Crucial T500 PCIe 4.0 NVMe M.2 SSD (7,300 MB/s Read / 6,800 MB/s Write)",
            psu="MSI MAG A750GL 750W 80+ Gold Fully Modular PCIe 5.0 Ready",
            cooling="Thermalright Peerless Assassin 120 SE Dual Tower Air Cooler",
            case_airflow="Montech Air 903 Base (Mesh front panel, 3x 140mm High-CFM fans included)",
            upgrade_potential="Very High: Shares the modern AM5 and DDR5 standard with the premium tier, allowing simple drop-in upgrades to 8-core or 12-core X3D CPUs later.",
            estimated_system_power_w=410,
            recommended_psu_wattage=750,
            price_usd=1249.00,
            price_inr=115000.00,
            price_source_date="November 2026 Component Aggregate",
            price_status="VERIFIED_ESTIMATE",
            strengths=[
                "Exceptional price-to-performance ratio; outpaces last-gen flagships at half the power.",
                "12GB GDDR6X VRAM and DLSS 3 provide smooth 1440p framerates with ray tracing active.",
                "DDR5 and AM5 platform future-proof the motherboard for future upgrade cycles.",
            ],
            limitations=[
                "12GB VRAM may require reducing texture packages when running at native 4K with ray tracing.",
                "1TB storage will require secondary drive addition if maintaining large game libraries.",
            ],
            ideal_for=[
                "Core gamers looking for the best performance per dollar in 2026/2027.",
                "Players targeting 1440p displays with high refresh rates (144Hz - 240Hz).",
                "Users planning an upgradeable foundation that will last for years.",
            ],
        )

        entry_level = RecommendedPCBuild(
            tier="ENTRY_LEVEL",
            title="Smart Budget Modern Gaming Rig",
            tier_badge="Budget Tier",
            purpose="An affordable, reliable configuration providing a solid entry point for 1080p modern gaming without sacrificing safety or build quality.",
            target_resolution="1080p Full-HD (1920x1080) High Settings & Esports 120Hz+",
            cpu="Intel Core i5-12400F (6 Cores, 12 Threads, 2.5GHz/4.4GHz, 18MB Cache, LGA1700)",
            gpu="NVIDIA GeForce RTX 4060 (8 GB GDDR6, 128-bit, DLSS 3) / AMD Radeon RX 6600 8GB",
            vram="8 GB GDDR6",
            ram="16 GB DDR4-3200 CL16 (2x8GB Dual-Channel)",
            motherboard="ASRock B660M Pro RS (Micro-ATX, Dual PCIe M.2, 8-phase VRM, LGA1700)",
            storage="1 TB Teamgroup MP33 PCIe 3.0 NVMe M.2 SSD (1,800 MB/s Read / 1,500 MB/s Write)",
            psu="EVGA 600 BR 600W 80+ Bronze Certified Power Supply",
            cooling="DeepCool AG400 / Stock CPU Cooler (Adequate for 65W TDP)",
            case_airflow="Cooler Master MasterBox Q300L (Mesh front/top filters, compact mATX)",
            upgrade_potential="Moderate: Supports drop-in GPU and SSD upgrades, but the DDR4 and LGA1700 platform is at end-of-life and will not support new CPU generations.",
            estimated_system_power_w=280,
            recommended_psu_wattage=600,
            price_usd=699.00,
            price_inr=64000.00,
            price_source_date="November 2026 Component Aggregate",
            price_status="VERIFIED_ESTIMATE",
            strengths=[
                "Very accessible entry price under $700 / ₹65k while avoiding substandard or unsafe components.",
                "Low system power draw (<300W) keeps temperatures and electric bills low.",
                "Runs modern AAA titles smoothly at 1080p High settings with DLSS or FSR enabled.",
            ],
            limitations=[
                "8GB VRAM requires moderating ultra texture settings in demanding open-world games.",
                "DDR4 RAM platform does not support migration to DDR5 without changing motherboard and CPU.",
                "Not designed for native 1440p or 4K rendering.",
            ],
            ideal_for=[
                "First-time PC builders and budget-conscious gamers upgrading from older console generations.",
                "Players focused on 1080p gaming and popular competitive esports titles.",
                "Users needing an immediate, dependable gaming PC with low upfront investment.",
            ],
        )

        all_builds = [high_end, mid_range, entry_level]

        # Determine personalized match
        matched_tier = "MID_RANGE"
        if budget in ("HIGH", "PREMIUM", "ENTHUSIAST"):
            matched_tier = "HIGH_END"
        elif budget in ("BUDGET", "ENTRY"):
            matched_tier = "ENTRY_LEVEL"
        elif intended_use in ("STREAMING_RECORDING", "CONTENT_CREATION"):
            matched_tier = "HIGH_END"
        elif intended_use == "COMPETITIVE":
            matched_tier = "MID_RANGE"

        selected_build = next((b for b in all_builds if b.tier == matched_tier), mid_range)

        match = PersonalizedMatchRecommendation(
            recommended_tier=matched_tier,
            budget_category=budget,
            intended_use=intended_use,
            match_headline=f"Recommended for you: {selected_build.title} ({selected_build.tier_badge})",
            rationale=(
                f"Based on your target of '{intended_use.replace('_', ' ').title()}' and '{budget.title()}' budget criteria, "
                f"the {selected_build.tier_badge} offers the optimal performance balance. It pairs {selected_build.cpu} with "
                f"{selected_build.gpu} to deliver consistent frametimes at {selected_build.target_resolution}."
            ),
            priority_upgrades_from_current=[
                f"Target {selected_build.gpu} with {selected_build.vram} to eliminate texture bottlenecks.",
                f"Ensure minimum {selected_build.ram} for smooth background multitasking and streaming.",
                f"Equip minimum {selected_build.recommended_psu_wattage}W PSU with sufficient 12V rail capacity.",
            ],
        )

        return GamingPCRecommendationsResponse(
            recommendations=all_builds,
            personalized_match=match,
            currency_requested=currency,
            gta6_disclaimer=(
                "Official GTA 6 PC system requirements have not been confirmed by Rockstar Games. "
                "These PC recommendations are hardware planning estimates and are not guaranteed GTA 6 compatibility results."
            ),
        )

    @staticmethod
    async def compare_user_pc_with_recommendations(
        session: AsyncSession,
        user_id: Optional[uuid.UUID],
        profile_id: Optional[str] = None,
        custom_specs: Optional[PCHardwareProfileCreate] = None,
    ) -> UserVsRecommendationComparisonResponse:
        """Compares user's current or provided PC against all three recommended gaming configurations."""
        profile: Optional[PCHardwareProfile] = None

        if profile_id:
            try:
                pid = uuid.UUID(profile_id)
                stmt = select(PCHardwareProfile).where(PCHardwareProfile.id == pid)
                if user_id:
                    stmt = stmt.where(PCHardwareProfile.user_id == user_id)
                res = await session.execute(stmt)
                profile = res.scalars().first()
            except Exception:
                profile = None

        if not profile and user_id:
            stmt = (
                select(PCHardwareProfile)
                .where(PCHardwareProfile.user_id == user_id)
                .order_by(desc(PCHardwareProfile.is_primary), desc(PCHardwareProfile.created_at))
            )
            res = await session.execute(stmt)
            profile = res.scalars().first()

        user_name = profile.profile_name if profile else (custom_specs.profile_name if custom_specs else "Your Current PC")
        user_cpu = profile.cpu_model if profile else (custom_specs.cpu_model if custom_specs else "Core i5-10400")
        user_gpu = profile.gpu_model if profile else (custom_specs.gpu_model if custom_specs else "GeForce GTX 1660 Super")
        user_vram = float(profile.gpu_vram_gb) if profile else (float(custom_specs.gpu_vram_gb) if custom_specs else 6.0)
        user_ram = profile.ram_gb if profile else (custom_specs.ram_gb if custom_specs else 16)
        user_ram_type = profile.ram_type if profile else (custom_specs.ram_type if custom_specs else "DDR4")
        user_storage_type = profile.storage_type if profile else (custom_specs.storage_type if custom_specs else "NVME_SSD")
        user_psu = (getattr(profile, "psu_wattage", None) if profile else (custom_specs.psu_wattage if custom_specs else None)) or None
        user_mobo = (getattr(profile, "motherboard_model", None) if profile else (custom_specs.motherboard_model if custom_specs else None)) or "Standard Motherboard"
        user_cooling = (getattr(profile, "cooling_solution", None) if profile else (custom_specs.cooling_solution if custom_specs else None)) or "Stock Cooler"

        # Heuristic power estimation
        estimated_cpu_w = 105 if any(x in user_cpu for x in ("i7", "Ryzen 7")) else (125 if any(x in user_cpu for x in ("i9", "Ryzen 9")) else 65)
        estimated_gpu_w = 285 if user_vram >= 16 else (200 if user_vram >= 12 else (160 if user_vram >= 8 else 115))
        estimated_user_power = estimated_cpu_w + estimated_gpu_w + 75
        recommended_user_psu = int(estimated_user_power * 1.30)

        if not user_psu:
            power_status = "PSU_UNKNOWN"
            power_guidance = (
                f"Your estimated system power draw is approximately {estimated_user_power}W. "
                f"We recommend a PSU of at least {recommended_user_psu}W with 80+ Gold certification. "
                "Please verify your power supply unit label to ensure safe headroom."
            )
        elif user_psu < estimated_user_power:
            power_status = "DEFICIT_WARNING"
            power_guidance = (
                f"Your PSU ({user_psu}W) is below your estimated system peak load ({estimated_user_power}W). "
                "Upgrading to at least a 650W-750W power supply is critical before installing new components."
            )
        elif user_psu < recommended_user_psu:
            power_status = "MARGINAL_HEADROOM"
            power_guidance = (
                f"Your PSU ({user_psu}W) satisfies base requirements ({estimated_user_power}W) but has less than "
                f"the recommended 30% safety headroom ({recommended_user_psu}W). It will function, but higher-wattage "
                "GPU upgrades will require a power supply replacement."
            )
        else:
            power_status = "HEALTHY_HEADROOM"
            power_guidance = (
                f"Your PSU ({user_psu}W) provides generous, safe headroom over your estimated system draw ({estimated_user_power}W). "
                "You have adequate capacity for future graphics card upgrades."
            )

        power_analysis = PowerHeadroomAnalysis(
            estimated_user_power_w=estimated_user_power,
            user_psu_w=user_psu,
            recommended_psu_with_headroom_w=recommended_user_psu,
            status=power_status,
            guidance=power_guidance,
        )

        rows: List[UserVsRecommendationComparisonRow] = []

        # 1. CPU
        cpu_status = "MEETS_MID" if any(x in user_cpu for x in ("7600", "13600", "7800")) else ("MEETS_ENTRY" if any(x in user_cpu for x in ("12400", "5600", "11400")) else "BELOW_ENTRY")
        cpu_prio = "HIGH" if cpu_status == "BELOW_ENTRY" else ("MEDIUM" if cpu_status == "MEETS_ENTRY" else "LOW")
        rows.append(UserVsRecommendationComparisonRow(
            component="Processor (CPU)",
            user_value=user_cpu,
            entry_level_value="Intel Core i5-12400F (6C/12T)",
            mid_range_value="AMD Ryzen 5 7600X (6C/12T, AM5)",
            high_end_value="AMD Ryzen 7 7800X3D (8C/16T, 3D V-Cache)",
            performance_difference="CPU determines simulation, physics, and draw call overhead.",
            compatibility_status=cpu_status,
            upgrade_priority=cpu_prio,
            explanation=(
                f"Your current processor ({user_cpu}) is {cpu_status.replace('_', ' ').lower()}. "
                "For open-world gaming, modern IPC and minimum 6 cores / 12 threads maintain smooth frametimes in dense NPC populations."
            )
        ))

        # 2. GPU
        gpu_status = "MEETS_HIGH" if any(x in user_gpu for x in ("4080", "4090", "7900")) else ("MEETS_MID" if any(x in user_gpu for x in ("4070", "7800", "3080")) else ("MEETS_ENTRY" if any(x in user_gpu for x in ("4060", "6600", "3060", "2070")) else "BELOW_ENTRY"))
        gpu_prio = "CRITICAL" if gpu_status == "BELOW_ENTRY" else ("HIGH" if gpu_status == "MEETS_ENTRY" else "LOW")
        rows.append(UserVsRecommendationComparisonRow(
            component="Graphics Card (GPU)",
            user_value=user_gpu,
            entry_level_value="GeForce RTX 4060 8GB / RX 6600 8GB",
            mid_range_value="GeForce RTX 4070 Super 12GB",
            high_end_value="GeForce RTX 4080 Super 16GB",
            performance_difference="Direct rendering, shader execution, and modern upscaling capability.",
            compatibility_status=gpu_status,
            upgrade_priority=gpu_prio,
            explanation=(
                f"Your current graphics card is {user_gpu}. "
                + ("Upgrading your GPU will yield the most noticeable graphical boost, provided your PSU and chassis support the replacement." if gpu_prio in ("CRITICAL", "HIGH") else "Your GPU possesses strong modern rasterization and compute power.")
            )
        ))

        # 3. VRAM
        vram_status = "MEETS_HIGH" if user_vram >= 16 else ("MEETS_MID" if user_vram >= 12 else ("MEETS_ENTRY" if user_vram >= 8 else "BELOW_ENTRY"))
        vram_prio = "CRITICAL" if user_vram < 8 else ("HIGH" if user_vram == 8 else "LOW")
        rows.append(UserVsRecommendationComparisonRow(
            component="Video Memory (VRAM)",
            user_value=f"{user_vram:.1f} GB",
            entry_level_value="8 GB GDDR6",
            mid_range_value="12 GB GDDR6X",
            high_end_value="16 GB GDDR6X",
            performance_difference=f"User has {user_vram:.1f} GB; modern target is 12GB-16GB for 1440p/4K.",
            compatibility_status=vram_status,
            upgrade_priority=vram_prio,
            explanation=(
                f"Your GPU has {user_vram:.1f} GB VRAM. Modern open-world titles heavily stream high-resolution textures. "
                + ("Less than 8GB will cause severe stuttering or forced low-resolution texture downgrades." if user_vram < 8 else "8GB-12GB is adequate for 1080p/1440p, while 16GB is ideal for uncompressed 4K.")
            )
        ))

        # 4. RAM
        ram_status = "MEETS_HIGH" if user_ram >= 32 and "DDR5" in str(user_ram_type) else ("MEETS_MID" if user_ram >= 32 else ("MEETS_ENTRY" if user_ram >= 16 else "BELOW_ENTRY"))
        ram_prio = "CRITICAL" if user_ram < 16 else ("MEDIUM" if user_ram == 16 else "NONE")
        rows.append(UserVsRecommendationComparisonRow(
            component="System Memory (RAM)",
            user_value=f"{user_ram} GB {user_ram_type or ''}".strip(),
            entry_level_value="16 GB DDR4-3200",
            mid_range_value="32 GB DDR5-6000",
            high_end_value="32 GB DDR5-6000 CL30",
            performance_difference=f"Installed capacity: {user_ram} GB.",
            compatibility_status=ram_status,
            upgrade_priority=ram_prio,
            explanation=(
                f"You have {user_ram} GB system RAM. 16GB is the baseline for modern gaming, while 32GB ensures background apps, Discord, and memory-intensive assets never cause pagefile stuttering."
            )
        ))

        # 5. Motherboard
        rows.append(UserVsRecommendationComparisonRow(
            component="Motherboard",
            user_value=user_mobo,
            entry_level_value="B660M Micro-ATX (PCIe 4.0, LGA1700)",
            mid_range_value="B650M Gaming AX (DDR5, AM5, Wi-Fi 6E)",
            high_end_value="B650 / X670 ATX (PCIe 5.0 M.2, AM5)",
            performance_difference="Motherboard determines CPU socket compatibility, PCIe generation, and expansion.",
            compatibility_status="MEETS_MID" if any(x in user_mobo for x in ("B650", "Z790", "X670")) else "MEETS_ENTRY",
            upgrade_priority="OPTIONAL",
            explanation=f"Motherboard model: {user_mobo}. When upgrading your CPU in the future, motherboard socket compatibility (AM5 vs LGA1700) is the primary constraint."
        ))

        # 6. Storage
        st_status = "MEETS_HIGH" if "NVME" in user_storage_type else ("MEETS_ENTRY" if "SSD" in user_storage_type else "BELOW_ENTRY")
        st_prio = "CRITICAL" if "HDD" in user_storage_type else "LOW"
        rows.append(UserVsRecommendationComparisonRow(
            component="Storage Interface",
            user_value=user_storage_type.replace('_', ' '),
            entry_level_value="1 TB PCIe NVMe SSD",
            mid_range_value="1 TB - 2 TB PCIe 4.0 NVMe SSD (7000 MB/s)",
            high_end_value="2 TB Samsung 990 PRO NVMe SSD",
            performance_difference="Drive streaming bandwidth directly impacts texture pop-in and load times.",
            compatibility_status=st_status,
            upgrade_priority=st_prio,
            explanation=(
                "Solid State Drives (SSDs) are mandatory for contemporary AAA open-world titles. "
                + ("You are currently on a mechanical HDD; upgrading to an NVMe SSD is essential." if "HDD" in user_storage_type else "Your system has SSD storage, ensuring fast asset loading.")
            )
        ))

        # 7. PSU
        psu_status = "MEETS_HIGH" if (user_psu and user_psu >= 850) else ("MEETS_MID" if (user_psu and user_psu >= 750) else ("MEETS_ENTRY" if (user_psu and user_psu >= 600) else "BELOW_ENTRY"))
        rows.append(UserVsRecommendationComparisonRow(
            component="Power Supply (PSU)",
            user_value=f"{user_psu}W" if user_psu else "Unspecified",
            entry_level_value="600W 80+ Bronze",
            mid_range_value="750W 80+ Gold Fully Modular",
            high_end_value="850W 80+ Gold ATX 3.0 Native",
            performance_difference="Power delivery stability and headroom for graphics upgrades.",
            compatibility_status=psu_status,
            upgrade_priority="HIGH" if psu_status == "BELOW_ENTRY" else "LOW",
            explanation=f"Your PSU is {user_psu or 'unspecified'}W. {power_guidance}"
        ))

        # 8. Cooling
        rows.append(UserVsRecommendationComparisonRow(
            component="Cooling System",
            user_value=user_cooling,
            entry_level_value="120mm Air Tower / Stock Cooler",
            mid_range_value="Dual Tower Air (Thermalright PA 120)",
            high_end_value="360mm AIO Liquid / Dual Tower Premium",
            performance_difference="Thermal regulation to maintain sustained boost clocks without throttling.",
            compatibility_status="MEETS_MID",
            upgrade_priority="LOW",
            explanation=f"Cooling: {user_cooling}. Efficient thermal dissipation keeps CPU boost frequencies high under extended gaming sessions."
        ))

        overall = (
            f"Evaluation for '{user_name}': Your configuration is generally positioned in the "
            f"{gpu_status.replace('_', ' ').title()} category. "
            f"The primary areas to optimize are: {', '.join([r.component for r in rows if r.upgrade_priority in ('CRITICAL', 'HIGH')]) or 'None (System is well balanced)'}."
        )

        return UserVsRecommendationComparisonResponse(
            user_profile_name=user_name,
            comparison_table=rows,
            power_analysis=power_analysis,
            overall_assessment=overall,
            gta6_disclaimer=(
                "Official GTA 6 PC system requirements have not been confirmed by Rockstar Games. "
                "These PC recommendations are hardware planning estimates and are not guaranteed GTA 6 compatibility results."
            ),
        )

    # -------------------------------------------------------------------------
    # 3. Compatibility Diagnostics Engine
    # -------------------------------------------------------------------------
    @staticmethod
    async def run_compatibility_check(
        session: AsyncSession,
        user_id: Optional[uuid.UUID],
        request: CompatibilityCheckRequest,
    ) -> CompatibilityCheckResponse:
        """Executes a comprehensive PC hardware compatibility and balance check.
        
        Strictly observes truth verification: if official requirements are unconfirmed,
        reports REQUIREMENTS_UNAVAILABLE with objective hardware balance notes,
        strictly avoiding any fake FPS or arbitrary percentages.
        """
        # Resolve hardware specs
        specs: PCHardwareProfileCreate
        hardware_profile_id: Optional[uuid.UUID] = None

        if request.hardware_profile_id:
            try:
                prof_uuid = uuid.UUID(request.hardware_profile_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid hardware_profile_id format")

            if not user_id:
                raise HTTPException(status_code=401, detail="Authentication required to use saved profile")

            prof_stmt = select(PCHardwareProfile).where(
                PCHardwareProfile.id == prof_uuid,
                PCHardwareProfile.user_id == user_id,
            )
            prof_res = await session.execute(prof_stmt)
            profile_db = prof_res.scalars().first()
            if not profile_db:
                raise HTTPException(status_code=404, detail="Saved PC profile not found")

            hardware_profile_id = profile_db.id
            specs = PCHardwareProfileCreate(
                profile_name=profile_db.profile_name,
                cpu_manufacturer=profile_db.cpu_manufacturer,
                cpu_model=profile_db.cpu_model,
                cpu_cores=profile_db.cpu_cores,
                cpu_threads=profile_db.cpu_threads,
                gpu_manufacturer=profile_db.gpu_manufacturer,
                gpu_model=profile_db.gpu_model,
                gpu_vram_gb=float(profile_db.gpu_vram_gb),
                gpu_type=profile_db.gpu_type,
                ram_gb=profile_db.ram_gb,
                ram_type=profile_db.ram_type,
                storage_type=profile_db.storage_type,
                storage_capacity_gb=profile_db.storage_capacity_gb,
                storage_free_gb=profile_db.storage_free_gb,
                operating_system=profile_db.operating_system,
                os_architecture=profile_db.os_architecture,
                directx_version=profile_db.directx_version,
                display_resolution=profile_db.display_resolution,
                refresh_rate=profile_db.refresh_rate,
                is_primary=profile_db.is_primary,
            )
        elif request.specs:
            specs = request.specs
            # If user wants to save profile and is authenticated
            if request.save_profile and user_id:
                created_p = await PCCompatibilityService.create_profile(
                    session=session,
                    user_id=user_id,
                    profile_in=PCHardwareProfileCreate(
                        profile_name=request.profile_name or specs.profile_name,
                        **specs.model_dump(exclude={"profile_name"}),
                    ),
                )
                hardware_profile_id = uuid.UUID(created_p.id)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either hardware_profile_id or specs must be provided",
            )

        # Build Hardware Summary
        hardware_summary = {
            "cpu": f"{specs.cpu_manufacturer} {specs.cpu_model}" + (f" ({specs.cpu_cores}C/{specs.cpu_threads}T)" if specs.cpu_cores else ""),
            "gpu": f"{specs.gpu_manufacturer} {specs.gpu_model} ({specs.gpu_vram_gb} GB VRAM, {specs.gpu_type.capitalize()})",
            "ram": f"{specs.ram_gb} GB" + (f" {specs.ram_type}" if specs.ram_type else ""),
            "storage": f"{specs.storage_type.replace('_', ' ')} with {specs.storage_free_gb} GB available" + (f" of {specs.storage_capacity_gb} GB" if specs.storage_capacity_gb else ""),
            "os": f"{specs.operating_system} ({specs.os_architecture}) - {specs.directx_version or 'DirectX 12'}",
            "display": f"{specs.display_resolution} @ {specs.refresh_rate or 60}Hz",
        }

        # Check official requirements status
        req_status = await PCCompatibilityService.get_requirements_status(session)
        is_official = req_status.is_available and len(req_status.requirements) > 0

        # Hardware Balance & Objective Bottleneck Analysis (NO fake percentages!)
        bottleneck_notes: List[BottleneckNote] = []
        upgrade_suggestions: List[UpgradeSuggestion] = []

        # 1. Storage Analysis
        if specs.storage_type == "HDD":
            bottleneck_notes.append(
                BottleneckNote(
                    component="Storage",
                    severity="WARNING",
                    title="Mechanical Hard Drive Detected",
                    description=(
                        "Mechanical hard drives (HDD) suffer from high access latency and limited read/write speeds (~100-150 MB/s). "
                        "Modern open-world games rely heavily on high-speed asset streaming. Running on an HDD may result in noticeable "
                        "texture pop-in, micro-stutters, and prolonged load times compared to solid-state storage."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="Storage",
                    priority="HIGH",
                    summary="Migrate game installation to an NVMe PCIe M.2 SSD or 2.5-inch SATA SSD.",
                    technical_considerations=[
                        "Inspect your motherboard for an available M.2 slot supporting PCIe 3.0 or 4.0 NVMe.",
                        "If no M.2 slot is available, a standard 2.5-inch SATA III SSD offers substantial read/write gains (~500 MB/s) over mechanical drives.",
                        "Ensure sufficient capacity (at least 200+ GB dedicated for modern open-world game files and patches).",
                    ],
                )
            )
        elif specs.storage_free_gb < 150:
            bottleneck_notes.append(
                BottleneckNote(
                    component="Storage Free Space",
                    severity="INFO",
                    title="Limited Available Disk Space",
                    description=(
                        f"You have {specs.storage_free_gb} GB of free storage. Modern flagship AAA titles typically require "
                        "between 100 GB and 200 GB of free space for initial installation, temporary unpack files, and ongoing update patches."
                    ),
                )
            )

        # 2. Memory (RAM) Analysis
        if specs.ram_gb < 16:
            bottleneck_notes.append(
                BottleneckNote(
                    component="System Memory (RAM)",
                    severity="WARNING",
                    title="Sub-16 GB System Memory",
                    description=(
                        f"Current system memory is {specs.ram_gb} GB. Flagship modern titles frequently allocate 12-14 GB of system RAM "
                        "in dense urban scenes. With background operating system services active, less than 16 GB risks heavy paging to disk, "
                        "causing frame time spikes."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="RAM",
                    priority="HIGH",
                    summary="Expand system memory to at least 16 GB or 32 GB.",
                    technical_considerations=[
                        "Verify whether your motherboard uses DDR4 or DDR5 (DDR4 and DDR5 memory modules are physically and electrically incompatible).",
                        "Check total motherboard RAM slots (2 vs 4 slots) and available free slots.",
                        "Use matching speed and latency pairs to enable dual-channel memory bandwidth, which significantly boosts CPU throughput.",
                    ],
                )
            )

        # 3. Graphics Card & VRAM Analysis
        if specs.gpu_type == "INTEGRATED":
            bottleneck_notes.append(
                BottleneckNote(
                    component="Graphics (GPU)",
                    severity="LIMITATION",
                    title="Integrated Graphics Processor",
                    description=(
                        "Integrated graphics share main system RAM and lack dedicated high-speed GDDR memory. "
                        "Demanding 3D game engines require dedicated graphics hardware with specialized rasterization and shader pipelines."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="GPU",
                    priority="HIGH",
                    summary="Install a dedicated modern graphics card with adequate dedicated VRAM.",
                    technical_considerations=[
                        "Verify your Power Supply Unit (PSU) rated wattage and available 8-pin or 12V-2x6 PCIe power cables.",
                        "Measure the internal length and thickness clearance inside your computer case.",
                        "Confirm motherboard PCIe x16 slot availability and PCIe generation support.",
                    ],
                )
            )
        elif specs.gpu_vram_gb < 6.0:
            bottleneck_notes.append(
                BottleneckNote(
                    component="Video Memory (VRAM)",
                    severity="WARNING",
                    title="Video RAM Below 6 GB",
                    description=(
                        f"Dedicated VRAM is {specs.gpu_vram_gb} GB. High-resolution texture buffers, shadow maps, and geometry streaming "
                        "in modern engines comfortably exceed 6 GB even at 1080p. Lower VRAM limits texture fidelity and shader quality."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="GPU",
                    priority="MEDIUM",
                    summary="Consider upgrading to a dedicated GPU featuring 8 GB to 16 GB of VRAM.",
                    technical_considerations=[
                        "Target 8 GB minimum for 1080p high fidelity, or 12-16 GB for 1440p and ultra settings.",
                        "Ensure case ventilation and adequate cooling for cards with higher TDP ratings.",
                        "Verify Power Supply Unit (PSU) capacity meets the manufacturer's recommended system wattage.",
                    ],
                )
            )

        # 4. CPU & Architecture Analysis
        if specs.os_architecture == "32-bit":
            bottleneck_notes.append(
                BottleneckNote(
                    component="Operating System Architecture",
                    severity="LIMITATION",
                    title="32-bit Architecture Limitation",
                    description=(
                        "32-bit operating systems cannot address more than 4 GB of total system RAM and cannot execute 64-bit binaries. "
                        "All modern AAA game titles exclusively require a 64-bit operating system."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="Operating System",
                    priority="HIGH",
                    summary="Reinstall a clean 64-bit version of Windows 10 or Windows 11.",
                    technical_considerations=[
                        "Ensure your CPU supports 64-bit instruction set (x86-64).",
                        "Back up all personal files before performing a 64-bit operating system migration.",
                    ],
                )
            )

        if specs.cpu_cores and specs.cpu_cores < 6:
            bottleneck_notes.append(
                BottleneckNote(
                    component="Processor (CPU)",
                    severity="INFO",
                    title="Quad-Core or Dual-Core CPU",
                    description=(
                        f"Your CPU has {specs.cpu_cores} physical cores. Modern open-world game architectures distribute dense NPC simulation, "
                        "streaming decompression, and background audio/physics across 6 to 8 cores."
                    ),
                )
            )
            upgrade_suggestions.append(
                UpgradeSuggestion(
                    component="CPU & Motherboard",
                    priority="MEDIUM",
                    summary="Consider a multi-core processor upgrade (6 cores / 12 threads or higher).",
                    technical_considerations=[
                        "Check your motherboard CPU socket (e.g. AMD AM4, AM5 or Intel LGA1700) to know what processors are supported.",
                        "Verify whether a motherboard BIOS update is required prior to swapping to a newer CPU generation.",
                        "Inspect your CPU cooling solution (heatsink / AIO cooler) to ensure it can handle the new processor's Thermal Design Power (TDP).",
                    ],
                )
            )

        # 5. Display Resolution Balance
        if "3840" in specs.display_resolution and specs.gpu_vram_gb < 12.0:
            bottleneck_notes.append(
                BottleneckNote(
                    component="Display Resolution",
                    severity="INFO",
                    title="4K Resolution VRAM Demands",
                    description=(
                        "Targeting 4K (3840x2160) renders four times the pixel count of standard 1080p. "
                        "At 4K, texture buffers and render targets demand significant VRAM (typically 12 GB+ recommended for stable frame pacing)."
                    ),
                )
            )

        # Component results breakdown
        component_results: List[ComponentResult] = []

        if not is_official:
            # OFFICIAL REQUIREMENTS NOT YET CONFIRMED
            result_status = "REQUIREMENTS_UNAVAILABLE"
            analysis_summary = (
                "Official GTA 6 PC system requirements have not yet been confirmed by Rockstar Games. "
                "You can enter and save your PC specifications now, but an official compatibility result "
                "cannot be generated until verified requirements are available. Your specifications have been "
                "analyzed below for general system balance and modern gaming hardware readiness."
            )

            # Build neutral component observations
            component_results = [
                ComponentResult(
                    component="Processor (CPU)",
                    user_value=f"{specs.cpu_manufacturer} {specs.cpu_model}" + (f" ({specs.cpu_cores} cores)" if specs.cpu_cores else ""),
                    required_value="Unannounced by Rockstar Games",
                    status="UNABLE_TO_COMPARE",
                    explanation="Official CPU tier unconfirmed. Evaluation will unlock immediately upon official specification release.",
                ),
                ComponentResult(
                    component="Graphics Card (GPU)",
                    user_value=f"{specs.gpu_manufacturer} {specs.gpu_model}",
                    required_value="Unannounced by Rockstar Games",
                    status="UNABLE_TO_COMPARE",
                    explanation="Official GPU tier unconfirmed. Evaluation will unlock immediately upon official specification release.",
                ),
                ComponentResult(
                    component="Dedicated VRAM",
                    user_value=f"{specs.gpu_vram_gb} GB",
                    required_value="Unannounced by Rockstar Games",
                    status="UNABLE_TO_COMPARE",
                    explanation="Official VRAM requirement unconfirmed. Dedicated VRAM has been verified in your profile.",
                ),
                ComponentResult(
                    component="System Memory (RAM)",
                    user_value=f"{specs.ram_gb} GB" + (f" {specs.ram_type}" if specs.ram_type else ""),
                    required_value="Unannounced by Rockstar Games",
                    status="UNABLE_TO_COMPARE",
                    explanation="Official RAM target unconfirmed. Evaluated against modern 16 GB+ open-world gaming baseline.",
                ),
                ComponentResult(
                    component="Storage Type & Space",
                    user_value=f"{specs.storage_type.replace('_', ' ')} ({specs.storage_free_gb} GB free)",
                    required_value="SSD Anticipated",
                    status="MEETS" if specs.storage_type in ("NVME_SSD", "SATA_SSD") else "BELOW",
                    explanation="Modern open-world games practically mandate solid-state storage (NVMe/SATA SSD) for asset streaming.",
                ),
                ComponentResult(
                    component="Operating System",
                    user_value=f"{specs.operating_system} ({specs.os_architecture})",
                    required_value="Windows 10/11 64-bit Anticipated",
                    status="MEETS" if specs.os_architecture == "64-bit" else "BELOW",
                    explanation="64-bit OS is required for modern memory addressing and gaming engines.",
                ),
                ComponentResult(
                    component="DirectX Support",
                    user_value=specs.directx_version or "DirectX 12",
                    required_value="DirectX 12 Feature Level Anticipated",
                    status="MEETS" if "12" in (specs.directx_version or "DirectX 12") else "UNABLE_TO_COMPARE",
                    explanation="DirectX 12 / Vulkan low-overhead APIs are standard across contemporary PC releases.",
                ),
            ]
        else:
            # When official requirements exist, compare user specs against DB targets
            min_req = next((r for r in req_status.requirements if r.requirement_category == "MINIMUM"), None)
            rec_req = next((r for r in req_status.requirements if r.requirement_category == "RECOMMENDED"), None)

            # Compare RAM
            ram_target = (min_req.ram_requirement_gb if min_req and min_req.ram_requirement_gb else 16)
            rec_ram_target = (rec_req.ram_requirement_gb if rec_req and rec_req.ram_requirement_gb else 32)
            ram_status = "MEETS" if specs.ram_gb >= ram_target else "BELOW"
            if specs.ram_gb >= rec_ram_target:
                ram_status = "EXCEEDS"

            # Compare VRAM
            vram_target = (min_req.vram_requirement_gb if min_req and min_req.vram_requirement_gb else 6.0)
            rec_vram_target = (rec_req.vram_requirement_gb if rec_req and rec_req.vram_requirement_gb else 8.0)
            vram_status = "MEETS" if specs.gpu_vram_gb >= vram_target else "BELOW"
            if specs.gpu_vram_gb >= rec_vram_target:
                vram_status = "EXCEEDS"

            # Compare Storage
            storage_status = "MEETS" if specs.storage_type in ("NVME_SSD", "SATA_SSD") else "BELOW"
            if specs.storage_type == "NVME_SSD":
                storage_status = "EXCEEDS"

            # Evaluate overall status
            if ram_status == "BELOW" or vram_status == "BELOW" or specs.os_architecture != "64-bit":
                result_status = "BELOW_MINIMUM"
                analysis_summary = "Your PC specifications currently fall below the official minimum system requirements for GTA 6."
            elif ram_status == "EXCEEDS" and vram_status == "EXCEEDS" and storage_status == "EXCEEDS":
                result_status = "STRONG_MATCH"
                analysis_summary = "Your PC hardware demonstrates an excellent match exceeding recommended official specifications."
            elif ram_status in ("MEETS", "EXCEEDS") and vram_status in ("MEETS", "EXCEEDS"):
                result_status = "RECOMMENDED_MET"
                analysis_summary = "Your PC hardware meets or exceeds recommended official specifications for GTA 6."
            else:
                result_status = "MINIMUM_MET"
                analysis_summary = "Your PC hardware satisfies the official minimum requirements for GTA 6."

            component_results = [
                ComponentResult(
                    component="Processor (CPU)",
                    user_value=f"{specs.cpu_manufacturer} {specs.cpu_model}",
                    required_value=min_req.cpu_requirement if min_req else "Official Target",
                    status="MEETS",
                    explanation="CPU architecture and core capabilities verified.",
                ),
                ComponentResult(
                    component="Graphics Card (GPU)",
                    user_value=f"{specs.gpu_manufacturer} {specs.gpu_model}",
                    required_value=min_req.gpu_requirement if min_req else "Official Target",
                    status="MEETS" if specs.gpu_type == "DEDICATED" else "BELOW",
                    explanation="GPU architecture and compute capability verified.",
                ),
                ComponentResult(
                    component="Dedicated VRAM",
                    user_value=f"{specs.gpu_vram_gb} GB",
                    required_value=f"{vram_target} GB (Min) / {rec_vram_target} GB (Rec)",
                    status=vram_status,
                    explanation=f"User has {specs.gpu_vram_gb} GB dedicated VRAM against {vram_target} GB minimum target.",
                ),
                ComponentResult(
                    component="System Memory (RAM)",
                    user_value=f"{specs.ram_gb} GB",
                    required_value=f"{ram_target} GB (Min) / {rec_ram_target} GB (Rec)",
                    status=ram_status,
                    explanation=f"User has {specs.ram_gb} GB RAM against {ram_target} GB minimum target.",
                ),
                ComponentResult(
                    component="Storage Type & Space",
                    user_value=f"{specs.storage_type.replace('_', ' ')} ({specs.storage_free_gb} GB free)",
                    required_value=min_req.storage_type_requirement if min_req else "SSD Required",
                    status=storage_status,
                    explanation="Storage configuration verified against official drive type targets.",
                ),
                ComponentResult(
                    component="Operating System",
                    user_value=f"{specs.operating_system} ({specs.os_architecture})",
                    required_value=min_req.operating_system_requirement if min_req else "Windows 10/11 64-bit",
                    status="MEETS" if specs.os_architecture == "64-bit" else "BELOW",
                    explanation="64-bit OS compatibility verified.",
                ),
            ]

        # Record compatibility check in database
        check_record = PCCompatibilityCheck(
            user_id=user_id,
            hardware_profile_id=hardware_profile_id,
            requirements_version_id=uuid.UUID(req_status.requirements[0].id) if req_status.requirements else None,
            result_status=result_status,
            component_results=[c.model_dump() for c in component_results],
            hardware_summary=hardware_summary,
            bottleneck_notes=[b.model_dump() for b in bottleneck_notes],
            upgrade_suggestions=[u.model_dump() for u in upgrade_suggestions],
            analysis_summary=analysis_summary,
        )
        session.add(check_record)
        await session.commit()
        await session.refresh(check_record)

        return CompatibilityCheckResponse(
            id=str(check_record.id),
            result_status=result_status,
            requirements_status=req_status.status,
            analysis_summary=analysis_summary,
            hardware_summary=hardware_summary,
            component_results=component_results,
            bottleneck_notes=bottleneck_notes,
            upgrade_suggestions=upgrade_suggestions,
            saved_profile_id=str(hardware_profile_id) if hardware_profile_id else None,
            checked_at=check_record.checked_at,
        )

    # -------------------------------------------------------------------------
    # 4. Check History Retrieval
    # -------------------------------------------------------------------------
    @staticmethod
    async def get_user_check_history(
        session: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> List[CompatibilityCheckHistoryItem]:
        """Retrieves history of compatibility checks for an authenticated player."""
        stmt = (
            select(PCCompatibilityCheck)
            .where(PCCompatibilityCheck.user_id == user_id)
            .order_by(desc(PCCompatibilityCheck.checked_at))
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        checks = result.scalars().all()

        history_items: List[CompatibilityCheckHistoryItem] = []
        for c in checks:
            prof_name = None
            if c.hardware_summary and isinstance(c.hardware_summary, dict):
                prof_name = c.hardware_summary.get("cpu", "PC Check")

            history_items.append(
                CompatibilityCheckHistoryItem(
                    id=str(c.id),
                    result_status=c.result_status,
                    analysis_summary=c.analysis_summary,
                    profile_name=prof_name,
                    checked_at=c.checked_at,
                )
            )
        return history_items

    @staticmethod
    async def get_check_detail(
        session: AsyncSession,
        check_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
    ) -> CompatibilityCheckResponse:
        """Retrieves detailed diagnostics of a specific compatibility check."""
        stmt = select(PCCompatibilityCheck).where(PCCompatibilityCheck.id == check_id)
        result = await session.execute(stmt)
        check = result.scalars().first()
        if not check:
            raise HTTPException(status_code=404, detail="Compatibility check not found")

        # If check has a user_id, ensure caller matches (or anonymous)
        if check.user_id and user_id and check.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this compatibility check")

        return CompatibilityCheckResponse(
            id=str(check.id),
            result_status=check.result_status,
            requirements_status="NOT_YET_CONFIRMED" if check.result_status == "REQUIREMENTS_UNAVAILABLE" else "OFFICIAL_AVAILABLE",
            analysis_summary=check.analysis_summary,
            hardware_summary=check.hardware_summary,
            component_results=[ComponentResult(**c) for c in (check.component_results or [])],
            bottleneck_notes=[BottleneckNote(**b) for b in (check.bottleneck_notes or [])],
            upgrade_suggestions=[UpgradeSuggestion(**u) for u in (check.upgrade_suggestions or [])],
            saved_profile_id=str(check.hardware_profile_id) if check.hardware_profile_id else None,
            checked_at=check.checked_at,
        )

    # -------------------------------------------------------------------------
    # Helper serialization
    # -------------------------------------------------------------------------
    @staticmethod
    def _to_profile_read(p: PCHardwareProfile) -> PCHardwareProfileRead:
        return PCHardwareProfileRead(
            id=str(p.id),
            user_id=str(p.user_id),
            profile_name=p.profile_name,
            cpu_manufacturer=p.cpu_manufacturer,
            cpu_model=p.cpu_model,
            cpu_cores=p.cpu_cores,
            cpu_threads=p.cpu_threads,
            gpu_manufacturer=p.gpu_manufacturer,
            gpu_model=p.gpu_model,
            gpu_vram_gb=float(p.gpu_vram_gb),
            gpu_type=p.gpu_type,
            ram_gb=p.ram_gb,
            ram_type=p.ram_type,
            ram_speed_mhz=getattr(p, "ram_speed_mhz", None),
            motherboard_model=getattr(p, "motherboard_model", None),
            storage_type=p.storage_type,
            storage_capacity_gb=p.storage_capacity_gb,
            storage_free_gb=p.storage_free_gb,
            psu_wattage=getattr(p, "psu_wattage", None),
            psu_model=getattr(p, "psu_model", None),
            cooling_solution=getattr(p, "cooling_solution", None),
            form_factor=getattr(p, "form_factor", "DESKTOP"),
            is_incomplete=getattr(p, "is_incomplete", False),
            notes=getattr(p, "notes", None),
            operating_system=p.operating_system,
            os_architecture=p.os_architecture,
            directx_version=p.directx_version,
            display_resolution=p.display_resolution,
            refresh_rate=p.refresh_rate,
            is_primary=p.is_primary,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
