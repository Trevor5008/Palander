from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.event import Event
    from app.models.reminder import Reminder
    from app.models.note import Note
    from app.models.objective import Objective
    from app.models.domain import Domain


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

    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    objective_id: Mapped[int | None] = mapped_column(ForeignKey("objectives.id"))
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)

    event: Mapped["Event | None"] = relationship(back_populates="tasks")
    user: Mapped["User"] = relationship(back_populates="tasks")
    objective: Mapped["Objective | None"] = relationship(back_populates="tasks")
    domain: Mapped["Domain"] = relationship(back_populates="tasks")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    notes: Mapped[list["Note"]] = relationship(back_populates="task", cascade="all, delete-orphan")
