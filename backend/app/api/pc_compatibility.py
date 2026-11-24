"""PC Compatibility Checker & Hardware Profile API Router.

Provides endpoints for official requirements status, player hardware profiles,
hardware balance/bottleneck diagnostics, and compatibility check execution.
"""

from typing import Any, Dict, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.schemas.pc_compatibility import (
    CompatibilityCheckHistoryItem,
    CompatibilityCheckRequest,
    CompatibilityCheckResponse,
    GameSystemRequirementRead,
    GamingPCRecommendationsResponse,
    PCProfileComparisonRequest,
    PCProfileComparisonResponse,
    PCHardwareProfileCreate,
    PCHardwareProfileRead,
    PCHardwareProfileUpdate,
    RequirementsStatusResponse,
    UserPCRecommendationComparisonRequest,
    UserVsRecommendationComparisonResponse,
)
from app.services.pc_compatibility_service import PCCompatibilityService

router = APIRouter(prefix="/pc", tags=["PC Compatibility Checker"])


# -----------------------------------------------------------------------------
# Requirements Endpoints (Public)
# -----------------------------------------------------------------------------
@router.get("/requirements/status", response_model=RequirementsStatusResponse)
async def get_requirements_status(
    db: AsyncSession = Depends(get_db),
):
    """Returns official requirements confirmation status and active specifications."""
    return await PCCompatibilityService.get_requirements_status(db)


@router.get("/requirements", response_model=List[GameSystemRequirementRead])
async def list_requirements(
    db: AsyncSession = Depends(get_db),
):
    """Returns list of game system requirement specifications stored in database."""
    status_resp = await PCCompatibilityService.get_requirements_status(db)
    return status_resp.requirements


# -----------------------------------------------------------------------------
# Hardware Profile Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@router.get("/profiles", response_model=List[PCHardwareProfileRead])
async def list_hardware_profiles(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all saved PC hardware profiles for the authenticated player."""
    return await PCCompatibilityService.list_user_profiles(db, current_user.id)


@router.post("/profiles", response_model=PCHardwareProfileRead, status_code=status.HTTP_201_CREATED)
async def create_hardware_profile(
    profile_in: PCHardwareProfileCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new saved PC hardware profile for the authenticated player."""
    return await PCCompatibilityService.create_profile(db, current_user.id, profile_in)


@router.get("/profiles/{profile_id}", response_model=PCHardwareProfileRead)
async def get_hardware_profile(
    profile_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a specific hardware profile by ID (ownership enforced)."""
    return await PCCompatibilityService.get_profile(db, profile_id, current_user.id)


@router.put("/profiles/{profile_id}", response_model=PCHardwareProfileRead)
async def update_hardware_profile(
    profile_id: uuid.UUID,
    profile_update: PCHardwareProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates a saved hardware profile (ownership enforced)."""
    return await PCCompatibilityService.update_profile(db, profile_id, current_user.id, profile_update)


@router.delete("/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hardware_profile(
    profile_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a saved hardware profile (ownership enforced)."""
    await PCCompatibilityService.delete_profile(db, profile_id, current_user.id)
    return None


@router.post("/profiles/{profile_id}/set-primary", response_model=PCHardwareProfileRead)
async def set_primary_profile(
    profile_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks a saved configuration as the player's primary / current gaming rig."""
    return await PCCompatibilityService.set_primary_profile(db, profile_id, current_user.id)


@router.post("/profiles/compare", response_model=PCProfileComparisonResponse)
async def compare_saved_profiles(
    comparison_req: PCProfileComparisonRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compares 2 or more saved PC configurations belonging to the player and displays hardware deltas."""
    return await PCCompatibilityService.compare_user_profiles(db, comparison_req.profile_ids, current_user.id)


# -----------------------------------------------------------------------------
# Top 3 Recommendations & Smart Comparison Endpoints
# -----------------------------------------------------------------------------
@router.get("/recommendations", response_model=GamingPCRecommendationsResponse)
async def get_recommended_gaming_pcs(
    budget: str = Query("ANY", description="Budget filter: ANY, BUDGET, MID, HIGH"),
    intended_use: str = Query("GTA_6_PREPARATION", description="Gaming use case"),
    currency: str = Query("USD", description="Currency: USD or INR"),
):
    """Returns top 3 curated gaming PC configurations (High-End, Mid-Range, Entry-Level) and personalized match."""
    return PCCompatibilityService.get_top_3_recommendations(budget=budget, intended_use=intended_use, currency=currency)


@router.post("/recommendations/compare", response_model=UserVsRecommendationComparisonResponse)
async def compare_user_pc_with_recommendations(
    request: Optional[Dict[str, Any]] = None,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compares user's current PC against all three recommended gaming configurations with power headroom analysis."""
    user_id = current_user.id if current_user else None
    profile_id = None
    specs = None

    if request:
        if "profile_id" in request and request["profile_id"]:
            profile_id = request["profile_id"]
        if "custom_specs" in request and request["custom_specs"]:
            specs = PCHardwareProfileCreate(**request["custom_specs"])
        elif "cpu_model" in request:
            specs = PCHardwareProfileCreate(**{k: v for k, v in request.items() if k != "profile_id"})

    return await PCCompatibilityService.compare_user_pc_with_recommendations(
        db, user_id=user_id, profile_id=profile_id, custom_specs=specs
    )


# -----------------------------------------------------------------------------
# Compatibility Check & Diagnostics
# -----------------------------------------------------------------------------
@router.post("/compatibility/check", response_model=CompatibilityCheckResponse)
async def run_compatibility_check(
    request: CompatibilityCheckRequest,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Runs a compatibility analysis against verified requirements or balance baseline.
    
    Supports both authenticated players (optionally saving/linking profile) and anonymous visitors.
    Strictly observes anti-fabrication rules when official requirements are unconfirmed.
    """
    user_id = current_user.id if current_user else None
    return await PCCompatibilityService.run_compatibility_check(db, user_id, request)


@router.get("/compatibility/history", response_model=List[CompatibilityCheckHistoryItem])
async def get_compatibility_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves recent compatibility checks for the authenticated player."""
    return await PCCompatibilityService.get_user_check_history(db, current_user.id, limit=limit, offset=offset)


@router.get("/compatibility/history/{check_id}", response_model=CompatibilityCheckResponse)
async def get_compatibility_check_detail(
    check_id: uuid.UUID,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full diagnostics for a specific previous check."""
    user_id = current_user.id if current_user else None
    return await PCCompatibilityService.get_check_detail(db, check_id, user_id)
