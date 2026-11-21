"""Phase 2: Create player profiles, preferences, and activities tables

Revision ID: 0001_phase_2
Revises: 
Create Date: 2026-11-21 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_phase_2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. player_profiles
    op.create_table(
        'player_profiles',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False, unique=True),
        sa.Column('username', sa.String(length=32), nullable=False, unique=True),
        sa.Column('display_name', sa.String(length=64), nullable=False),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('bio', sa.String(length=500), nullable=True),
        sa.Column('country_code', sa.String(length=3), nullable=True),
        sa.Column('preferred_platform', sa.String(length=20), nullable=False, server_default='PC'),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('profile_visibility', sa.String(length=20), nullable=False, server_default='public'),
        sa.Column('reputation_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('idx_player_profiles_username', 'player_profiles', ['username'])
    op.create_index('idx_player_profiles_user_id', 'player_profiles', ['user_id'])

    # 2. player_preferences
    op.create_table(
        'player_preferences',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False, unique=True),
        sa.Column('preferred_country', sa.String(length=3), nullable=False, server_default='USA'),
        sa.Column('preferred_currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('preferred_platform', sa.String(length=20), nullable=False, server_default='PC'),
        sa.Column('preferred_edition', sa.String(length=50), nullable=False, server_default='Standard Edition'),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('push_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('community_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('news_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('price_alert_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('event_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('idx_player_preferences_user_id', 'player_preferences', ['user_id'])

    # 3. player_activities
    op.create_table(
        'player_activities',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('idx_player_activities_user_id', 'player_activities', ['user_id'])


def downgrade() -> None:
    op.drop_table('player_activities')
    op.drop_table('player_preferences')
    op.drop_table('player_profiles')
