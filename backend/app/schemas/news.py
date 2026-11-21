from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class NewsSourceRead(BaseModel):
    id: str
    name: str
    website_url: str
    source_type: str
    trust_level: str
    is_enabled: bool


class NewsCategoryRead(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    articles_count: int = 0


class NewsArticleListItem(BaseModel):
    id: str
    title: str
    slug: str
    summary: str
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    source_id: Optional[str] = None
    source_name: str
    source_url: str
    original_article_url: str
    canonical_url: str
    verification_status: str = Field(description="OFFICIAL, VERIFIED, RUMOUR, UNCONFIRMED")
    publication_status: str
    original_published_at: datetime
    is_featured: bool = False
    read_time_minutes: int = 3
    is_bookmarked: bool = False


class NewsArticleDetail(NewsArticleListItem):
    content: str
    related_articles: List[NewsArticleListItem] = []


class NewsListResponse(BaseModel):
    items: List[NewsArticleListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_more: bool


class NewsStatsResponse(BaseModel):
    total_articles: int
    official_count: int
    verified_count: int
    rumour_count: int
    unconfirmed_count: int
    last_updated: Optional[datetime] = None


class BookmarkResponse(BaseModel):
    article_id: str
    is_bookmarked: bool
    message: str


class NewsBookmarkItem(BaseModel):
    bookmark_id: str
    article: NewsArticleListItem
    created_at: datetime


class NewsIngestionResult(BaseModel):
    sources_checked: int
    articles_collected: int
    duplicates_skipped: int
    errors: List[str] = []
