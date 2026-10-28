from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dateutil.rrule import rrulestr


@dataclass(frozen=True)
class EventOccurrence:
    series_id: int
    title: str
    start_at: datetime
    end_at: datetime
    is_recurring: bool
    rrule: str | None
    timezone: str | None
    recurrence_until: datetime | None
    domain_id: int
    user_id: int
    objective_ids: tuple[int, ...]
    occurrence_start_at: datetime | None = None


def _as_local(dt: datetime, tz: ZoneInfo) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt.astimezone(tz)


def _strip_tz(dt: datetime) -> datetime:
    return dt.replace(tzinfo=None)


def expand_event_occurrences(
    *,
    event_id: int,
    title: str,
    start_at: datetime,
    end_at: datetime,
    is_recurring: bool,
    rrule: str | None,
    timezone_name: str | None,
    recurrence_until: datetime | None,
    domain_id: int,
    user_id: int,
    objective_ids: list[int],
    range_start: datetime,
    range_end: datetime,
) -> list[EventOccurrence]:
    ids = tuple(sorted(objective_ids))
    if not is_recurring or not rrule or not timezone_name:
        if _overlaps(start_at, end_at, range_start, range_end):
            return [
                EventOccurrence(
                    series_id=event_id,
                    title=title,
                    start_at=start_at,
                    end_at=end_at,
                    is_recurring=False,
                    rrule=None,
                    timezone=None,
                    recurrence_until=None,
                    domain_id=domain_id,
                    user_id=user_id,
                    objective_ids=ids,
                    occurrence_start_at=None,
                )
            ]
        return []

    tz = ZoneInfo(timezone_name)
    duration = end_at - start_at
    dtstart = _as_local(start_at, tz)
    rule = rrulestr(f"RRULE:{rrule}", dtstart=dtstart)

    range_start_local = _as_local(range_start, tz) if range_start.tzinfo else range_start.replace(tzinfo=tz)
    range_end_local = _as_local(range_end, tz) if range_end.tzinfo else range_end.replace(tzinfo=tz)

    occurrences: list[EventOccurrence] = []
    for occ_start in rule.between(range_start_local, range_end_local, inc=True):
        occ_end = occ_start + duration
        occ_start_naive = _strip_tz(occ_start)
        occ_end_naive = _strip_tz(occ_end)
        if _overlaps(occ_start_naive, occ_end_naive, range_start, range_end):
            occurrences.append(
                EventOccurrence(
                    series_id=event_id,
                    title=title,
                    start_at=occ_start_naive,
                    end_at=occ_end_naive,
                    is_recurring=True,
                    rrule=rrule,
                    timezone=timezone_name,
                    recurrence_until=recurrence_until,
                    domain_id=domain_id,
                    user_id=user_id,
                    objective_ids=ids,
                    occurrence_start_at=occ_start_naive,
                )
            )
    return occurrences


def _overlaps(start: datetime, end: datetime, window_start: datetime, window_end: datetime) -> bool:
    return start < window_end and end > window_start


def series_may_intersect_range(
    start_at: datetime,
    recurrence_until: datetime | None,
    range_start: datetime,
    range_end: datetime,
) -> bool:
    if start_at >= range_end:
        return False
    if recurrence_until is not None and recurrence_until <= range_start:
        return False
    return True
