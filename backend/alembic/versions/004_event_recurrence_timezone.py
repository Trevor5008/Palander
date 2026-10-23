"""event recurrence timezone and until

Revision ID: 004
Revises: 003
Create Date: 2026-10-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, Sequence[str], None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("timezone", sa.String(length=64), nullable=True))
    op.add_column("events", sa.Column("recurrence_until", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "recurrence_until")
    op.drop_column("events", "timezone")
