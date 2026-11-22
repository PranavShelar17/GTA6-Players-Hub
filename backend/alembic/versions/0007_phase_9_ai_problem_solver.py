"""Phase 9: AI Gaming Problem Solver Tables

Revision ID: 0007_phase_9_ai_problem_solver
Revises: 0006_phase_8_pc_compatibility
Create Date: 2026-11-22 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0007_phase_9_ai_problem_solver'
down_revision: Union[str, None] = '0006_phase_8_pc_compatibility'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ai_knowledge_sources
    op.create_table(
        'ai_knowledge_sources',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('source_title', sa.String(length=255), nullable=False),
        sa.Column('source_url', sa.String(length=1024), nullable=True),
        sa.Column('publisher', sa.String(length=100), nullable=False),
        sa.Column('source_category', sa.String(length=50), nullable=False),
        sa.Column('verification_status', sa.String(length=30), nullable=False, server_default='VERIFIED'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 2. ai_knowledge_documents
    op.create_table(
        'ai_knowledge_documents',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('source_id', sa.CHAR(36), sa.ForeignKey('ai_knowledge_sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_title', sa.String(length=255), nullable=False),
        sa.Column('topic_category', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('keywords', sa.JSON(), nullable=True),
        sa.Column('doc_metadata', sa.JSON(), nullable=True),
        sa.Column('indexed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_ai_docs_topic_indexed', 'ai_knowledge_documents', ['topic_category', 'indexed_at'])

    # 3. ai_conversations
    op.create_table(
        'ai_conversations',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='Gaming Technical Issue'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('include_hardware_profile', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('hardware_profile_id', sa.CHAR(36), sa.ForeignKey('pc_hardware_profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_ai_conversations_user_updated', 'ai_conversations', ['user_id', 'updated_at'])

    # 4. ai_messages
    op.create_table(
        'ai_messages',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('conversation_id', sa.CHAR(36), sa.ForeignKey('ai_conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.CHAR(36), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('message_content', sa.Text(), nullable=False),
        sa.Column('attachment_url', sa.String(length=1024), nullable=True),
        sa.Column('attachment_filename', sa.String(length=255), nullable=True),
        sa.Column('attachment_mime', sa.String(length=50), nullable=True),
        sa.Column('attachment_size', sa.Integer(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('model', sa.String(length=50), nullable=True),
        sa.Column('retrieved_sources', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_ai_messages_conv_created', 'ai_messages', ['conversation_id', 'created_at'])

    # 5. ai_response_feedback
    op.create_table(
        'ai_response_feedback',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=True),
        sa.Column('conversation_id', sa.CHAR(36), sa.ForeignKey('ai_conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message_id', sa.CHAR(36), sa.ForeignKey('ai_messages.id', ondelete='CASCADE'), nullable=False),
        sa.Column('feedback_type', sa.String(length=30), nullable=False),
        sa.Column('feedback_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_ai_feedback_msg', 'ai_response_feedback', ['message_id'])


def downgrade() -> None:
    op.drop_table('ai_response_feedback')
    op.drop_table('ai_messages')
    op.drop_table('ai_conversations')
    op.drop_table('ai_knowledge_documents')
    op.drop_table('ai_knowledge_sources')
