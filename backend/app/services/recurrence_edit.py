from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.event_occurrence_exception import EventOccurrenceException
from app.schemas.event import EventUpdate, validate_event_recurrence_state, validate_event_time_range
from app.services.objective_links import set_event_objectives


def _upsert_exception(
    db: Session,
    event_id: int,
    occurrence_start_at: datetime,
    *,
    cancelled: bool = False,
    title: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> None:
    row = (
        db.query(EventOccurrenceException)
        .filter(
            EventOccurrenceException.event_id == event_id,
            EventOccurrenceException.occurrence_start_at == occurrence_start_at,
        )
        .first()
    )
    if row is None:
        row = EventOccurrenceException(
            event_id=event_id,
            occurrence_start_at=occurrence_start_at,
        )
        db.add(row)
    row.cancelled = cancelled
    if title is not None:
        row.title = title
    if start_at is not None:
        row.start_at = start_at
    if end_at is not None:
        row.end_at = end_at


def patch_event_with_scope(
    db: Session,
    event: Event,
    body: EventUpdate,
    *,
    scope: str,
    occurrence_start_at: datetime | None,
) -> Event | list[Event]:
    updates = body.model_dump(exclude_unset=True)
    objective_ids = updates.pop("objective_ids", None)

    if scope == "series" or not event.is_recurring:
        domain_id = updates.get("domain_id", event.domain_id)
        if objective_ids is not None:
            from app.services.link_validation import validate_domain_and_objectives

            validate_domain_and_objectives(db, event.user_id, domain_id, objective_ids)
            set_event_objectives(db, event, objective_ids)
        for key, value in updates.items():
            setattr(event, key, value)
        validate_event_time_range(event.start_at, event.end_at)
        validate_event_recurrence_state(
            is_recurring=event.is_recurring,
            rrule=event.rrule,
            timezone=event.timezone,
            recurrence_until=event.recurrence_until,
            start_at=event.start_at,
        )
        return event

    if occurrence_start_at is None:
        raise ValueError("occurrence_start_at is required for occurrence or future scope")

    if scope == "occurrence":
        _upsert_exception(
            db,
            event.id,
            occurrence_start_at,
            title=updates.get("title"),
            start_at=updates.get("start_at"),
            end_at=updates.get("end_at"),
        )
        if objective_ids is not None:
            set_event_objectives(db, event, objective_ids)
        return event

    if scope == "future":
        new_event = Event(
            user_id=event.user_id,
            domain_id=updates.get("domain_id", event.domain_id),
            title=updates.get("title", event.title),
            start_at=updates.get("start_at", occurrence_start_at),
            end_at=updates.get("end_at", event.end_at),
            is_recurring=updates.get("is_recurring", event.is_recurring),
            rrule=updates.get("rrule", event.rrule),
            timezone=updates.get("timezone", event.timezone),
            recurrence_until=updates.get("recurrence_until", event.recurrence_until),
        )
        if event.recurrence_until is not None:
            event.recurrence_until = occurrence_start_at - timedelta(seconds=1)
        db.add(new_event)
        db.flush()
        if objective_ids is not None:
            set_event_objectives(db, new_event, objective_ids)
        else:
            set_event_objectives(db, new_event, [o.id for o in event.objectives])
        validate_event_time_range(new_event.start_at, new_event.end_at)
        validate_event_recurrence_state(
            is_recurring=new_event.is_recurring,
            rrule=new_event.rrule,
            timezone=new_event.timezone,
            recurrence_until=new_event.recurrence_until,
            start_at=new_event.start_at,
        )
        return new_event

    raise ValueError("scope must be occurrence, future, or series")


def delete_event_with_scope(
    db: Session,
    event: Event,
    *,
    scope: str,
    occurrence_start_at: datetime | None,
) -> None:
    if scope == "series" or not event.is_recurring:
        db.delete(event)
        return

    if occurrence_start_at is None:
        raise ValueError("occurrence_start_at is required for occurrence or future scope")

    if scope == "occurrence":
        _upsert_exception(db, event.id, occurrence_start_at, cancelled=True)
        return

    if scope == "future":
        event.recurrence_until = occurrence_start_at - timedelta(seconds=1)
        return

    raise ValueError("scope must be occurrence, future, or series")
