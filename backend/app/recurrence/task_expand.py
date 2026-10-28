from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from dateutil.rrule import rrulestr


def expand_task_occurrence_dates(
    *,
    planned_for: date,
    due_at: datetime,
    rrule: str,
    timezone_name: str,
    recurrence_until: datetime | None,
    range_start: date,
    range_end: date,
) -> list[date]:
    tz = ZoneInfo(timezone_name)
    due_time = due_at.time()
    dtstart = datetime.combine(planned_for, due_time).replace(tzinfo=tz)
    rule = rrulestr(f"RRULE:{rrule}", dtstart=dtstart)

    until_local = None
    if recurrence_until is not None:
        until_local = (
            recurrence_until.replace(tzinfo=tz)
            if recurrence_until.tzinfo is None
            else recurrence_until.astimezone(tz)
        )

    range_start_dt = datetime.combine(range_start, time.min).replace(tzinfo=tz)
    range_end_dt = datetime.combine(range_end, time(23, 59, 59)).replace(tzinfo=tz)
    if until_local is not None and until_local < range_start_dt:
        return []

    effective_end = range_end_dt
    if until_local is not None and until_local < effective_end:
        effective_end = until_local

    dates: list[date] = []
    for occ in rule.between(range_start_dt, effective_end, inc=True):
        occ_date = occ.astimezone(tz).date()
        if range_start <= occ_date <= range_end:
            dates.append(occ_date)
    return dates


def due_at_for_occurrence_date(series_due_at: datetime, occurrence_date: date) -> datetime:
    return datetime.combine(occurrence_date, series_due_at.time())
