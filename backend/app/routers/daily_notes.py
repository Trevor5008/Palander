from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.daily_note import DailyNote
from app.schemas.daily_note import DailyNoteRead, DailyNoteUpsert

router = APIRouter(prefix="/daily-notes", tags=["daily-notes"])


def _empty_read(note_date: date) -> DailyNoteRead:
    return DailyNoteRead(
        note_date=note_date,
        content="",
        created_at=None,
        updated_at=None,
    )


def _get_note_or_none(db: Session, user_id: int, note_date: date) -> DailyNote | None:
    return (
        db.query(DailyNote)
        .filter(DailyNote.user_id == user_id, DailyNote.note_date == note_date)
        .first()
    )


def _timestamps_match(stored: datetime, client: datetime) -> bool:
    if stored.tzinfo is None:
        stored = stored.replace(tzinfo=UTC)
    if client.tzinfo is None:
        client = client.replace(tzinfo=UTC)
    return stored == client


@router.get("/{note_date}", response_model=DailyNoteRead)
def get_daily_note(
    note_date: date,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    note = _get_note_or_none(db, user_id, note_date)
    if note is None:
        return _empty_read(note_date)
    return DailyNoteRead.model_validate(note)


@router.put("/{note_date}", response_model=DailyNoteRead)
def upsert_daily_note(
    note_date: date,
    body: DailyNoteUpsert,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    now = datetime.now(UTC)
    note = _get_note_or_none(db, user_id, note_date)

    if note is None:
        note = DailyNote(
            user_id=user_id,
            note_date=note_date,
            content=body.content,
            created_at=now,
            updated_at=now,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return DailyNoteRead.model_validate(note)

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
    return DailyNoteRead.model_validate(note)
