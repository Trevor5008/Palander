from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DailyNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_date: date
    content: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DailyNoteUpsert(BaseModel):
    content: str
    if_updated_at: datetime | None = None
