from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.database import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.event import Event


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"))
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"))
    occurrence_start_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    task: Mapped["Task | None"] = relationship(back_populates="notes")
    event: Mapped["Event | None"] = relationship(back_populates="notes")

    __table_args__ = (
        CheckConstraint(
            "(task_id IS NOT NULL AND event_id IS NULL) OR (task_id IS NULL AND event_id IS NOT NULL)",
            name="check_note_owner",
        ),
        UniqueConstraint(
            "event_id",
            "occurrence_start_at",
            name="uq_notes_event_occurrence",
        ),
    )
