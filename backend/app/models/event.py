from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.reminder import Reminder
    from app.models.task import Task
    from app.models.domain import Domain
    from app.models.objective import Objective
    from app.models.user import User

class Event(Base):
    __tablename__ = "events"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Event Title
    title: Mapped[str] = mapped_column(String, nullable=False)

    # Event Start and End Times
    start_at: Mapped[datetime] = mapped_column(index=True)
    end_at: Mapped[datetime] = mapped_column(index=True)

    # Event Recurring Status
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    # Event Recurring Rule
    rrule: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Foreign Keys
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    objective_id: Mapped[int | None] = mapped_column(
        ForeignKey("objectives.id"), nullable=True
    )

    # Relationships
    domain: Mapped["Domain"] = relationship(back_populates="events")
    user: Mapped["User"] = relationship(back_populates="events")
    objective: Mapped["Objective | None"] = relationship(back_populates="events")
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )