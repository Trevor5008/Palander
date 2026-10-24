from dataclasses import dataclass, field
from typing import Protocol

from app.schedule.format_issues import FormatIssue


@dataclass(frozen=True)
class ParseContext:
    default_year: int
    timezone: str
    domain_hint: str | None = None
    term_start: str | None = None
    term_end: str | None = None
    format_hint: str = "auto"


@dataclass
class RawCandidate:
    title: str
    weekdays: list[str] = field(default_factory=list)
    start_time: str | None = None
    end_time: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    location: str | None = None
    source_snippet: str = ""
    source_page: int | None = None
    confidence: float = 0.0
    warnings: list[str] = field(default_factory=list)


@dataclass
class ScheduleParseResult:
    candidates: list[RawCandidate]
    format_issues: list[FormatIssue] = field(default_factory=list)


class ScheduleParser(Protocol):
    async def parse(self, text: str, context: ParseContext) -> ScheduleParseResult: ...
