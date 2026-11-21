from typing import List, Optional
from pydantic import BaseModel, Field


class HomeNewsItem(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    source_name: str
    source_url: str
    published_at: str
    verification_status: str = Field(description="OFFICIAL, VERIFIED, RUMOUR, UNCONFIRMED")
    category: str
    thumbnail_url: Optional[str] = None


class HomeDealItem(BaseModel):
    id: str
    edition_name: str
    platform: str
    country_code: str
    current_price: float
    currency: str
    original_price: Optional[float] = None
    discount_percentage: int = 0
    retailer_name: str
    product_url: str
    last_checked_at: str
    is_preorder: bool = True


class HomeEventItem(BaseModel):
    id: str
    event_name: str
    category: str
    date_string: str
    start_time_iso: str
    timezone: str = "UTC"
    description: str
    is_official: bool = True


class HomeCommunityHighlight(BaseModel):
    id: str
    title: str
    author_username: str
    author_avatar_url: Optional[str] = None
    author_platform: str = "PC"
    category: str
    published_at: str
    replies_count: int = 0
    likes_count: int = 0


class HomeAggregatedResponse(BaseModel):
    news: List[HomeNewsItem]
    deals: List[HomeDealItem]
    events: List[HomeEventItem]
    community: List[HomeCommunityHighlight]
    disclaimer: str
