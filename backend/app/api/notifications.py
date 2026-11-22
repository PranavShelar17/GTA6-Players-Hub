import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.schemas.envelope import ApiResponse
from app.schemas.notification import (
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    NotificationRead,
    PushSubscriptionCreate,
    PushSubscriptionRead,
    UnreadCountResponse,
)
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notification Centre"])


@router.get("", response_model=ApiResponse[List[NotificationRead]])
async def list_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    notification_type: Optional[str] = Query(None, description="Filter by type (NEWS_UPDATE, PRICE_DROP, EVENT_REMINDER, etc.)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves paginated notifications for the authenticated player."""
    # Seed starter notifications for fresh players so the centre has content
    await notification_service.seed_initial_player_notifications(db, current_user.id)

    notifications, total = await notification_service.get_player_notifications(
        db=db,
        user_id=current_user.id,
        is_read=is_read,
        notification_type=notification_type,
        page=page,
        limit=limit,
    )
    return ApiResponse(success=True, data=notifications)


@router.get("/unread-count", response_model=ApiResponse[UnreadCountResponse])
async def get_unread_count(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the total number of unread notifications and breakdown by category."""
    # Seed starter notifications if needed
    await notification_service.seed_initial_player_notifications(db, current_user.id)

    counts = await notification_service.get_unread_count(db, current_user.id)
    return ApiResponse(success=True, data=counts)


@router.patch("/{notification_id}/read", response_model=ApiResponse[dict])
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks a single notification as read."""
    updated = await notification_service.mark_notification_as_read(
        db, current_user.id, notification_id
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or does not belong to you.",
        )
    return ApiResponse(success=True, data={"marked_as_read": True})


@router.post("/mark-all-read", response_model=ApiResponse[dict])
async def mark_all_read(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks all unread notifications as read for the authenticated player."""
    count = await notification_service.mark_all_notifications_as_read(db, current_user.id)
    return ApiResponse(success=True, data={"marked_count": count})


@router.delete("/{notification_id}", response_model=ApiResponse[dict])
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismisses and permanently deletes a notification."""
    deleted = await notification_service.delete_notification(
        db, current_user.id, notification_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or does not belong to you.",
        )
    return ApiResponse(success=True, data={"deleted": True})


@router.get("/preferences", response_model=ApiResponse[NotificationPreferencesRead])
async def get_notification_preferences(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves player notification channel preferences and reminder settings."""
    pref = await notification_service.get_or_create_preferences(db, current_user.id)
    return ApiResponse(
        success=True,
        data=NotificationPreferencesRead(
            in_app_enabled=pref.in_app_enabled,
            email_enabled=pref.email_enabled,
            push_enabled=pref.push_enabled,
            news_updates=pref.news_updates,
            price_alerts=pref.price_alerts,
            event_reminders=pref.event_reminders,
            community_activity=pref.community_activity,
            platform_announcements=pref.platform_announcements,
            default_reminder_minutes=pref.default_reminder_minutes,
            quiet_hours_enabled=pref.quiet_hours_enabled,
            quiet_hours_start=pref.quiet_hours_start,
            quiet_hours_end=pref.quiet_hours_end,
            timezone=pref.timezone,
        )
    )


@router.patch("/preferences", response_model=ApiResponse[NotificationPreferencesRead])
async def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates notification channels, category opt-outs, and quiet hour schedules."""
    updated = await notification_service.update_player_preferences(db, current_user.id, data)
    return ApiResponse(success=True, data=updated)


@router.post("/push/subscribe", response_model=ApiResponse[PushSubscriptionRead])
async def subscribe_push(
    data: PushSubscriptionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Registers a browser Web Push subscription for the player."""
    sub = await notification_service.register_push_subscription(db, current_user.id, data)
    return ApiResponse(success=True, data=sub)


@router.delete("/push/unsubscribe", response_model=ApiResponse[dict])
async def unsubscribe_push(
    endpoint: str = Query(..., description="Browser push endpoint to deactivate"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivates a browser Web Push subscription endpoint."""
    success = await notification_service.unsubscribe_push(db, current_user.id, endpoint)
    return ApiResponse(success=True, data={"unsubscribed": success})
