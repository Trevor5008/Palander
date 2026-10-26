from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.event import Event
from app.schemas.event import (
    EventCreate,
    EventRead,
    EventUpdate,
    validate_event_recurrence_state,
    validate_event_time_range,
)
from app.services.events_list import list_events_in_range
from app.services.link_validation import validate_domain_and_objective

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
    validate_domain_and_objective(db, user_id, body.domain_id, body.objective_id)
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
    return list_events_in_range(db, user_id, start, end)


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    return EventRead.model_validate(event).model_copy(update={"series_id": None})


@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    body: EventUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    updates = body.model_dump(exclude_unset=True)
    domain_id = updates.get("domain_id", event.domain_id)
    objective_id = updates.get("objective_id", event.objective_id)
    if "domain_id" in updates or "objective_id" in updates:
        if objective_id is not None and "domain_id" not in updates:
            domain_id = event.domain_id
        validate_domain_and_objective(db, user_id, domain_id, objective_id)
    for key, value in updates.items():
        setattr(event, key, value)
    try:
        validate_event_time_range(event.start_at, event.end_at)
        validate_event_recurrence_state(
            is_recurring=event.is_recurring,
            rrule=event.rrule,
            timezone=event.timezone,
            recurrence_until=event.recurrence_until,
            start_at=event.start_at,
        )
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
