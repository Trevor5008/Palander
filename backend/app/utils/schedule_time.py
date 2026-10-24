"""Time token normalization for schedule import."""

import re

_AM_PM_RE = re.compile(
    r"^(?P<hour>\d{1,2}):(?P<minute>\d{2})\s*(?P<ampm>AM|PM)$",
    re.IGNORECASE,
)


def parse_12h_time(token: str) -> str | None:
    """Parse 12-hour clock times like 12:30PM or 1:45 PM into HH:MM (24h)."""
    cleaned = re.sub(r"\s+", "", token.strip())
    match = _AM_PM_RE.match(cleaned)
    if not match:
        return None
    hour = int(match.group("hour"))
    minute = int(match.group("minute"))
    ampm = match.group("ampm").upper()
    if hour < 1 or hour > 12 or minute < 0 or minute > 59:
        return None
    if ampm == "PM" and hour != 12:
        hour += 12
    elif ampm == "AM" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def normalize_time_token(token: str) -> str | None:
    """Parse HH:MM, H:MM, HHMM, HMM, or 12h AM/PM into zero-padded HH:MM."""
    cleaned = token.strip()
    if not cleaned:
        return None
    if re.search(r"[AP]M", cleaned, re.IGNORECASE):
        return parse_12h_time(cleaned)
    if ":" in cleaned:
        parts = cleaned.split(":", 1)
        if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit():
            return None
        hour = int(parts[0])
        minute = int(parts[1])
    elif cleaned.isdigit():
        if len(cleaned) == 3:
            hour = int(cleaned[0])
            minute = int(cleaned[1:3])
        elif len(cleaned) == 4:
            hour = int(cleaned[0:2])
            minute = int(cleaned[2:4])
        elif len(cleaned) <= 2:
            hour = int(cleaned)
            minute = 0
        else:
            return None
    else:
        return None
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return None
    return f"{hour:02d}:{minute:02d}"
