"""Phase 5: Create price tracking system tables

Revision ID: 0003_phase_5_price
Revises: 0002_phase_4_news
Create Date: 2026-11-22 01:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_phase_5_price'
down_revision: Union[str, None] = '0002_phase_4_news'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. price_products
    op.create_table(
        'price_products',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('platform', sa.String(length=50), nullable=False),
        sa.Column('edition', sa.String(length=50), nullable=False),
        sa.Column('official_product_url', sa.String(length=512), nullable=True),
        sa.Column('image_url', sa.String(length=512), nullable=True),
        sa.Column('release_status', sa.String(length=50), nullable=False, server_default='ANNOUNCED'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_price_products_slug', 'price_products', ['slug'])
    op.create_index('idx_price_products_platform', 'price_products', ['platform'])
    op.create_index('idx_price_products_edition', 'price_products', ['edition'])

    # 2. price_regions
    op.create_table(
        'price_regions',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('region_name', sa.String(length=100), nullable=False),
        sa.Column('country_code', sa.String(length=3), nullable=False, unique=True),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('currency_symbol', sa.String(length=10), nullable=False),
        sa.Column('tax_inclusive', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('exchange_rate_to_inr', sa.Numeric(precision=12, scale=4), nullable=False, server_default='1.0000'),
        sa.Column('exchange_rate_to_usd', sa.Numeric(precision=12, scale=4), nullable=False, server_default='1.0000'),
        sa.Column('rates_last_updated', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_price_regions_country_code', 'price_regions', ['country_code'])

    # 3. price_stores
    op.create_table(
        'price_stores',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('store_name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('website_url', sa.String(length=512), nullable=False),
        sa.Column('store_type', sa.String(length=50), nullable=False, server_default='OFFICIAL_STORE'),
        sa.Column('seller_authorisation_status', sa.String(length=50), nullable=False, server_default='AUTHORISED'),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='DIRECT'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 4. price_observations
    op.create_table(
        'price_observations',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('product_id', sa.CHAR(36), sa.ForeignKey('price_products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('region_id', sa.CHAR(36), sa.ForeignKey('price_regions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('store_id', sa.CHAR(36), sa.ForeignKey('price_stores.id', ondelete='CASCADE'), nullable=False),
        sa.Column('current_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('original_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('availability_status', sa.String(length=50), nullable=False, server_default='PREORDER_AVAILABLE'),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='VERIFIED'),
        sa.Column('product_url', sa.String(length=512), nullable=False),
        sa.Column('observed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_price_obs_product', 'price_observations', ['product_id'])
    op.create_index('idx_price_obs_region', 'price_observations', ['region_id'])
    op.create_index('idx_price_obs_store', 'price_observations', ['store_id'])
    op.create_index('idx_price_obs_status', 'price_observations', ['verification_status'])
    op.create_index('idx_price_obs_prod_reg_date', 'price_observations', ['product_id', 'region_id', 'observed_at'])

    # 5. price_alerts
    op.create_table(
        'price_alerts',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('product_id', sa.CHAR(36), sa.ForeignKey('price_products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('region_id', sa.CHAR(36), sa.ForeignKey('price_regions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_price_alerts_player', 'price_alerts', ['player_id'])
    op.create_index('idx_price_alerts_product', 'price_alerts', ['product_id'])

    # 6. price_alert_events
    op.create_table(
        'price_alert_events',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('alert_id', sa.CHAR(36), sa.ForeignKey('price_alerts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('observed_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('delivery_status', sa.String(length=50), nullable=False, server_default='RECORDED'),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_price_alert_events_alert', 'price_alert_events', ['alert_id'])

    # 7. price_wishlist
    op.create_table(
        'price_wishlist',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('product_id', sa.CHAR(36), sa.ForeignKey('price_products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('player_id', 'product_id', name='uq_player_wishlist_product'),
    )
    op.create_index('idx_price_wishlist_player', 'price_wishlist', ['player_id'])

    # 8. price_sources
    op.create_table(
        'price_sources',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('source_name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='OFFICIAL_API'),
        sa.Column('source_url', sa.String(length=512), nullable=False),
        sa.Column('integration_method', sa.String(length=50), nullable=False, server_default='API'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('price_sources')
    op.drop_table('price_wishlist')
    op.drop_table('price_alert_events')
    op.drop_table('price_alerts')
    op.drop_table('price_observations')
    op.drop_table('price_stores')
    op.drop_table('price_regions')
    op.drop_table('price_products')
