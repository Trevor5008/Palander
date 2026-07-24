from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from app.database import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.event import Event


class Reminder(Base):
    __tablename__ = "reminders"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Reminder Text
    text: Mapped[str] = mapped_column(String, nullable=False)

    # Foreign Keys
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"))
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))

    # Relationships
    task: Mapped["Task | None"] = relationship(back_populates="reminders")
    event: Mapped["Event | None"] = relationship(back_populates="reminders")

    __table_args__ = (
        CheckConstraint(
            "(task_id IS NOT NULL AND event_id IS NULL) OR (task_id IS NULL AND event_id IS NOT NULL)",
            name="check_reminder_owner",
        ),
    )
