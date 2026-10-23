"""Time token normalization for schedule import."""


def normalize_time_token(token: str) -> str | None:
    """Parse HH:MM, H:MM, HHMM, or HMM into zero-padded HH:MM."""
    cleaned = token.strip()
    if not cleaned:
        return None
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
