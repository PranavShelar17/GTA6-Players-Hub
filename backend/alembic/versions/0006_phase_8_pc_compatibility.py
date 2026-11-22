"""Phase 8: PC Compatibility Checker Tables

Revision ID: 0006_phase_8_pc_compatibility
Revises: 0005_phase_7_community
Create Date: 2026-11-22 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0006_phase_8_pc_compatibility'
down_revision: Union[str, None] = '0005_phase_7_community'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. pc_hardware_profiles
    op.create_table(
        'pc_hardware_profiles',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=False),
        sa.Column('profile_name', sa.String(length=100), nullable=False, server_default='My Gaming Rig'),
        sa.Column('cpu_manufacturer', sa.String(length=50), nullable=False),
        sa.Column('cpu_model', sa.String(length=150), nullable=False),
        sa.Column('cpu_cores', sa.Integer(), nullable=True),
        sa.Column('cpu_threads', sa.Integer(), nullable=True),
        sa.Column('gpu_manufacturer', sa.String(length=50), nullable=False),
        sa.Column('gpu_model', sa.String(length=150), nullable=False),
        sa.Column('gpu_vram_gb', sa.Numeric(precision=5, scale=1), nullable=False),
        sa.Column('gpu_type', sa.String(length=20), nullable=False, server_default='DEDICATED'),
        sa.Column('ram_gb', sa.Integer(), nullable=False),
        sa.Column('ram_type', sa.String(length=20), nullable=True),
        sa.Column('storage_type', sa.String(length=20), nullable=False, server_default='NVME_SSD'),
        sa.Column('storage_capacity_gb', sa.Integer(), nullable=True),
        sa.Column('storage_free_gb', sa.Integer(), nullable=False),
        sa.Column('operating_system', sa.String(length=50), nullable=False, server_default='Windows 11'),
        sa.Column('os_architecture', sa.String(length=20), nullable=False, server_default='64-bit'),
        sa.Column('directx_version', sa.String(length=20), nullable=True, server_default='DirectX 12'),
        sa.Column('display_resolution', sa.String(length=30), nullable=False, server_default='1920x1080'),
        sa.Column('refresh_rate', sa.Integer(), nullable=True, server_default='60'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_pc_profiles_user_created', 'pc_hardware_profiles', ['user_id', 'created_at'])

    # 2. game_system_requirements
    op.create_table(
        'game_system_requirements',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('game_name', sa.String(length=100), nullable=False, server_default='Grand Theft Auto VI'),
        sa.Column('platform', sa.String(length=30), nullable=False, server_default='PC'),
        sa.Column('requirement_category', sa.String(length=30), nullable=False),
        sa.Column('cpu_requirement', sa.String(length=255), nullable=True),
        sa.Column('cpu_min_cores', sa.Integer(), nullable=True),
        sa.Column('gpu_requirement', sa.String(length=255), nullable=True),
        sa.Column('vram_requirement_gb', sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column('ram_requirement_gb', sa.Integer(), nullable=True),
        sa.Column('storage_requirement_gb', sa.Integer(), nullable=True),
        sa.Column('storage_type_requirement', sa.String(length=50), nullable=True, server_default='SSD Required'),
        sa.Column('operating_system_requirement', sa.String(length=100), nullable=True),
        sa.Column('directx_requirement', sa.String(length=50), nullable=True, server_default='DirectX 12'),
        sa.Column('source_url', sa.String(length=1024), nullable=True),
        sa.Column('source_name', sa.String(length=100), nullable=True),
        sa.Column('verification_status', sa.String(length=32), nullable=False, server_default='UNCONFIRMED'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_verified_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_game_reqs_status_active', 'game_system_requirements', ['verification_status', 'is_active'])

    # 3. pc_compatibility_checks
    op.create_table(
        'pc_compatibility_checks',
        sa.Column('id', sa.CHAR(36), primary_key=True),
        sa.Column('user_id', sa.CHAR(36), nullable=True),
        sa.Column('hardware_profile_id', sa.CHAR(36), sa.ForeignKey('pc_hardware_profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('requirements_version_id', sa.CHAR(36), sa.ForeignKey('game_system_requirements.id', ondelete='SET NULL'), nullable=True),
        sa.Column('result_status', sa.String(length=50), nullable=False, server_default='REQUIREMENTS_UNAVAILABLE'),
        sa.Column('component_results', sa.JSON(), nullable=False),
        sa.Column('hardware_summary', sa.JSON(), nullable=False),
        sa.Column('bottleneck_notes', sa.JSON(), nullable=False),
        sa.Column('upgrade_suggestions', sa.JSON(), nullable=False),
        sa.Column('analysis_summary', sa.Text(), nullable=False),
        sa.Column('checked_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_compat_checks_user_time', 'pc_compatibility_checks', ['user_id', 'checked_at'])


def downgrade() -> None:
    op.drop_table('pc_compatibility_checks')
    op.drop_table('game_system_requirements')
    op.drop_table('pc_hardware_profiles')
