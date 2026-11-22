"""Phase 7: Gaming Community System Tables

Revision ID: 0005_phase_7_community
Revises: 0004_phase_6_events_notifications
Create Date: 2026-11-22 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005_phase_7_community'
down_revision: Union[str, None] = '0004_phase_6_events_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. community_categories
    op.create_table(
        'community_categories',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('name', sa.String(length=64), nullable=False, unique=True),
        sa.Column('slug', sa.String(length=64), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=64), nullable=True, server_default='message-square'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_community_categories_slug', 'community_categories', ['slug'])

    # 2. community_posts
    op.create_table(
        'community_posts',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('category_id', sa.CHAR(36), sa.ForeignKey('community_categories.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('post_status', sa.String(length=32), nullable=False, server_default='PUBLISHED'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_community_posts_player_id', 'community_posts', ['player_id'])
    op.create_index('idx_community_posts_category_id', 'community_posts', ['category_id'])
    op.create_index('idx_community_posts_created_at', 'community_posts', ['created_at'])
    op.create_index('idx_community_posts_status_created', 'community_posts', ['post_status', 'created_at'])
    op.create_index('idx_community_posts_player_status', 'community_posts', ['player_id', 'post_status'])

    # 3. community_post_media
    op.create_table(
        'community_post_media',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('media_url', sa.String(length=1024), nullable=False),
        sa.Column('media_type', sa.String(length=32), nullable=False, server_default='IMAGE'),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_community_post_media_post_id', 'community_post_media', ['post_id'])

    # 4. community_likes
    op.create_table(
        'community_likes',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('player_id', 'post_id', name='uq_community_player_post_like'),
    )
    op.create_index('idx_community_likes_player_id', 'community_likes', ['player_id'])
    op.create_index('idx_community_likes_post_id', 'community_likes', ['post_id'])

    # 5. community_comments
    op.create_table(
        'community_comments',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('parent_comment_id', sa.CHAR(36), sa.ForeignKey('community_comments.id', ondelete='CASCADE'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('comment_status', sa.String(length=32), nullable=False, server_default='PUBLISHED'),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_community_comments_post_id', 'community_comments', ['post_id'])
    op.create_index('idx_community_comments_parent_id', 'community_comments', ['parent_comment_id'])
    op.create_index('idx_community_comments_post_status', 'community_comments', ['post_id', 'comment_status', 'created_at'])

    # 6. community_bookmarks
    op.create_table(
        'community_bookmarks',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('player_id', 'post_id', name='uq_community_player_post_bookmark'),
    )
    op.create_index('idx_community_bookmarks_player_created', 'community_bookmarks', ['player_id', 'created_at'])

    # 7. community_follows
    op.create_table(
        'community_follows',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('follower_id', sa.CHAR(36), nullable=False),
        sa.Column('following_id', sa.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('follower_id', 'following_id', name='uq_community_follow_pair'),
    )
    op.create_index('idx_community_follows_follower', 'community_follows', ['follower_id'])
    op.create_index('idx_community_follows_following', 'community_follows', ['following_id', 'follower_id'])

    # 8. community_polls
    op.create_table(
        'community_polls',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('post_id', sa.CHAR(36), sa.ForeignKey('community_posts.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('question', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('allow_vote_change', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('total_votes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_community_polls_post_id', 'community_polls', ['post_id'])

    # 9. community_poll_options
    op.create_table(
        'community_poll_options',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('poll_id', sa.CHAR(36), sa.ForeignKey('community_polls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('option_text', sa.String(length=255), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('vote_count', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('idx_community_poll_options_poll_id', 'community_poll_options', ['poll_id'])

    # 10. community_poll_votes
    op.create_table(
        'community_poll_votes',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('poll_id', sa.CHAR(36), sa.ForeignKey('community_polls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('option_id', sa.CHAR(36), sa.ForeignKey('community_poll_options.id', ondelete='CASCADE'), nullable=False),
        sa.Column('player_id', sa.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('poll_id', 'player_id', name='uq_community_poll_player_vote'),
    )
    op.create_index('idx_community_poll_votes_poll_id', 'community_poll_votes', ['poll_id'])
    op.create_index('idx_community_poll_votes_player_id', 'community_poll_votes', ['player_id'])

    # 11. community_reports
    op.create_table(
        'community_reports',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('reporter_id', sa.CHAR(36), nullable=False),
        sa.Column('target_type', sa.String(length=32), nullable=False),
        sa.Column('target_id', sa.String(length=128), nullable=False),
        sa.Column('reason', sa.String(length=64), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('report_status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_community_reports_reporter_id', 'community_reports', ['reporter_id'])
    op.create_index('idx_community_reports_target', 'community_reports', ['target_type', 'target_id'])

    # 12. community_blocks
    op.create_table(
        'community_blocks',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('blocker_id', sa.CHAR(36), nullable=False),
        sa.Column('blocked_id', sa.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_community_block_pair'),
    )
    op.create_index('idx_community_blocks_pair', 'community_blocks', ['blocker_id', 'blocked_id'])

    # 13. community_mutes
    op.create_table(
        'community_mutes',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('muter_id', sa.CHAR(36), nullable=False),
        sa.Column('muted_id', sa.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('muter_id', 'muted_id', name='uq_community_mute_pair'),
    )
    op.create_index('idx_community_mutes_pair', 'community_mutes', ['muter_id', 'muted_id'])


def downgrade() -> None:
    op.drop_table('community_mutes')
    op.drop_table('community_blocks')
    op.drop_table('community_reports')
    op.drop_table('community_poll_votes')
    op.drop_table('community_poll_options')
    op.drop_table('community_polls')
    op.drop_table('community_follows')
    op.drop_table('community_bookmarks')
    op.drop_table('community_comments')
    op.drop_table('community_likes')
    op.drop_table('community_post_media')
    op.drop_table('community_posts')
    op.drop_table('community_categories')
