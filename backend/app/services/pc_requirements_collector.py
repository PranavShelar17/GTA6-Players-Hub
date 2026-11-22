"""GTA 6 System Requirements Collector & Initial Seeder.

Maintains verified and official system requirements for GTA 6.
Enforces the critical anti-fabrication rule:
Official GTA 6 PC system requirements have NOT yet been confirmed by Rockstar Games.
Until officially released, active requirements are marked UNCONFIRMED and is_active=False.
"""

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.pc_compatibility import GameSystemRequirement


async def seed_initial_system_requirements(session: AsyncSession) -> int:
    """Seeds baseline GTA 6 PC system requirements marked as UNCONFIRMED.
    
    Ensures that the truth verification engine has a clear record showing that
    official requirements have not yet been confirmed by Rockstar Games.
    """
    stmt = select(GameSystemRequirement).limit(1)
    result = await session.execute(stmt)
    existing = result.scalars().first()

    if existing:
        return 0

    now = datetime.now(timezone.utc)

    # We insert standard placeholder records explicitly marked UNCONFIRMED and INACTIVE.
    # This prevents any fake numbers or fabricated requirements from being presented.
    unconfirmed_records = [
        GameSystemRequirement(
            game_name="Grand Theft Auto VI",
            platform="PC",
            requirement_category="MINIMUM",
            cpu_requirement=None,
            cpu_min_cores=None,
            gpu_requirement=None,
            vram_requirement_gb=None,
            ram_requirement_gb=None,
            storage_requirement_gb=None,
            storage_type_requirement="SSD Required (Anticipated)",
            operating_system_requirement="Windows 10/11 64-bit",
            directx_requirement="DirectX 12",
            source_url="https://www.rockstargames.com/newswire",
            source_name="Rockstar Games Official Newswire",
            verification_status="UNCONFIRMED",
            is_active=False,
            notes=(
                "Official GTA 6 PC system requirements have not yet been confirmed by Rockstar Games. "
                "Any third-party rumors, speculative leaks, or arbitrary tier listings are excluded "
                "to maintain strict player trust and data integrity."
            ),
            published_at=None,
            last_verified_at=now,
        ),
        GameSystemRequirement(
            game_name="Grand Theft Auto VI",
            platform="PC",
            requirement_category="RECOMMENDED",
            cpu_requirement=None,
            cpu_min_cores=None,
            gpu_requirement=None,
            vram_requirement_gb=None,
            ram_requirement_gb=None,
            storage_requirement_gb=None,
            storage_type_requirement="NVMe SSD Recommended (Anticipated)",
            operating_system_requirement="Windows 11 64-bit",
            directx_requirement="DirectX 12 Ultimate",
            source_url="https://www.rockstargames.com/newswire",
            source_name="Rockstar Games Official Newswire",
            verification_status="UNCONFIRMED",
            is_active=False,
            notes=(
                "Official recommended specifications will be published upon official PC announcement by Rockstar Games."
            ),
            published_at=None,
            last_verified_at=now,
        ),
    ]

    session.add_all(unconfirmed_records)
    await session.commit()
    logger.info("Seeded baseline GTA 6 PC requirements placeholders (UNCONFIRMED).")
    return len(unconfirmed_records)
