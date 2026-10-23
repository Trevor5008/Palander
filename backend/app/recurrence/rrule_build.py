from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from dateutil.rrule import rrulestr

WEEKDAY_CODES = ("MO", "TU", "WE", "TH", "FR", "SA", "SU")


def build_weekly_rrule(weekdays: list[str], until: datetime, tz_name: str) -> str:
    normalized = _normalize_weekdays(weekdays)
    if not normalized:
        raise ValueError("At least one weekday is required")

    tz = ZoneInfo(tz_name)
    until_local = until if until.tzinfo else until.replace(tzinfo=tz)
    until_utc = until_local.astimezone(timezone.utc)
    until_str = until_utc.strftime("%Y%m%dT%H%M%SZ")
    byday = ",".join(normalized)
    rrule = f"FREQ=WEEKLY;BYDAY={byday};UNTIL={until_str}"
    if len(rrule) > 255:
        raise ValueError("RRULE exceeds maximum length")
    return rrule


def validate_rrule_scope(rrule: str, tz_name: str) -> None:
    if not rrule or len(rrule) > 255:
        raise ValueError("Invalid RRULE length")
    upper = rrule.upper()
    if "FREQ=WEEKLY" not in upper:
        raise ValueError("Only weekly recurrence is supported")
    if "BYDAY=" not in upper:
        raise ValueError("RRULE must include BYDAY")
    if "UNTIL=" not in upper:
        raise ValueError("RRULE must include UNTIL")
    for token in ("FREQ=MONTHLY", "FREQ=YEARLY", "FREQ=DAILY", "BYSETPOS", "COUNT="):
        if token in upper:
            raise ValueError(f"Unsupported RRULE token: {token}")

    tz = ZoneInfo(tz_name)
    try:
        rrulestr(f"RRULE:{rrule}", dtstart=datetime(2026, 1, 1, 9, 0, tzinfo=tz))
    except (ValueError, TypeError) as exc:
        raise ValueError("RRULE is not parseable") from exc


def _normalize_weekdays(weekdays: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for day in weekdays:
        code = day.strip().upper()[:2]
        if code in WEEKDAY_CODES and code not in seen:
            seen.add(code)
            ordered.append(code)
    return ordered
