from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ObjectiveWriteBase(BaseModel):
    title: str = Field(..., max_length=255, description="High-level target mission or outcome")
    target_date: datetime | None = Field(None, description="Completion boundary for the objective")
    domain_id: int

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped


class ObjectiveCreate(ObjectiveWriteBase):
    pass


class ObjectiveUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    target_date: datetime | None = None
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


class ObjectiveRead(ObjectiveWriteBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
