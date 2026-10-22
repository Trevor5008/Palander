from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ParseContext:
    default_year: int
    timezone: str
    domain_hint: str | None = None


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
    confidence: float = 0.0
    warnings: list[str] = field(default_factory=list)


class ScheduleParser(Protocol):
    async def parse(self, text: str, context: ParseContext) -> list[RawCandidate]: ...
