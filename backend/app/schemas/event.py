from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class EventWriteBase(BaseModel):
    title: str = Field(..., max_length=255)
    start_at: datetime
    end_at: datetime
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    domain_id: int
    objective_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

    @model_validator(mode="after")
    def validate_time_range(self) -> Self:
        if self.end_at < self.start_at:
            raise ValueError("end_at must be on or after start_at")
        return self


class EventCreate(EventWriteBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_recurring: bool | None = None
    rrule: str | None = Field(None, max_length=255)
    domain_id: int | None = None
    objective_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped


class EventRead(EventWriteBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


def validate_event_time_range(start_at: datetime, end_at: datetime) -> None:
    if end_at < start_at:
        raise ValueError("end_at must be on or after start_at")
