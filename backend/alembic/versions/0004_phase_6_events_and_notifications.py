"""Phase 6: Create events calendar and notification system tables

Revision ID: 0004_phase_6_events_notifications
Revises: 0003_phase_5_price
Create Date: 2026-11-22 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_phase_6_events_notifications'
down_revision: Union[str, None] = '0003_phase_5_price'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. event_categories
    op.create_table(
        'event_categories',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=64), nullable=False, unique=True),
        sa.Column('slug', sa.String(length=64), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=64), nullable=True, server_default='calendar'),
        sa.Column('color', sa.String(length=32), nullable=True, server_default='#f97316'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_event_categories_slug', 'event_categories', ['slug'])

    # 2. event_sources
    op.create_table(
        'event_sources',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False, unique=True),
        sa.Column('website_url', sa.String(length=512), nullable=False),
        sa.Column('source_type', sa.String(length=32), nullable=False, server_default='OFFICIAL'),
        sa.Column('reliability_score', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 3. events
    op.create_table(
        'events',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('short_summary', sa.String(length=500), nullable=True),
        sa.Column('category_id', sa.CHAR(36), sa.ForeignKey('event_categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_id', sa.CHAR(36), sa.ForeignKey('event_sources.id', ondelete='SET NULL'), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('timezone', sa.String(length=64), nullable=False, server_default='UTC'),
        sa.Column('location_type', sa.String(length=32), nullable=False, server_default='ONLINE'),
        sa.Column('location_name', sa.String(length=255), nullable=True),
        sa.Column('event_url', sa.String(length=512), nullable=True),
        sa.Column('stream_url', sa.String(length=512), nullable=True),
        sa.Column('verification_status', sa.String(length=32), nullable=False, server_default='VERIFIED'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_cancelled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('banner_image_url', sa.String(length=512), nullable=True),
        sa.Column('organizer_name', sa.String(length=128), nullable=False, server_default='Rockstar Games'),
        sa.Column('tags', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_events_slug', 'events', ['slug'])
    op.create_index('idx_events_start_time', 'events', ['start_time'])
    op.create_index('idx_events_category', 'events', ['category_id'])
    op.create_index('idx_events_verification', 'events', ['verification_status'])
    op.create_index('idx_events_featured', 'events', ['is_featured'])

    # 4. saved_events
    op.create_table(
        'saved_events',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('event_id', sa.CHAR(36), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'event_id', name='uq_user_event_save'),
    )
    op.create_index('idx_saved_events_user_created', 'saved_events', ['user_id', 'created_at'])

    # 5. event_reminders
    op.create_table(
        'event_reminders',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('event_id', sa.CHAR(36), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lead_time_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('channel', sa.String(length=32), nullable=False, server_default='IN_APP'),
        sa.Column('is_sent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'event_id', 'lead_time_minutes', 'channel', name='uq_user_event_reminder'),
    )
    op.create_index('idx_event_reminders_status', 'event_reminders', ['is_sent', 'lead_time_minutes'])

    # 6. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=32), nullable=False),
        sa.Column('reference_id', sa.String(length=128), nullable=True),
        sa.Column('reference_url', sa.String(length=512), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.String(length=16), nullable=False, server_default='NORMAL'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_notifications_user_unread', 'notifications', ['user_id', 'is_read', 'created_at'])
    op.create_index('idx_notifications_user_type', 'notifications', ['user_id', 'notification_type'])

    # 7. notification_preferences
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False, unique=True),
        sa.Column('in_app_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('news_updates', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('price_alerts', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('event_reminders', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('community_activity', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('platform_announcements', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('default_reminder_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=False, server_default='22:00'),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=False, server_default='08:00'),
        sa.Column('timezone', sa.String(length=64), nullable=False, server_default='UTC'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_notif_prefs_user', 'notification_preferences', ['user_id'])

    # 8. notification_deliveries
    op.create_table(
        'notification_deliveries',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('notification_id', sa.CHAR(36), sa.ForeignKey('notifications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('channel', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='SENT'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_notif_deliveries_notification', 'notification_deliveries', ['notification_id'])

    # 9. push_subscriptions
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('endpoint', sa.String(length=1024), nullable=False),
        sa.Column('p256dh', sa.String(length=255), nullable=False),
        sa.Column('auth', sa.String(length=255), nullable=False),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'endpoint', name='uq_user_push_endpoint'),
    )
    op.create_index('idx_push_user_active', 'push_subscriptions', ['user_id', 'is_active'])


def downgrade() -> None:
    op.drop_table('push_subscriptions')
    op.drop_table('notification_deliveries')
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
    op.drop_table('event_reminders')
    op.drop_table('saved_events')
    op.drop_table('events')
    op.drop_table('event_sources')
    op.drop_table('event_categories')
