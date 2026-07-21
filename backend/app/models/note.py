import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.id"))
    event_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("events.id"))

    task: Mapped["Task | None"] = relationship(back_populates="notes")
    event: Mapped["Event | None"] = relationship(back_populates="notes")
