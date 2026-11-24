"""Phase 8 Upgrade: PC History, Smart Comparison and Top 3 Recommendations

Revision ID: 0010_pc_history_and_recommendations
Revises: 0009_phase_11_global_search_personalisation
Create Date: 2026-11-23 14:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0010_pc_history_and_recommendations'
down_revision: Union[str, None] = '0009_phase_11_global_search_personalisation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('pc_hardware_profiles') as batch_op:
        batch_op.add_column(sa.Column('ram_speed_mhz', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('motherboard_model', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column('psu_wattage', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('psu_model', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column('cooling_solution', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('form_factor', sa.String(length=30), nullable=False, server_default='DESKTOP'))
        batch_op.add_column(sa.Column('is_incomplete', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('pc_hardware_profiles') as batch_op:
        batch_op.drop_column('notes')
        batch_op.drop_column('is_incomplete')
        batch_op.drop_column('form_factor')
        batch_op.drop_column('cooling_solution')
        batch_op.drop_column('psu_model')
        batch_op.drop_column('psu_wattage')
        batch_op.drop_column('motherboard_model')
        batch_op.drop_column('ram_speed_mhz')
