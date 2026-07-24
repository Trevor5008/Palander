from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.objective import Objective
    from app.models.event import Event
    from app.models.task import Task


class Domain(Base):
    """Root container representing core life pillars (e.g., career, academics, finances)"""
    __tablename__ = "domains"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Domain Name
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # User Foreign Key
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="domains")
    objectives: Mapped[list["Objective"]] = relationship(
        back_populates="domain", cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(back_populates="domain")
    tasks: Mapped[list["Task"]] = relationship(back_populates="domain")

