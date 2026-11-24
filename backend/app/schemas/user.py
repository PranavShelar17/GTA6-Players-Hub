import re
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PlayerProfileBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, description="Unique gamer username")
    display_name: str = Field(..., min_length=2, max_length=64, description="Player public display name")
    bio: Optional[str] = Field(None, max_length=500, description="Short player biography")
    country_code: Optional[str] = Field(None, max_length=3, description="ISO Country Code, e.g. USA, IND, GBR")
    preferred_platform: str = Field(default="PC", description="Primary gaming platform: PC, PS5, XBOX_SERIES")
    preferred_language: str = Field(default="en", max_length=10, description="Interface language")
    profile_visibility: str = Field(default="public", description="public or private")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
            raise ValueError("Username must be 3-30 characters and contain only letters, numbers, and underscores.")
        return v

    @field_validator("preferred_platform")
    @classmethod
    def validate_platform(cls, v: str) -> str:
        allowed = ["PC", "PS5", "XBOX_SERIES", "XBOX"]
        if v.upper() not in allowed:
            raise ValueError(f"Platform must be one of {allowed}")
        return v.upper()

    @field_validator("profile_visibility")
    @classmethod
    def validate_visibility(cls, v: str) -> str:
        if v.lower() not in ["public", "private"]:
            raise ValueError("Visibility must be either 'public' or 'private'")
        return v.lower()


class PlayerProfileCreate(PlayerProfileBase):
    pass


class PlayerProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=64)
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    bio: Optional[str] = Field(None, max_length=500)
    country_code: Optional[str] = Field(None, max_length=3)
    preferred_platform: Optional[str] = None
    preferred_language: Optional[str] = None
    profile_visibility: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
                raise ValueError("Username must be 3-30 characters and contain only letters, numbers, and underscores.")
        return v

    @field_validator("preferred_platform")
    @classmethod
    def validate_platform(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["PC", "PS5", "XBOX_SERIES", "XBOX"]
            if v.upper() not in allowed:
                raise ValueError(f"Platform must be one of {allowed}")
            return v.upper()
        return v

    @field_validator("profile_visibility")
    @classmethod
    def validate_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if v.lower() not in ["public", "private"]:
                raise ValueError("Visibility must be either 'public' or 'private'")
            return v.lower()
        return v


class PlayerProfileRead(PlayerProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    avatar_url: Optional[str] = None
    reputation_score: int = 0
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlayerPreferencesBase(BaseModel):
    preferred_country: str = Field(default="USA", max_length=3)
    preferred_currency: str = Field(default="USD", max_length=3)
    preferred_platform: str = Field(default="PC", max_length=20)
    preferred_edition: str = Field(default="Standard Edition", max_length=50)
    preferred_language: str = Field(default="en", max_length=10)
    email_notifications: bool = True
    push_notifications: bool = False
    community_notifications: bool = True
    news_notifications: bool = True
    price_alert_notifications: bool = True
    event_notifications: bool = True
    preferred_categories: Optional[str] = Field(None, description="Comma-separated or JSON list of preferred categories")
    theme: str = Field(default="dark", max_length=20)
    content_density: str = Field(default="comfortable", max_length=20)


class PlayerPreferencesUpdate(BaseModel):
    preferred_country: Optional[str] = None
    preferred_currency: Optional[str] = None
    preferred_platform: Optional[str] = None
    preferred_edition: Optional[str] = None
    preferred_language: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    community_notifications: Optional[bool] = None
    news_notifications: Optional[bool] = None
    price_alert_notifications: Optional[bool] = None
    event_notifications: Optional[bool] = None
    preferred_categories: Optional[str] = None
    theme: Optional[str] = None
    content_density: Optional[str] = None


class PlayerPreferencesRead(PlayerPreferencesBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlayerActivityRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    activity_type: str
    description: str
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: str
    profile: Optional[PlayerProfileRead] = None
    preferences: Optional[PlayerPreferencesRead] = None
    recent_activities: List[PlayerActivityRead] = []


class UsernameAvailabilityResponse(BaseModel):
    username: str
    is_available: bool
    message: str


class SyncUserRequest(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
