from datetime import datetime
# Import pydantic libraries
from pydantic import BaseModel, ConfigDict, Field

# Base
class TaskBase(BaseModel):
    name: str = Field(..., max_length=255)
    due_date: datetime
    is_recurring: bool = False
    rrule: str | None = Field(None, max_length=255)
    user_id: int
    domain_id: int | None = None
    event_id: int | None = None
    objective_id: int | None = None

# Create
class TaskCreate(TaskBase):
    pass

# Update
class TaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    due_date: datetime | None = None
    is_recurring: bool | None = None
    rrule: str | None = Field(None, max_length=255)
    domain_id: int | None = None
    event_id: int | None = None
    objective_id: int | None = None

# Read
class TaskRead(TaskBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
