from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.daily_note import DailyNote
from app.models.event import Event
from app.models.note import Note
from app.models.task import Task

router = APIRouter(prefix="/export", tags=["export"])


class LegacyDailyNoteExport(BaseModel):
    id: int
    note_date: str
    content: str
    created_at: str
    updated_at: str


class LegacyEventNoteExport(BaseModel):
    id: int
    event_id: int | None
    task_id: int | None
    occurrence_start_at: str | None
    content: str
    created_at: str
    updated_at: str


class LegacyNotesExport(BaseModel):
    daily_notes: list[LegacyDailyNoteExport]
    event_notes: list[LegacyEventNoteExport]


@router.get("/legacy-notes", response_model=LegacyNotesExport)
def export_legacy_notes(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    daily_rows = (
        db.query(DailyNote)
        .filter(DailyNote.user_id == user_id)
        .order_by(DailyNote.note_date)
        .all()
    )
    event_notes = (
        db.query(Note)
        .join(Event, Note.event_id == Event.id)
        .filter(Event.user_id == user_id)
        .all()
    )
    task_notes = (
        db.query(Note)
        .join(Task, Note.task_id == Task.id)
        .filter(Task.user_id == user_id)
        .all()
    )
    all_notes = {n.id: n for n in event_notes + task_notes}

    return LegacyNotesExport(
        daily_notes=[
            LegacyDailyNoteExport(
                id=row.id,
                note_date=row.note_date.isoformat(),
                content=row.content,
                created_at=row.created_at.isoformat(),
                updated_at=row.updated_at.isoformat(),
            )
            for row in daily_rows
        ],
        event_notes=[
            LegacyEventNoteExport(
                id=n.id,
                event_id=n.event_id,
                task_id=n.task_id,
                occurrence_start_at=n.occurrence_start_at.isoformat() if n.occurrence_start_at else None,
                content=n.content,
                created_at=n.created_at.isoformat(),
                updated_at=n.updated_at.isoformat(),
            )
            for n in sorted(all_notes.values(), key=lambda x: x.id)
        ],
    )
