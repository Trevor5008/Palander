from sqlalchemy import String
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship 

from app.database import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.event import Event
    from app.models.objective import Objective
    from app.models.domain import Domain

class User(Base):
    __tablename__ = "users"

    # Primary Key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Username
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # User Email
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(back_populates="user")
    events: Mapped[list["Event"]] = relationship(back_populates="user")
    objectives: Mapped[list["Objective"]] = relationship(back_populates="user")
    domains: Mapped[list["Domain"]] = relationship(back_populates="user")