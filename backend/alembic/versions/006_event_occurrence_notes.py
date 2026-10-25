"""event occurrence notes

Revision ID: 006
Revises: 005
Create Date: 2026-10-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, Sequence[str], None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notes",
        sa.Column("occurrence_start_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "uq_notes_event_occurrence",
        "notes",
        ["event_id", "occurrence_start_at"],
        unique=True,
        postgresql_where=sa.text("event_id IS NOT NULL AND occurrence_start_at IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_notes_event_occurrence", table_name="notes")
    op.drop_column("notes", "occurrence_start_at")
