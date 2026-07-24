from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.domain import Domain
    from app.models.task import Task
    from app.models.event import Event
    from app.models.user import User

class Objective(Base):
    """Macro-level goals or long-term missions anchored to a parent Domain."""
    __tablename__ = "objectives"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Objective Title
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Objective Target Date
    target_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Foreign Keys
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(back_populates="objective", cascade="all, delete-orphan") # noqa: F821
    events: Mapped[list["Event"]] = relationship(back_populates="objective", cascade="all, delete-orphan") # noqa: F821
    domain: Mapped["Domain"] = relationship(back_populates="objectives")
    user: Mapped["User"] = relationship(back_populates="objectives")
