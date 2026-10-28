from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.task import OVERDUE_POLICIES
from app.recurrence.rrule_build import validate_rrule_scope

TASK_STATUSES = frozenset({"active", "completed", "cancelled"})


class TaskWriteBase(BaseModel):
    name: str = Field(..., max_length=255)
    planned_for: date
    due_at: datetime
    status: str = Field(default="active", max_length=32)
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    timezone: str | None = Field(None, max_length=64)
    recurrence_until: datetime | None = None
    estimated_duration_minutes: int | None = Field(None, ge=0, le=24 * 60)
    overdue_policy: str = Field(default="keep_overdue", max_length=32)
    domain_id: int
    event_id: int | None = None
    objective_ids: list[int] = Field(default_factory=list)

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

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("timezone must be a valid IANA name") from exc
        return value

    @field_validator("overdue_policy")
    @classmethod
    def validate_overdue_policy(cls, value: str) -> str:
        if value not in OVERDUE_POLICIES:
            raise ValueError(f"overdue_policy must be one of: {', '.join(sorted(OVERDUE_POLICIES))}")
        return value

    @model_validator(mode="after")
    def validate_recurrence(self) -> Self:
        if not self.is_recurring:
            return self
        if not self.rrule:
            raise ValueError("rrule is required when is_recurring is true")
        if not self.timezone:
            raise ValueError("timezone is required when is_recurring is true")
        if self.recurrence_until is None:
            raise ValueError("recurrence_until is required when is_recurring is true")
        validate_rrule_scope(self.rrule, self.timezone)
        return self


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
    timezone: str | None = Field(None, max_length=64)
    recurrence_until: datetime | None = None
    estimated_duration_minutes: int | None = Field(None, ge=0, le=24 * 60)
    overdue_policy: str | None = Field(None, max_length=32)
    domain_id: int | None = None
    event_id: int | None = None
    objective_ids: list[int] | None = None

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

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("timezone must be a valid IANA name") from exc
        return value

    @field_validator("overdue_policy")
    @classmethod
    def validate_overdue_policy(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in OVERDUE_POLICIES:
            raise ValueError(f"overdue_policy must be one of: {', '.join(sorted(OVERDUE_POLICIES))}")
        return value


class TaskRead(TaskWriteBase):
    id: int
    user_id: int
    completed_at: datetime | None = None
    series_id: int | None = None
    occurrence_date: date | None = None

    model_config = ConfigDict(from_attributes=True)
