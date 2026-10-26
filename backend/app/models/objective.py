from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime, func
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

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    tasks: Mapped[list["Task"]] = relationship(back_populates="objective", cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship(back_populates="objective", cascade="all, delete-orphan")
    domain: Mapped["Domain"] = relationship(back_populates="objectives")
    user: Mapped["User"] = relationship(back_populates="objectives")
