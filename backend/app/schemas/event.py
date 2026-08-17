from datetime import datetime
# Import pydantic libraries
from pydantic import BaseModel, ConfigDict, Field

# Base
class EventBase(BaseModel):
    title: str = Field(..., max_length=255)
    start_at: datetime
    end_at: datetime
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    domain_id: int
    user_id: int
    objective_id: int | None = None

# Create
class EventCreate(EventBase):
    pass

# Update
class EventUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_recurring: bool | None = None
    rrule: str | None = Field(None, max_length=255)
    domain_id: int | None = None
    objective_id: int | None = None

# Read
class EventRead(EventBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
