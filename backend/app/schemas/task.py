from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

TASK_STATUSES = frozenset({"active", "completed", "cancelled"})


class TaskWriteBase(BaseModel):
    name: str = Field(..., max_length=255)
    planned_for: date
    due_at: datetime
    status: str = Field(default="active", max_length=32)
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    domain_id: int
    event_id: int | None = None
    objective_id: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in TASK_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(TASK_STATUSES))}")
        return value


class TaskCreate(TaskWriteBase):
    pass


class TaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    planned_for: date | None = None
    due_at: datetime | None = None
    status: str | None = Field(None, max_length=32)
    completed_at: datetime | None = None
    is_recurring: bool | None = None
    rrule: str | None = Field(None, max_length=255)
    domain_id: int | None = None
    event_id: int | None = None
    objective_id: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in TASK_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(TASK_STATUSES))}")
        return value


class TaskRead(TaskWriteBase):
    id: int
    user_id: int
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
