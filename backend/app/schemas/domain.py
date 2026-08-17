# Import pydantic libraries
from pydantic import BaseModel, ConfigDict, Field

# Domain Schemas
# Pydantic models for Domain entity operations

# Base
class DomainBase(BaseModel):
    name: str = Field(..., max_length=100, description="Name of the life pillar (e.g., 'Career')")

# Create
class DomainCreate(DomainBase):
    pass

# Update
class DomainUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)

# Read
class DomainRead(DomainBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)