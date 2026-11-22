from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    message: str
    notification_type: str = Field(
        description="NEWS_UPDATE, PRICE_DROP, EVENT_REMINDER, EVENT_UPDATE, PLATFORM_ANNOUNCEMENT, ACCOUNT_SECURITY"
    )
    reference_id: Optional[str] = None
    reference_url: Optional[str] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    priority: str = "NORMAL"
    created_at: datetime


class UnreadCountResponse(BaseModel):
    total_unread: int
    unread_by_type: Dict[str, int] = {}


class NotificationPreferencesRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    in_app_enabled: bool = True
    email_enabled: bool = True
    push_enabled: bool = False
    news_updates: bool = True
    price_alerts: bool = True
    event_reminders: bool = True
    community_activity: bool = True
    platform_announcements: bool = True
    default_reminder_minutes: int = 60
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    timezone: str = "UTC"


class NotificationPreferencesUpdate(BaseModel):
    in_app_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    news_updates: Optional[bool] = None
    price_alerts: Optional[bool] = None
    event_reminders: Optional[bool] = None
    community_activity: Optional[bool] = None
    platform_announcements: Optional[bool] = None
    default_reminder_minutes: Optional[int] = Field(None, ge=5, le=10080)
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    timezone: Optional[str] = None


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
    user_agent: Optional[str] = None


class PushSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    endpoint: str
    is_active: bool
    created_at: datetime
