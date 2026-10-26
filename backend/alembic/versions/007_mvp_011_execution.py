"""mvp 0.11 execution: objectives lifecycle, task planned_for and status

Revision ID: 007
Revises: 006
Create Date: 2026-10-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, Sequence[str], None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "objectives",
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
    )
    op.add_column(
        "objectives",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "objectives",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column(
        "objectives",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column("tasks", sa.Column("planned_for", sa.Date(), nullable=True))
    op.add_column(
        "tasks",
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
    )
    op.add_column(
        "tasks",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.alter_column("tasks", "due_date", new_column_name="due_at")

    op.execute(
        sa.text("UPDATE tasks SET planned_for = CAST(due_at AS DATE) WHERE planned_for IS NULL")
    )
    op.alter_column("tasks", "planned_for", nullable=False)

    op.execute(
        sa.text(
            """
            UPDATE tasks t
            SET domain_id = (
                SELECT d.id FROM domains d
                WHERE d.user_id = t.user_id
                ORDER BY d.id
                LIMIT 1
            )
            WHERE t.domain_id IS NULL
            """
        )
    )
    op.alter_column("tasks", "domain_id", nullable=False)


def downgrade() -> None:
    op.alter_column("tasks", "domain_id", nullable=True)
    op.alter_column("tasks", "planned_for", nullable=True)
    op.drop_column("tasks", "completed_at")
    op.drop_column("tasks", "status")
    op.drop_column("tasks", "planned_for")
    op.alter_column("tasks", "due_at", new_column_name="due_date")

    op.drop_column("objectives", "updated_at")
    op.drop_column("objectives", "created_at")
    op.drop_column("objectives", "completed_at")
    op.drop_column("objectives", "status")
