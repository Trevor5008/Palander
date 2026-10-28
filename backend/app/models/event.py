from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import event_objectives

if TYPE_CHECKING:
    from app.models.domain import Domain
    from app.models.event_occurrence_exception import EventOccurrenceException
    from app.models.objective import Objective
    from app.models.reminder import Reminder
    from app.models.task import Task
    from app.models.user import User


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_at: Mapped[datetime] = mapped_column(index=True)
    end_at: Mapped[datetime] = mapped_column(index=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    rrule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    recurrence_until: Mapped[datetime | None] = mapped_column(nullable=True)

    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    domain: Mapped["Domain"] = relationship(back_populates="events")
    user: Mapped["User"] = relationship(back_populates="events")
    objectives: Mapped[list["Objective"]] = relationship(
        secondary=event_objectives,
        back_populates="events",
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    occurrence_exceptions: Mapped[list["EventOccurrenceException"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
