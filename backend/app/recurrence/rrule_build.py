import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from dateutil.rrule import rrulestr

WEEKDAY_CODES = ("MO", "TU", "WE", "TH", "FR", "SA", "SU")
ALLOWED_FREQ = frozenset({"DAILY", "WEEKLY", "MONTHLY"})
FORBIDDEN_TOKENS = ("FREQ=YEARLY", "BYSETPOS", "COUNT=")


def _format_until(until: datetime, tz_name: str) -> str:
    tz = ZoneInfo(tz_name)
    until_local = until if until.tzinfo else until.replace(tzinfo=tz)
    until_utc = until_local.astimezone(timezone.utc)
    return until_utc.strftime("%Y%m%dT%H%M%SZ")


def build_rrule(
    *,
    freq: str,
    interval: int,
    until: datetime,
    tz_name: str,
    weekdays: list[str] | None = None,
) -> str:
    freq_upper = freq.upper()
    if freq_upper not in ALLOWED_FREQ:
        raise ValueError(f"Unsupported FREQ: {freq}")
    if interval < 1 or interval > 99:
        raise ValueError("INTERVAL must be between 1 and 99")

    until_str = _format_until(until, tz_name)
    parts = [f"FREQ={freq_upper}"]
    if interval > 1:
        parts.append(f"INTERVAL={interval}")
    if freq_upper == "WEEKLY":
        normalized = _normalize_weekdays(weekdays or [])
        if not normalized:
            raise ValueError("At least one weekday is required for weekly recurrence")
        parts.append(f"BYDAY={','.join(normalized)}")
    parts.append(f"UNTIL={until_str}")
    rrule = ";".join(parts)
    if len(rrule) > 255:
        raise ValueError("RRULE exceeds maximum length")
    validate_rrule_scope(rrule, tz_name)
    return rrule


def build_weekly_rrule(weekdays: list[str], until: datetime, tz_name: str) -> str:
    return build_rrule(freq="WEEKLY", interval=1, until=until, tz_name=tz_name, weekdays=weekdays)


def _parse_freq(upper: str) -> str | None:
    match = re.search(r"FREQ=([A-Z]+)", upper)
    return match.group(1) if match else None


def _parse_interval(upper: str) -> int:
    match = re.search(r"INTERVAL=(\d+)", upper)
    if not match:
        return 1
    return int(match.group(1))


def validate_rrule_scope(rrule: str, tz_name: str) -> None:
    if not rrule or len(rrule) > 255:
        raise ValueError("Invalid RRULE length")
    upper = rrule.upper()
    freq = _parse_freq(upper)
    if freq not in ALLOWED_FREQ:
        raise ValueError("FREQ must be DAILY, WEEKLY, or MONTHLY")
    interval = _parse_interval(upper)
    if interval < 1 or interval > 99:
        raise ValueError("INTERVAL must be between 1 and 99")
    if freq == "WEEKLY" and "BYDAY=" not in upper:
        raise ValueError("RRULE must include BYDAY for weekly recurrence")
    if "UNTIL=" not in upper:
        raise ValueError("RRULE must include UNTIL")
    for token in FORBIDDEN_TOKENS:
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
