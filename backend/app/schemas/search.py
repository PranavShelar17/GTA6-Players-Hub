import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    id: str
    content_type: str = Field(..., description="NEWS, DEALS, EVENTS, COMMUNITY, HELP")
    content_id: str
    title: str
    description: Optional[str] = None
    category: str
    url_path: str
    thumbnail_url: Optional[str] = None
    verification_status: str = "VERIFIED"
    source_or_author: Optional[str] = None
    published_or_event_at: Optional[datetime] = None
    price_display: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    query: str
    category_filter: str
    sort: str


class SearchSuggestionItem(BaseModel):
    title: str
    category: str
    content_type: str
    url_path: str


class SearchSuggestionsResponse(BaseModel):
    query: str
    suggestions: List[SearchSuggestionItem]
    popular: List[str]


class SearchHistoryItem(BaseModel):
    id: str
    query: str
    category_filter: Optional[str] = None
    results_count: int = 0
    searched_at: datetime


class SearchHistoryCreate(BaseModel):
    query: str = Field(..., min_length=1, max_length=255)
    category_filter: Optional[str] = Field(None, max_length=32)
    results_count: Optional[int] = 0


class SearchCategoriesStats(BaseModel):
    all: int = 0
    news: int = 0
    deals: int = 0
    events: int = 0
    community: int = 0
    help: int = 0


class UnifiedSavedItem(BaseModel):
    id: str
    saved_type: str = Field(..., description="NEWS, DEALS, EVENTS, COMMUNITY")
    saved_at: datetime
    title: str
    description: Optional[str] = None
    url_path: str
    thumbnail_url: Optional[str] = None
    badge: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UnifiedSavedContentResponse(BaseModel):
    items: List[UnifiedSavedItem]
    total: int
    counts_by_type: Dict[str, int]
    page: int
    page_size: int
    total_pages: int
