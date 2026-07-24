from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# Objective Schemas
# Pydantic models for Objective entity operations

class ObjectiveBase(BaseModel):
    title: str = Field(..., max_length=255, description="High-level target mission or outcome")
    target_date: datetime | None = Field(None, description="Completion boundary for the objective")
    domain_id: int


class ObjectiveCreate(ObjectiveBase):
    pass


class ObjectiveUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    target_date: datetime | None = None
    domain_id: int | None = None


class ObjectiveRead(ObjectiveBase):
    id: int

    model_config = ConfigDict(from_attributes=True)