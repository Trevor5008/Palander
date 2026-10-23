"""Weekday token aliases for schedule import (canonical MO–SU)."""

WEEKDAY_ALIASES: dict[str, tuple[str, ...]] = {
    "MO": ("mon", "monday", "m"),
    "TU": ("tue", "tues", "tuesday", "t"),
    "WE": ("wed", "wednesday", "w"),
    "TH": ("thu", "thur", "thurs", "thursday", "r"),
    "FR": ("fri", "friday", "f"),
    "SA": ("sat", "saturday", "s"),
    "SU": ("sun", "sunday", "u", "su"),
}

_ALIAS_TO_CODE: dict[str, str] = {}
for code, aliases in WEEKDAY_ALIASES.items():
    for alias in aliases:
        key = alias.lower()
        if key not in _ALIAS_TO_CODE or len(alias) > len(_ALIAS_TO_CODE.get(key, "")):
            _ALIAS_TO_CODE[key] = code


def resolve_weekday_token(token: str) -> str | None:
    cleaned = token.strip().lower()
    if not cleaned:
        return None
    if cleaned in _ALIAS_TO_CODE:
        return _ALIAS_TO_CODE[cleaned]
    prefix = cleaned[:3]
    return _ALIAS_TO_CODE.get(prefix)


def parse_weekday_tokens(tokens: list[str]) -> tuple[list[str], list[str]]:
    """Return (weekday codes MO..SU, unknown tokens). Preserves first-seen order, deduped."""
    codes: list[str] = []
    unknown: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        code = resolve_weekday_token(token)
        if code:
            if code not in seen:
                codes.append(code)
                seen.add(code)
        else:
            unknown.append(token)
    return codes, unknown
