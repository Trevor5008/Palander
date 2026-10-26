from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

OBJECTIVE_STATUSES = frozenset({"active", "paused", "completed", "cancelled"})


class ObjectiveWriteBase(BaseModel):
    title: str = Field(..., max_length=255, description="High-level target mission or outcome")
    target_date: datetime | None = Field(None, description="Completion boundary for the objective")
    status: str = Field(default="active", max_length=32)
    domain_id: int

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in OBJECTIVE_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(OBJECTIVE_STATUSES))}")
        return value


class ObjectiveCreate(ObjectiveWriteBase):
    pass


class ObjectiveUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    target_date: datetime | None = None
    status: str | None = Field(None, max_length=32)
    domain_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in OBJECTIVE_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(OBJECTIVE_STATUSES))}")
        return value


class ObjectiveRead(ObjectiveWriteBase):
    id: int
    user_id: int
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
