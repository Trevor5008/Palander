from datetime import datetime

from sqlalchemy.orm import Session

from app.models.event import Event
from app.recurrence.expand import expand_event_occurrences, series_may_intersect_range
from app.schemas.event import EventRead


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

    results: list[EventRead] = []
    for event in rows:
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
                        objective_id=event.objective_id,
                        series_id=None,
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
            objective_id=event.objective_id,
            range_start=range_start,
            range_end=range_end,
        ):
            results.append(
                EventRead(
                    id=event.id,
                    user_id=event.user_id,
                    title=occ.title,
                    start_at=occ.start_at,
                    end_at=occ.end_at,
                    is_recurring=True,
                    rrule=occ.rrule,
                    timezone=occ.timezone,
                    recurrence_until=occ.recurrence_until,
                    domain_id=occ.domain_id,
                    objective_id=occ.objective_id,
                    series_id=event.id,
                )
            )

    results.sort(key=lambda item: item.start_at)
    return results
