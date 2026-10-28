from sqlalchemy import Column, ForeignKey, Integer, Table

from app.database import Base

task_objectives = Table(
    "task_objectives",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "objective_id",
        Integer,
        ForeignKey("objectives.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

event_objectives = Table(
    "event_objectives",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "objective_id",
        Integer,
        ForeignKey("objectives.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
