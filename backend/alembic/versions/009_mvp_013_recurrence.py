"""mvp 0.13 recurrence and multi-objective

Revision ID: 009
Revises: 008
Create Date: 2026-10-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009"
down_revision: Union[str, Sequence[str], None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_objectives",
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("objective_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["objective_id"], ["objectives.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("task_id", "objective_id"),
    )
    op.create_table(
        "event_objectives",
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("objective_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["objective_id"], ["objectives.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("event_id", "objective_id"),
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO task_objectives (task_id, objective_id) "
            "SELECT id, objective_id FROM tasks WHERE objective_id IS NOT NULL"
        )
    )
    conn.execute(
        sa.text(
            "INSERT INTO event_objectives (event_id, objective_id) "
            "SELECT id, objective_id FROM events WHERE objective_id IS NOT NULL"
        )
    )

    op.drop_constraint("tasks_objective_id_fkey", "tasks", type_="foreignkey")
    op.drop_column("tasks", "objective_id")
    op.drop_constraint("events_objective_id_fkey", "events", type_="foreignkey")
    op.drop_column("events", "objective_id")

    op.add_column("tasks", sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column("timezone", sa.String(length=64), nullable=True))
    op.add_column("tasks", sa.Column("recurrence_until", sa.DateTime(), nullable=True))
    op.add_column(
        "tasks",
        sa.Column(
            "overdue_policy",
            sa.String(length=32),
            server_default="keep_overdue",
            nullable=False,
        ),
    )

    op.create_table(
        "task_occurrences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("occurrence_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
        sa.Column("planned_for", sa.Date(), nullable=True),
        sa.Column("due_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("skipped_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("task_id", "occurrence_date", name="uq_task_occurrence_date"),
    )

    op.create_table(
        "event_occurrence_exceptions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("occurrence_start_at", sa.DateTime(), nullable=False),
        sa.Column("cancelled", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("start_at", sa.DateTime(), nullable=True),
        sa.Column("end_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "occurrence_start_at", name="uq_event_occurrence_exception"),
    )


def downgrade() -> None:
    op.drop_table("event_occurrence_exceptions")
    op.drop_table("task_occurrences")
    op.drop_column("tasks", "overdue_policy")
    op.drop_column("tasks", "recurrence_until")
    op.drop_column("tasks", "timezone")
    op.drop_column("tasks", "estimated_duration_minutes")

    op.add_column("events", sa.Column("objective_id", sa.Integer(), nullable=True))
    op.create_foreign_key("events_objective_id_fkey", "events", "objectives", ["objective_id"], ["id"])
    op.add_column("tasks", sa.Column("objective_id", sa.Integer(), nullable=True))
    op.create_foreign_key("tasks_objective_id_fkey", "tasks", "objectives", ["objective_id"], ["id"])

    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE tasks SET objective_id = ("
            "SELECT objective_id FROM task_objectives WHERE task_objectives.task_id = tasks.id LIMIT 1"
            ")"
        )
    )
    conn.execute(
        sa.text(
            "UPDATE events SET objective_id = ("
            "SELECT objective_id FROM event_objectives WHERE event_objectives.event_id = events.id LIMIT 1"
            ")"
        )
    )

    op.drop_table("event_objectives")
    op.drop_table("task_objectives")
