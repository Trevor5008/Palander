from pydantic import BaseModel, ConfigDict, Field, field_validator


class DomainWriteBase(BaseModel):
    name: str = Field(..., max_length=100, description="Name of the life pillar (e.g., 'Career')")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped


class DomainCreate(DomainWriteBase):
    pass


class DomainUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped


class DomainRead(DomainWriteBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
