from datetime import datetime

from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.event_occurrence_exception import EventOccurrenceException
from app.recurrence.expand import expand_event_occurrences, series_may_intersect_range
from app.schemas.event import EventRead
from app.services.objective_links import objective_ids_for_event


def _exceptions_by_key(
    db: Session, event_ids: list[int]
) -> dict[tuple[int, datetime], EventOccurrenceException]:
    if not event_ids:
        return {}
    rows = (
        db.query(EventOccurrenceException)
        .filter(EventOccurrenceException.event_id.in_(event_ids))
        .all()
    )
    return {(row.event_id, row.occurrence_start_at): row for row in rows}


def _apply_exception(
    occ,
    exc: EventOccurrenceException | None,
) -> tuple[str, datetime, datetime, datetime | None] | None:
    if exc is not None and exc.cancelled:
        return None
    title = occ.title
    start_at = occ.start_at
    end_at = occ.end_at
    occurrence_start_at = occ.occurrence_start_at
    if exc is not None:
        if exc.title is not None:
            title = exc.title
        if exc.start_at is not None:
            start_at = exc.start_at
        if exc.end_at is not None:
            end_at = exc.end_at
    return title, start_at, end_at, occurrence_start_at


def list_events_in_range(
    db: Session,
    user_id: int,
    range_start: datetime,
    range_end: datetime,
) -> list[EventRead]:
    rows = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.start_at)
        .all()
    )
    recurring_ids = [e.id for e in rows if e.is_recurring]
    exc_map = _exceptions_by_key(db, recurring_ids)

    results: list[EventRead] = []
    for event in rows:
        objective_ids = objective_ids_for_event(event)
        if not event.is_recurring:
            if event.start_at < range_end and event.end_at > range_start:
                results.append(
                    EventRead(
                        id=event.id,
                        user_id=event.user_id,
                        title=event.title,
                        start_at=event.start_at,
                        end_at=event.end_at,
                        is_recurring=False,
                        rrule=event.rrule,
                        timezone=event.timezone,
                        recurrence_until=event.recurrence_until,
                        domain_id=event.domain_id,
                        objective_ids=objective_ids,
                        series_id=None,
                        occurrence_start_at=None,
                    )
                )
            continue

        if not series_may_intersect_range(
            event.start_at,
            event.recurrence_until,
            range_start,
            range_end,
        ):
            continue

        for occ in expand_event_occurrences(
            event_id=event.id,
            title=event.title,
            start_at=event.start_at,
            end_at=event.end_at,
            is_recurring=event.is_recurring,
            rrule=event.rrule,
            timezone_name=event.timezone,
            recurrence_until=event.recurrence_until,
            domain_id=event.domain_id,
            user_id=event.user_id,
            objective_ids=objective_ids,
            range_start=range_start,
            range_end=range_end,
        ):
            key = (event.id, occ.occurrence_start_at) if occ.occurrence_start_at else None
            exc = exc_map.get(key) if key else None
            applied = _apply_exception(occ, exc)
            if applied is None:
                continue
            title, start_at, end_at, occurrence_start_at = applied
            results.append(
                EventRead(
                    id=event.id,
                    user_id=event.user_id,
                    title=title,
                    start_at=start_at,
                    end_at=end_at,
                    is_recurring=True,
                    rrule=occ.rrule,
                    timezone=occ.timezone,
                    recurrence_until=occ.recurrence_until,
                    domain_id=occ.domain_id,
                    objective_ids=list(occ.objective_ids),
                    series_id=event.id,
                    occurrence_start_at=occurrence_start_at,
                )
            )

    results.sort(key=lambda item: item.start_at)
    return results
