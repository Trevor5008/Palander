from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.event import Event
from app.models.note import Note
from app.schemas.event_note import (
    EventNoteRead,
    EventNoteUpsert,
    SeriesNoteStackItem,
    SeriesNoteStackRead,
)

router = APIRouter(prefix="/events", tags=["events"])


def _get_event_or_404(db: Session, event_id: int, user_id: int) -> Event:
    event = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == user_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


def _normalize_dt(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _timestamps_match(stored: datetime, client: datetime) -> bool:
    return _normalize_dt(stored) == _normalize_dt(client)


def _get_event_note(
    db: Session,
    event_id: int,
    occurrence_start_at: datetime,
) -> Note | None:
    occ = _normalize_dt(occurrence_start_at)
    return (
        db.query(Note)
        .filter(
            Note.event_id == event_id,
            Note.occurrence_start_at == occ,
        )
        .first()
    )


def _empty_event_note(event_id: int, occurrence_start_at: datetime) -> EventNoteRead:
    return EventNoteRead(
        id=None,
        event_id=event_id,
        occurrence_start_at=occurrence_start_at,
        content="",
        created_at=None,
        updated_at=None,
    )


@router.get("/{event_id}/notes", response_model=EventNoteRead)
def get_event_note(
    event_id: int,
    occurrence_start_at: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _get_event_or_404(db, event_id, user_id)
    note = _get_event_note(db, event_id, occurrence_start_at)
    if note is None:
        return _empty_event_note(event_id, _normalize_dt(occurrence_start_at))
    return EventNoteRead.model_validate(note)


@router.put("/{event_id}/notes", response_model=EventNoteRead)
def upsert_event_note(
    event_id: int,
    body: EventNoteUpsert,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _get_event_or_404(db, event_id, user_id)
    occurrence = _normalize_dt(body.occurrence_start_at)
    now = datetime.now(UTC)
    note = _get_event_note(db, event_id, occurrence)

    if note is None:
        note = Note(
            content=body.content,
            event_id=event_id,
            occurrence_start_at=occurrence,
            created_at=now,
            updated_at=now,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return EventNoteRead.model_validate(note)

    if body.if_updated_at is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note already exists; send if_updated_at from the last read",
        )
    if not _timestamps_match(note.updated_at, body.if_updated_at):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note was updated elsewhere",
        )

    note.content = body.content
    note.updated_at = now
    db.commit()
    db.refresh(note)
    return EventNoteRead.model_validate(note)


@router.get("/{event_id}/series-notes", response_model=SeriesNoteStackRead)
def list_series_notes(
    event_id: int,
    occurrence_start_at: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    if not event.is_recurring:
        return SeriesNoteStackRead(items=[])

    active = _normalize_dt(occurrence_start_at)
    rows = (
        db.query(Note)
        .filter(
            Note.event_id == event_id,
            Note.occurrence_start_at.isnot(None),
            Note.occurrence_start_at != active,
        )
        .order_by(Note.occurrence_start_at.desc())
        .all()
    )
    items = [
        SeriesNoteStackItem(
            occurrence_start_at=row.occurrence_start_at,
            content=row.content,
            updated_at=row.updated_at,
        )
        for row in rows
    ]
    return SeriesNoteStackRead(items=items)
