"""Phase 4: Create news_sources, news_categories, news_articles, and news_bookmarks tables

Revision ID: 0002_phase_4_news
Revises: 0001_phase_2
Create Date: 2026-11-22 01:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_phase_4_news'
down_revision: Union[str, None] = '0001_phase_2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. news_sources
    op.create_table(
        'news_sources',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('website_url', sa.String(length=512), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='PRESS'),
        sa.Column('trust_level', sa.String(length=50), nullable=False, server_default='VERIFIED'),
        sa.Column('feed_url', sa.String(length=512), nullable=True),
        sa.Column('collection_method', sa.String(length=50), nullable=False, server_default='RSS'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 2. news_categories
    op.create_table(
        'news_categories',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('slug', sa.String(length=100), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('idx_news_categories_slug', 'news_categories', ['slug'])

    # 3. news_articles
    op.create_table(
        'news_articles',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False, unique=True),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(length=512), nullable=True),
        sa.Column('category_id', sa.CHAR(36), sa.ForeignKey('news_categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source_id', sa.CHAR(36), sa.ForeignKey('news_sources.id', ondelete='SET NULL'), nullable=True),
        sa.Column('original_article_url', sa.String(length=512), nullable=False),
        sa.Column('canonical_url', sa.String(length=512), nullable=False),
        sa.Column('verification_status', sa.String(length=20), nullable=False, server_default='VERIFIED'),
        sa.Column('publication_status', sa.String(length=20), nullable=False, server_default='PUBLISHED'),
        sa.Column('original_published_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('collected_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_time_minutes', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('idx_news_articles_slug', 'news_articles', ['slug'])
    op.create_index('idx_news_articles_published_status', 'news_articles', ['publication_status', 'original_published_at'])
    op.create_index('idx_news_articles_verification', 'news_articles', ['verification_status'])
    op.create_index('idx_news_articles_featured', 'news_articles', ['is_featured'])
    op.create_index('idx_news_articles_category_id', 'news_articles', ['category_id'])
    op.create_index('idx_news_articles_source_id', 'news_articles', ['source_id'])

    # 4. news_bookmarks
    op.create_table(
        'news_bookmarks',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('article_id', sa.CHAR(36), sa.ForeignKey('news_articles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('player_id', 'article_id', name='uq_player_article_bookmark')
    )
    op.create_index('idx_news_bookmarks_player_id', 'news_bookmarks', ['player_id'])
    op.create_index('idx_news_bookmarks_article_id', 'news_bookmarks', ['article_id'])


def downgrade() -> None:
    op.drop_table('news_bookmarks')
    op.drop_table('news_articles')
    op.drop_table('news_categories')
    op.drop_table('news_sources')
