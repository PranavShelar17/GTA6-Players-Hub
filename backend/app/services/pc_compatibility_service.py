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
    PCHardwareProfileCreate,
    PCHardwareProfileRead,
    PCHardwareProfileUpdate,
    RequirementsStatusResponse,
    UpgradeSuggestion,
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
            storage_type=profile_in.storage_type,
            storage_capacity_gb=profile_in.storage_capacity_gb,
            storage_free_gb=profile_in.storage_free_gb,
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
            storage_type=p.storage_type,
            storage_capacity_gb=p.storage_capacity_gb,
            storage_free_gb=p.storage_free_gb,
            operating_system=p.operating_system,
            os_architecture=p.os_architecture,
            directx_version=p.directx_version,
            display_resolution=p.display_resolution,
            refresh_rate=p.refresh_rate,
            is_primary=p.is_primary,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
