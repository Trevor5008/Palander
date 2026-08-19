from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskWriteBase(BaseModel):
    name: str = Field(..., max_length=255)
    due_date: datetime
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    domain_id: int | None = None
    event_id: int | None = None
    objective_id: int | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped


class TaskCreate(TaskWriteBase):
    pass


class TaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    due_date: datetime | None = None
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


class TaskRead(TaskWriteBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
