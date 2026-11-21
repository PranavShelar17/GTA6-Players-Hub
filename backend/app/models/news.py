import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import GUID


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    website_url = Column(String(512), nullable=False)
    source_type = Column(String(50), nullable=False, default="PRESS")  # OFFICIAL, PRESS, COMMUNITY
    trust_level = Column(String(50), nullable=False, default="VERIFIED")  # OFFICIAL, VERIFIED, UNCONFIRMED
    feed_url = Column(String(512), nullable=True)
    collection_method = Column(String(50), nullable=False, default="RSS")  # RSS, API, CURATED
    is_enabled = Column(Boolean, nullable=False, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    articles = relationship("NewsArticle", back_populates="source", cascade="all, delete-orphan")


class NewsCategory(Base):
    __tablename__ = "news_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    articles = relationship("NewsArticle", back_populates="category")


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(512), nullable=True)
    category_id = Column(GUID(), ForeignKey("news_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    source_id = Column(GUID(), ForeignKey("news_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    original_article_url = Column(String(512), nullable=False)
    canonical_url = Column(String(512), nullable=False, index=True)
    verification_status = Column(String(20), nullable=False, default="VERIFIED")  # OFFICIAL, VERIFIED, RUMOUR, UNCONFIRMED
    publication_status = Column(String(20), nullable=False, default="PUBLISHED")  # PUBLISHED, DRAFT, ARCHIVED
    original_published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    collected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    read_time_minutes = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category = relationship("NewsCategory", back_populates="articles")
    source = relationship("NewsSource", back_populates="articles")
    bookmarks = relationship("NewsBookmark", back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_news_articles_published_status", "publication_status", "original_published_at"),
        Index("ix_news_articles_verification", "verification_status"),
    )


class NewsBookmark(Base):
    __tablename__ = "news_bookmarks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    player_id = Column(GUID(), nullable=False, index=True)
    article_id = Column(GUID(), ForeignKey("news_articles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    article = relationship("NewsArticle", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("player_id", "article_id", name="uq_player_article_bookmark"),
    )
