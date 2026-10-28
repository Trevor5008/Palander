from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import task_objectives

if TYPE_CHECKING:
    from app.models.domain import Domain
    from app.models.event import Event
    from app.models.objective import Objective
    from app.models.reminder import Reminder
    from app.models.task_occurrence import TaskOccurrence
    from app.models.user import User

OVERDUE_POLICIES = frozenset({"keep_overdue", "skip_expired", "carry_forward"})


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    planned_for: Mapped[date] = mapped_column(Date, nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    rrule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    recurrence_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overdue_policy: Mapped[str] = mapped_column(String(32), nullable=False, default="keep_overdue")

    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)

    event: Mapped["Event | None"] = relationship(back_populates="tasks")
    user: Mapped["User"] = relationship(back_populates="tasks")
    domain: Mapped["Domain"] = relationship(back_populates="tasks")
    objectives: Mapped[list["Objective"]] = relationship(
        secondary=task_objectives,
        back_populates="tasks",
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    occurrences: Mapped[list["TaskOccurrence"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
