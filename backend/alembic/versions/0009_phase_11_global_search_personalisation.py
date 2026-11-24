"""Phase 11: Global Search, Personalisation and Search Index Tables

Revision ID: 0009_phase_11_global_search_personalisation
Revises: 0008_phase_10_automation_background_services
Create Date: 2026-11-23 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0009_phase_11_global_search_personalisation'
down_revision: Union[str, None] = '0008_phase_10_automation_background_services'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add personalisation preference columns to player_preferences
    with op.batch_alter_table('player_preferences') as batch_op:
        batch_op.add_column(sa.Column('preferred_categories', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('theme', sa.String(length=20), nullable=False, server_default='dark'))
        batch_op.add_column(sa.Column('content_density', sa.String(length=20), nullable=False, server_default='comfortable'))

    # 2. Create search_index table
    op.create_table(
        'search_index',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('content_type', sa.String(length=32), nullable=False),
        sa.Column('content_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('searchable_text', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('url_path', sa.String(length=512), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=512), nullable=True),
        sa.Column('verification_status', sa.String(length=32), nullable=False, server_default='VERIFIED'),
        sa.Column('source_or_author', sa.String(length=128), nullable=True),
        sa.Column('published_or_event_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('price_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('source_updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('indexed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_search_content_type', 'search_index', ['content_type'])
    op.create_index('idx_search_category', 'search_index', ['category'])
    op.create_index('idx_search_title', 'search_index', ['title'])
    op.create_index('idx_search_published_date', 'search_index', ['published_or_event_at'])
    op.create_index('idx_search_is_public', 'search_index', ['is_public'])
    op.create_index('ix_search_content_lookup', 'search_index', ['content_type', 'content_id'], unique=True)

    # 3. Create user_search_history table
    op.create_table(
        'user_search_history',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('search_query', sa.String(length=255), nullable=False),
        sa.Column('category_filter', sa.String(length=32), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('searched_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_user_search_user_id', 'user_search_history', ['user_id'])
    op.create_index('idx_user_search_searched_at', 'user_search_history', ['searched_at'])
    op.create_index('ix_user_search_user_date', 'user_search_history', ['user_id', 'searched_at'])


def downgrade() -> None:
    op.drop_table('user_search_history')
    op.drop_table('search_index')
    with op.batch_alter_table('player_preferences') as batch_op:
        batch_op.drop_column('content_density')
        batch_op.drop_column('theme')
        batch_op.drop_column('preferred_categories')
