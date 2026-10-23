import re
from dataclasses import dataclass

from app.utils.schedule_time import normalize_time_token
from app.utils.schedule_weekdays import parse_weekday_tokens, resolve_weekday_token

_TIME_RANGE_RE = re.compile(
    r"(?P<start>\d{1,2}:?\d{2,4})\s*-\s*(?P<end>\d{1,2}:?\d{2,4})"
)


@dataclass(frozen=True)
class PlainLineParseResult:
    title: str | None = None
    weekdays: list[str] | None = None
    start_time: str | None = None
    end_time: str | None = None
    issue_code: str | None = None
    issue_message: str | None = None
    help_section: str = "plain"


def tokenize_schedule_line(line: str) -> list[str]:
    """Split line on whitespace after normalizing common separators to spaces."""
    normalized = re.sub(r"[,;/]+", " ", line.strip())
    normalized = _TIME_RANGE_RE.sub(
        lambda m: f" {m.group('start')} {m.group('end')} ",
        normalized,
    )
    return [part for part in normalized.split() if part]


def parse_plain_schedule_line(line: str) -> PlainLineParseResult:
    stripped = line.strip()
    if not stripped:
        return PlainLineParseResult()

    tokens = tokenize_schedule_line(stripped)
    if len(tokens) < 3:
        return _issue(
            "LINE_TOO_SHORT",
            "Need a title, weekdays, and start/end times (e.g. Chemistry Lab M W 0900 1145).",
        )

    end_time = normalize_time_token(tokens[-1])
    start_time = normalize_time_token(tokens[-2])
    if not start_time or not end_time:
        return _issue(
            "TIME_UNRECOGNIZED",
            "Could not read start/end times. Use 09:00 and 11:45 or 0900 and 1145 (spaces or a dash).",
        )

    day_tokens: list[str] = []
    idx = len(tokens) - 3
    while idx >= 0:
        token = tokens[idx]
        if resolve_weekday_token(token):
            day_tokens.insert(0, token)
            idx -= 1
            continue
        break

    if not day_tokens:
        return _issue(
            "WEEKDAY_UNRECOGNIZED",
            "Could not read weekdays. Use Mon Wed, M W, or Monday Wednesday — not single ambiguous letters alone without valid day codes.",
        )

    weekdays, unknown = parse_weekday_tokens(day_tokens)
    if unknown:
        return _issue(
            "WEEKDAY_UNRECOGNIZED",
            f"Unknown weekday token(s): {', '.join(unknown)}. "
            "Use M T W R F (T=Tuesday, R=Thursday), Mon/Wed, or full names.",
        )
    if not weekdays:
        return _issue(
            "WEEKDAY_UNRECOGNIZED",
            "No weekdays detected. Use M W, Mon Wed, or Monday Wednesday.",
        )

    title = " ".join(tokens[: idx + 1]).strip(" -")
    if not title:
        title = "Untitled"

    return PlainLineParseResult(
        title=title,
        weekdays=weekdays,
        start_time=start_time,
        end_time=end_time,
    )


def _issue(code: str, message: str) -> PlainLineParseResult:
    return PlainLineParseResult(
        issue_code=code,
        issue_message=message,
        help_section="plain",
    )
