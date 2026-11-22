import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, get_optional_current_user
from app.schemas.envelope import ApiResponse, ErrorObject
from app.schemas.event import (
    EventCategoryRead,
    EventDetail,
    EventListItem,
    EventReminderCreate,
    EventReminderRead,
    SavedEventCreate,
    SavedEventRead,
)
from app.services import event_service
from app.services.event_collector import seed_initial_events

router = APIRouter(prefix="/events", tags=["Events Calendar"])


@router.get("/categories", response_model=ApiResponse[List[EventCategoryRead]])
async def list_event_categories(db: AsyncSession = Depends(get_db)):
    """Retrieves all active event categories with total event counts."""
    categories = await event_service.get_event_categories(db)
    if not categories:
        await seed_initial_events(db)
        categories = await event_service.get_event_categories(db)
    return ApiResponse(
        success=True,
        data=[EventCategoryRead(**c) for c in categories]
    )


@router.get("", response_model=ApiResponse[List[EventListItem]])
async def list_events(
    category: Optional[str] = Query(None, description="Category slug"),
    status: Optional[str] = Query(None, description="Verification status: OFFICIAL, VERIFIED, COMMUNITY, UNCONFIRMED"),
    timeframe: str = Query("upcoming", description="Timeframe filter: upcoming, past, all"),
    search: Optional[str] = Query(None, description="Search term for title/description/organizer"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves events filtered by category, verification status, and timeframe.
    Includes player saved and reminder indicators when authenticated.
    """
    user_id = current_user.id if current_user else None
    events, total = await event_service.get_events(
        db=db,
        user_id=user_id,
        category_slug=category,
        verification_status=status,
        timeframe=timeframe,
        search=search,
        page=page,
        limit=limit,
    )
    if not events and not search and not category and not status:
        await seed_initial_events(db)
        events, total = await event_service.get_events(
            db=db,
            user_id=user_id,
            category_slug=category,
            verification_status=status,
            timeframe=timeframe,
            search=search,
            page=page,
            limit=limit,
        )
    return ApiResponse(success=True, data=events)


@router.get("/saved", response_model=ApiResponse[List[SavedEventRead]])
async def get_saved_events(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all events saved to the authenticated player's personal calendar."""
    saved = await event_service.get_player_saved_events(db, current_user.id)
    return ApiResponse(success=True, data=saved)


@router.get("/reminders", response_model=ApiResponse[List[EventReminderRead]])
async def get_event_reminders(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves active event reminders set by the authenticated player."""
    reminders = await event_service.get_player_event_reminders(db, current_user.id)
    return ApiResponse(success=True, data=reminders)


@router.get("/{slug}", response_model=ApiResponse[EventDetail])
async def get_event_detail(
    slug: str,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves complete event details, timezone metadata, and player actions."""
    user_id = current_user.id if current_user else None
    event = await event_service.get_event_by_slug(db, slug, user_id)
    if not event:
        await seed_initial_events(db)
        event = await event_service.get_event_by_slug(db, slug, user_id)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with slug '{slug}' was not found.",
        )
    return ApiResponse(success=True, data=event)


@router.post("/{event_id}/save", response_model=ApiResponse[dict])
async def save_event(
    event_id: uuid.UUID,
    data: Optional[SavedEventCreate] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Saves or unsaves an event for the authenticated player."""
    notes = data.notes if data else None
    try:
        is_saved, msg = await event_service.toggle_save_event(db, current_user.id, event_id, notes)
        return ApiResponse(success=True, data={"is_saved": is_saved, "message": msg})
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{event_id}/save", response_model=ApiResponse[dict])
async def unsave_event(
    event_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes an event from the authenticated player's saved list."""
    try:
        is_saved, msg = await event_service.toggle_save_event(db, current_user.id, event_id)
        return ApiResponse(success=True, data={"is_saved": is_saved, "message": msg})
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{event_id}/reminders", response_model=ApiResponse[EventReminderRead])
async def add_event_reminder(
    event_id: uuid.UUID,
    data: EventReminderCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a notification reminder for an upcoming event."""
    try:
        reminder = await event_service.create_event_reminder(db, current_user.id, event_id, data)
        return ApiResponse(success=True, data=reminder)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/reminders/{reminder_id}", response_model=ApiResponse[dict])
async def remove_event_reminder(
    reminder_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes an active event reminder."""
    deleted = await event_service.delete_event_reminder(db, current_user.id, reminder_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found or already deleted.",
        )
    return ApiResponse(success=True, data={"deleted": True, "message": "Reminder cancelled."})
