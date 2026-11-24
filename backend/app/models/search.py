import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from app.core.database import Base
from app.models.user import GUID


class SearchIndex(Base):
    """Unified Search Index model covering News, Deals, Events, Community, and Guides.
    Enables fast multi-term full-text search, filtering, and cross-module discovery.
    """
    __tablename__ = "search_index"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    content_type = Column(String(32), nullable=False, index=True)  # NEWS, DEALS, EVENTS, COMMUNITY, HELP
    content_id = Column(String(64), nullable=False, index=True)    # Source entity ID/UUID
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    searchable_text = Column(Text, nullable=False)                 # Concatenated title + description + keywords
    category = Column(String(64), nullable=False, index=True)      # e.g., 'Official News', 'PC Edition', etc.
    url_path = Column(String(512), nullable=False)                 # Destination route e.g. /news/trailer-2
    thumbnail_url = Column(String(512), nullable=True)
    verification_status = Column(String(32), nullable=False, default="VERIFIED", index=True)
    source_or_author = Column(String(128), nullable=True)
    published_or_event_at = Column(DateTime(timezone=True), nullable=True, index=True)
    price_amount = Column(Numeric(10, 2), nullable=True)           # Price in local currency where applicable
    currency_code = Column(String(3), nullable=True)
    is_public = Column(Boolean, nullable=False, default=True, index=True)
    source_updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    indexed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_search_content_lookup", "content_type", "content_id", unique=True),
        Index("ix_search_type_category", "content_type", "category"),
    )


class UserSearchHistory(Base):
    """Private search history entries for authenticated players."""
    __tablename__ = "user_search_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=False, index=True)
    search_query = Column(String(255), nullable=False)
    category_filter = Column(String(32), nullable=True)
    results_count = Column(Integer, nullable=False, default=0)
    searched_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    __table_args__ = (
        Index("ix_user_search_user_date", "user_id", "searched_at"),
    )
