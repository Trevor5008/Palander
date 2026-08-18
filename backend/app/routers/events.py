from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventRead, EventUpdate, validate_event_time_range

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


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    body: EventCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = Event(**body.model_dump(), user_id=user_id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("", response_model=list[EventRead])
def list_events(
    start: datetime = Query(...),
    end: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(Event)
        .filter(
            Event.user_id == user_id,
            Event.start_at >= start,
            Event.start_at <= end,
        )
        .order_by(Event.start_at)
        .all()
    )


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_event_or_404(db, event_id, user_id)


@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    body: EventUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    try:
        validate_event_time_range(event.start_at, event.end_at)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    db.delete(event)
    db.commit()
