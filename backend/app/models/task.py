from datetime import datetime

from sqlalchemy import ForeignKey, String, DateTime, Boolean
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

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Task Name
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Task Due Date
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)


    # Task Recurring Status
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    # Task Recurring Rule
    rrule: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Foreign Keys
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    objective_id: Mapped[int | None] = mapped_column(ForeignKey("objectives.id"))
    domain_id: Mapped[int | None] = mapped_column(ForeignKey("domains.id"))

    # Relationships
    event: Mapped["Event | None"] = relationship(back_populates="tasks")
    user: Mapped["User"] = relationship(back_populates="tasks")
    objective: Mapped["Objective | None"] = relationship(back_populates="tasks")
    domain: Mapped["Domain | None"] = relationship(back_populates="tasks")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="task", cascade="all, delete-orphan") 
    notes: Mapped[list["Note"]] = relationship(back_populates="task", cascade="all, delete-orphan")  
