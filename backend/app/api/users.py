import base64
import os
import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.logging import logger
from app.core.security import CurrentUser, get_current_user
from app.models.user import PlayerActivity, PlayerPreferences, PlayerProfile
from app.schemas.envelope import ApiResponse
from app.schemas.user import (
    PlayerActivityRead,
    PlayerPreferencesRead,
    PlayerPreferencesUpdate,
    PlayerProfileRead,
    PlayerProfileUpdate,
    SyncUserRequest,
    UserMeResponse,
    UsernameAvailabilityResponse,
)

router = APIRouter(prefix="/users", tags=["Player Users & Profiles"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB


async def _get_or_create_player_data(
    user: CurrentUser, 
    db: AsyncSession,
    requested_username: Optional[str] = None,
    requested_display_name: Optional[str] = None
) -> tuple[PlayerProfile, PlayerPreferences]:
    """Ensures a player profile and preferences record exist for the user."""
    # Check profile
    profile_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user.id)
    result = await db.execute(profile_stmt)
    profile = result.scalar_one_or_none()

    # Check preferences
    pref_stmt = select(PlayerPreferences).where(PlayerPreferences.user_id == user.id)
    pref_result = await db.execute(pref_stmt)
    preferences = pref_result.scalar_one_or_none()

    if not profile:
        # Determine unique username
        candidate_username = requested_username or user.username
        if not candidate_username:
            email_prefix = user.email.split("@")[0]
            sanitized = re.sub(r"[^a-zA-Z0-9_]", "", email_prefix)[:20]
            candidate_username = sanitized if len(sanitized) >= 3 else f"Player_{uuid.uuid4().hex[:6]}"

        # Ensure username uniqueness
        existing_check = await db.execute(
            select(PlayerProfile).where(func.lower(PlayerProfile.username) == candidate_username.lower())
        )
        if existing_check.scalar_one_or_none():
            candidate_username = f"{candidate_username[:20]}_{uuid.uuid4().hex[:4]}"

        display_name = requested_display_name or user.display_name or candidate_username

        profile = PlayerProfile(
            user_id=user.id,
            username=candidate_username,
            display_name=display_name,
            preferred_platform="PC",
            preferred_language="en",
            profile_visibility="public",
            reputation_score=10,
            is_verified=False
        )
        db.add(profile)

        # Log account created activity
        activity = PlayerActivity(
            user_id=user.id,
            activity_type="account_registered",
            description="Player account and profile created."
        )
        db.add(activity)

    if not preferences:
        preferences = PlayerPreferences(
            user_id=user.id,
            preferred_country="USA",
            preferred_currency="USD",
            preferred_platform="PC",
            preferred_edition="Standard Edition",
            email_notifications=True,
            community_notifications=True,
            news_notifications=True,
            price_alert_notifications=True,
            event_notifications=True
        )
        db.add(preferences)

    await db.commit()
    await db.refresh(profile)
    await db.refresh(preferences)
    return profile, preferences


@router.get("/check-username", response_model=ApiResponse[UsernameAvailabilityResponse])
async def check_username_availability(
    username: str = Query(..., description="Username to check"),
    db: AsyncSession = Depends(get_db)
):
    """Checks whether a given username is valid and available."""
    username = username.strip()
    if not re.match(r"^[a-zA-Z0-9_]{3,30}$", username):
        return ApiResponse(
            success=True,
            data=UsernameAvailabilityResponse(
                username=username,
                is_available=False,
                message="Username must be 3-30 characters long and contain only letters, numbers, and underscores."
            )
        )

    stmt = select(PlayerProfile).where(func.lower(PlayerProfile.username) == username.lower())
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        return ApiResponse(
            success=True,
            data=UsernameAvailabilityResponse(
                username=username,
                is_available=False,
                message="Username is already taken by another player."
            )
        )

    return ApiResponse(
        success=True,
        data=UsernameAvailabilityResponse(
            username=username,
            is_available=True,
            message="Username is available."
        )
    )


@router.get("/me", response_model=ApiResponse[UserMeResponse])
async def get_current_player(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves authenticated user details, profile, preferences, and recent activity."""
    profile, preferences = await _get_or_create_player_data(user, db)

    activity_stmt = (
        select(PlayerActivity)
        .where(PlayerActivity.user_id == user.id)
        .order_by(PlayerActivity.created_at.desc())
        .limit(10)
    )
    act_result = await db.execute(activity_stmt)
    activities = act_result.scalars().all()

    return ApiResponse(
        success=True,
        data=UserMeResponse(
            id=user.id,
            email=user.email,
            profile=PlayerProfileRead.model_validate(profile),
            preferences=PlayerPreferencesRead.model_validate(preferences),
            recent_activities=[PlayerActivityRead.model_validate(a) for a in activities]
        )
    )


@router.post("/sync", response_model=ApiResponse[UserMeResponse])
async def sync_player(
    payload: SyncUserRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Explicitly initializes or syncs profile records on login/signup."""
    profile, preferences = await _get_or_create_player_data(
        user, 
        db, 
        requested_username=payload.username, 
        requested_display_name=payload.display_name
    )

    return ApiResponse(
        success=True,
        data=UserMeResponse(
            id=user.id,
            email=user.email,
            profile=PlayerProfileRead.model_validate(profile),
            preferences=PlayerPreferencesRead.model_validate(preferences),
            recent_activities=[]
        )
    )


@router.get("/me/profile", response_model=ApiResponse[PlayerProfileRead])
async def get_my_profile(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated player's profile."""
    profile, _ = await _get_or_create_player_data(user, db)
    return ApiResponse(
        success=True,
        data=PlayerProfileRead.model_validate(profile)
    )


@router.put("/me/profile", response_model=ApiResponse[PlayerProfileRead])
async def update_my_profile(
    payload: PlayerProfileUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the authenticated player's profile details."""
    profile, _ = await _get_or_create_player_data(user, db)

    # Validate username uniqueness if changing
    if payload.username and payload.username.lower() != profile.username.lower():
        existing_check = await db.execute(
            select(PlayerProfile).where(
                func.lower(PlayerProfile.username) == payload.username.lower(),
                PlayerProfile.user_id != user.id
            )
        )
        if existing_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already claimed by another player."
            )
        profile.username = payload.username

    if payload.display_name is not None:
        profile.display_name = payload.display_name
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.country_code is not None:
        profile.country_code = payload.country_code
    if payload.preferred_platform is not None:
        profile.preferred_platform = payload.preferred_platform
    if payload.preferred_language is not None:
        profile.preferred_language = payload.preferred_language
    if payload.profile_visibility is not None:
        profile.profile_visibility = payload.profile_visibility

    # Log profile updated activity
    client_ip = request.client.host if request.client else None
    activity = PlayerActivity(
        user_id=user.id,
        activity_type="profile_updated",
        description="Player profile updated.",
        ip_address=client_ip
    )
    db.add(activity)

    await db.commit()
    await db.refresh(profile)

    return ApiResponse(
        success=True,
        data=PlayerProfileRead.model_validate(profile)
    )


@router.get("/me/preferences", response_model=ApiResponse[PlayerPreferencesRead])
async def get_my_preferences(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated player's account preferences."""
    _, preferences = await _get_or_create_player_data(user, db)
    return ApiResponse(
        success=True,
        data=PlayerPreferencesRead.model_validate(preferences)
    )


@router.put("/me/preferences", response_model=ApiResponse[PlayerPreferencesRead])
async def update_my_preferences(
    payload: PlayerPreferencesUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the authenticated player's account preferences."""
    _, preferences = await _get_or_create_player_data(user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)

    # Log preferences updated
    client_ip = request.client.host if request.client else None
    activity = PlayerActivity(
        user_id=user.id,
        activity_type="preferences_updated",
        description="Account preferences updated.",
        ip_address=client_ip
    )
    db.add(activity)

    await db.commit()
    await db.refresh(preferences)

    return ApiResponse(
        success=True,
        data=PlayerPreferencesRead.model_validate(preferences)
    )


@router.post("/me/avatar", response_model=ApiResponse[PlayerProfileRead])
async def upload_player_avatar(
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads and updates player avatar.
    Validates MIME type, file size limit (2MB), and stores securely.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{file.content_type}'. Supported formats: JPEG, PNG, WEBP, GIF."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 2 MB."
        )

    # Convert to secure data URI or persist
    # Using data URI provides zero-dependency, safe, portable avatar rendering
    encoded = base64.b64encode(content).decode("utf-8")
    avatar_url = f"data:{file.content_type};base64,{encoded}"

    profile, _ = await _get_or_create_player_data(user, db)
    profile.avatar_url = avatar_url

    activity = PlayerActivity(
        user_id=user.id,
        activity_type="avatar_updated",
        description="Player avatar changed."
    )
    db.add(activity)

    await db.commit()
    await db.refresh(profile)

    return ApiResponse(
        success=True,
        data=PlayerProfileRead.model_validate(profile)
    )


@router.delete("/me/avatar", response_model=ApiResponse[PlayerProfileRead])
async def remove_player_avatar(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Removes current custom avatar and resets to default."""
    profile, _ = await _get_or_create_player_data(user, db)
    profile.avatar_url = None

    activity = PlayerActivity(
        user_id=user.id,
        activity_type="avatar_removed",
        description="Player avatar removed (reset to default)."
    )
    db.add(activity)

    await db.commit()
    await db.refresh(profile)

    return ApiResponse(
        success=True,
        data=PlayerProfileRead.model_validate(profile)
    )


@router.get("/me/activity", response_model=ApiResponse[List[PlayerActivityRead]])
async def get_my_activity(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves account security and profile activity logs."""
    stmt = (
        select(PlayerActivity)
        .where(PlayerActivity.user_id == user.id)
        .order_by(PlayerActivity.created_at.desc())
        .limit(25)
    )
    result = await db.execute(stmt)
    activities = result.scalars().all()

    return ApiResponse(
        success=True,
        data=[PlayerActivityRead.model_validate(a) for a in activities]
    )


@router.delete("/me", response_model=ApiResponse[dict])
async def delete_my_account(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes player profile, preferences, and activity records.
    (Account deletion workflow adhering to privacy regulations).
    """
    # Delete preferences
    pref_stmt = select(PlayerPreferences).where(PlayerPreferences.user_id == user.id)
    pref_res = await db.execute(pref_stmt)
    pref = pref_res.scalar_one_or_none()
    if pref:
        await db.delete(pref)

    # Delete profile
    prof_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user.id)
    prof_res = await db.execute(prof_stmt)
    prof = prof_res.scalar_one_or_none()
    if prof:
        await db.delete(prof)

    # Delete activities
    act_stmt = select(PlayerActivity).where(PlayerActivity.user_id == user.id)
    act_res = await db.execute(act_stmt)
    for act in act_res.scalars().all():
        await db.delete(act)

    await db.commit()

    return ApiResponse(
        success=True,
        data={"message": "Player account and associated data successfully removed."}
    )
