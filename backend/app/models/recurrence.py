import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Recurrence(Base):
    __tablename__ = "recurrences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    periodicity: Mapped[str] = mapped_column(String, nullable=False)
    starts: Mapped[date] = mapped_column(Date, nullable=False)
    ends: Mapped[date | None] = mapped_column(Date)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id"))
    event_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("events.id"))

    task: Mapped["Task | None"] = relationship(back_populates="recurrences")
    event: Mapped["Event | None"] = relationship(back_populates="recurrences")
