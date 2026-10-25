from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    event_id: int
    occurrence_start_at: datetime
    content: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class EventNoteUpsert(BaseModel):
    content: str
    occurrence_start_at: datetime
    if_updated_at: datetime | None = None


class SeriesNoteStackItem(BaseModel):
    occurrence_start_at: datetime
    content: str
    updated_at: datetime | None = None


class SeriesNoteStackRead(BaseModel):
    items: list[SeriesNoteStackItem]
