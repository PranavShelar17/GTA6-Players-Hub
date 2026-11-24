"""Phase 10: Automated Data & Background Services Tables

Revision ID: 0008_phase_10_automation_background_services
Revises: 0007_phase_9_ai_problem_solver
Create Date: 2026-11-23 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0008_phase_10_automation_background_services'
down_revision: Union[str, None] = '0007_phase_9_ai_problem_solver'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. automation_job_logs
    op.create_table(
        'automation_job_logs',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('task_name', sa.String(length=128), nullable=False),
        sa.Column('task_id', sa.String(length=128), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_automation_job_task_name', 'automation_job_logs', ['task_name'])
    op.create_index('idx_automation_job_task_id', 'automation_job_logs', ['task_id'])
    op.create_index('idx_automation_job_status', 'automation_job_logs', ['status'])
    op.create_index('idx_automation_job_created', 'automation_job_logs', ['created_at'])

    # 2. data_source_status
    op.create_table(
        'data_source_status',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('source_name', sa.String(length=128), nullable=False, unique=True),
        sa.Column('source_type', sa.String(length=64), nullable=False),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('last_attempted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_successful_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('health_status', sa.String(length=32), nullable=False, server_default='HEALTHY'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_data_source_name', 'data_source_status', ['source_name'])
    op.create_index('idx_data_source_type', 'data_source_status', ['source_type'])
    op.create_index('idx_data_source_health', 'data_source_status', ['health_status'])

    # 3. data_ingestion_logs
    op.create_table(
        'data_ingestion_logs',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('source_id', sa.String(length=128), nullable=True),
        sa.Column('data_category', sa.String(length=64), nullable=False),
        sa.Column('records_retrieved', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_updated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_skipped', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='RUNNING'),
    )
    op.create_index('idx_ingestion_source', 'data_ingestion_logs', ['source_id'])
    op.create_index('idx_ingestion_category', 'data_ingestion_logs', ['data_category'])
    op.create_index('idx_ingestion_status', 'data_ingestion_logs', ['status'])

    # 4. Optional column additions on notification_deliveries
    with op.batch_alter_table('notification_deliveries') as batch_op:
        batch_op.add_column(sa.Column('provider_reference', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('attempted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('notification_deliveries') as batch_op:
        batch_op.drop_column('attempted_at')
        batch_op.drop_column('retry_count')
        batch_op.drop_column('provider_reference')

    op.drop_table('data_ingestion_logs')
    op.drop_table('data_source_status')
    op.drop_table('automation_job_logs')
