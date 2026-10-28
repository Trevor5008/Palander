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
from app.services.link_validation import validate_domain_and_objectives
from app.services.objective_links import objective_ids_for_event, set_event_objectives
from app.services.recurrence_edit import delete_event_with_scope, patch_event_with_scope

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


def _event_to_read(event: Event) -> EventRead:
    return EventRead(
        id=event.id,
        user_id=event.user_id,
        title=event.title,
        start_at=event.start_at,
        end_at=event.end_at,
        is_recurring=event.is_recurring,
        rrule=event.rrule,
        timezone=event.timezone,
        recurrence_until=event.recurrence_until,
        domain_id=event.domain_id,
        objective_ids=objective_ids_for_event(event),
        series_id=None,
        occurrence_start_at=None,
    )


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    body: EventCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    validate_domain_and_objectives(db, user_id, body.domain_id, body.objective_ids)
    data = body.model_dump(exclude={"objective_ids"})
    event = Event(**data, user_id=user_id)
    db.add(event)
    db.flush()
    set_event_objectives(db, event, body.objective_ids)
    db.commit()
    db.refresh(event)
    return _event_to_read(event)


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
    return _event_to_read(event)


@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    body: EventUpdate,
    scope: str = Query(default="series"),
    occurrence_start_at: datetime | None = Query(default=None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    try:
        result = patch_event_with_scope(
            db,
            event,
            body,
            scope=scope,
            occurrence_start_at=occurrence_start_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    db.commit()
    db.refresh(result)
    return _event_to_read(result)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    scope: str = Query(default="series"),
    occurrence_start_at: datetime | None = Query(default=None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(db, event_id, user_id)
    try:
        delete_event_with_scope(
            db,
            event,
            scope=scope,
            occurrence_start_at=occurrence_start_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    db.commit()
