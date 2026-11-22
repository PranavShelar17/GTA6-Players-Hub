from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class EventCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "calendar"
    color: Optional[str] = "#f97316"
    is_active: bool = True
    events_count: int = 0


class EventSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    website_url: str
    source_type: str
    reliability_score: int = 100


class EventListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    description: str
    short_summary: Optional[str] = None
    category_id: str
    category_name: str
    category_slug: str
    category_color: Optional[str] = "#f97316"
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    timezone: str = "UTC"
    location_type: str = "ONLINE"
    location_name: Optional[str] = None
    event_url: Optional[str] = None
    stream_url: Optional[str] = None
    verification_status: str = Field(description="OFFICIAL, VERIFIED, COMMUNITY, UNCONFIRMED")
    is_featured: bool = False
    is_cancelled: bool = False
    banner_image_url: Optional[str] = None
    organizer_name: str = "Rockstar Games"
    tags: Optional[str] = None
    is_saved: bool = False
    has_reminder: bool = False
    reminders_count: int = 0


class EventReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    event_id: str
    lead_time_minutes: int
    channel: str
    is_sent: bool
    sent_at: Optional[datetime] = None
    created_at: datetime
    event_title: Optional[str] = None
    event_slug: Optional[str] = None
    event_start_time: Optional[datetime] = None


class EventReminderCreate(BaseModel):
    lead_time_minutes: int = Field(default=60, description="Minutes before event: 15, 60, 1440")
    channel: str = Field(default="IN_APP", description="Channel: IN_APP, EMAIL, PUSH")


class SavedEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    event_id: str
    notes: Optional[str] = None
    created_at: datetime
    event: Optional[EventListItem] = None


class SavedEventCreate(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=500)


class EventDetail(EventListItem):
    reminders: List[EventReminderRead] = []
    related_events: List[EventListItem] = []
