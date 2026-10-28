from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.recurrence.rrule_build import validate_rrule_scope


class EventWriteBase(BaseModel):
    title: str = Field(..., max_length=255)
    start_at: datetime
    end_at: datetime
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    timezone: str | None = Field(None, max_length=64)
    recurrence_until: datetime | None = None
    domain_id: int
    objective_ids: list[int] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

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

    @model_validator(mode="after")
    def validate_time_range(self) -> Self:
        if self.end_at < self.start_at:
            raise ValueError("end_at must be on or after start_at")
        return self

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
        if self.recurrence_until < self.start_at:
            raise ValueError("recurrence_until must be on or after start_at")
        validate_rrule_scope(self.rrule, self.timezone)
        return self


class EventCreate(EventWriteBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_recurring: bool | None = None
    rrule: str | None = Field(None, max_length=255)
    timezone: str | None = Field(None, max_length=64)
    recurrence_until: datetime | None = None
    domain_id: int | None = None
    objective_ids: list[int] | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

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


class EventRead(EventWriteBase):
    id: int
    user_id: int
    series_id: int | None = None
    occurrence_start_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


def validate_event_time_range(start_at: datetime, end_at: datetime) -> None:
    if end_at < start_at:
        raise ValueError("end_at must be on or after start_at")


def validate_event_recurrence_state(
    *,
    is_recurring: bool,
    rrule: str | None,
    timezone: str | None,
    recurrence_until: datetime | None,
    start_at: datetime,
) -> None:
    if not is_recurring:
        return
    EventWriteBase(
        title="valid",
        start_at=start_at,
        end_at=start_at,
        is_recurring=True,
        rrule=rrule,
        timezone=timezone,
        recurrence_until=recurrence_until,
        domain_id=1,
    )
