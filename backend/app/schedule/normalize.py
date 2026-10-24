from dataclasses import dataclass, field
from datetime import datetime

from app.recurrence.humanize import humanize_rrule
from app.recurrence.rrule_build import build_weekly_rrule
from app.schedule.parser import ParseContext, RawCandidate
from app.schedule.registry import CONFIDENCE_THRESHOLD


@dataclass
class ImportCandidate:
    client_key: str
    title: str
    start_at: datetime
    end_at: datetime
    weekdays: list[str]
    recurrence_until: datetime
    timezone: str
    rrule: str
    rrule_human: str
    domain_id: int | None
    source_snippet: str
    confidence: float
    source_page: int | None = None
    source_filename: str | None = None
    warnings: list[str] = field(default_factory=list)
    duplicate_of_event_id: int | None = None
    included: bool = True
    unresolved: bool = False


def normalize_candidates(
    raw_candidates: list[RawCandidate],
    context: ParseContext,
    default_domain_id: int | None,
) -> list[ImportCandidate]:
    normalized: list[ImportCandidate] = []
    for index, raw in enumerate(raw_candidates):
        warnings = list(raw.warnings)
        if not raw.title.strip():
            warnings.append("Missing title")
        if not raw.weekdays:
            warnings.append("Missing weekdays")
        if not raw.start_time or not raw.end_time:
            warnings.append("Missing start/end time")
        if raw.confidence < CONFIDENCE_THRESHOLD:
            warnings.append("Low confidence — review before import")

        unresolved = bool(warnings)
        start_date = raw.start_date or _term_start(context)
        recurrence_until = raw.end_date or _term_end(context)
        if context.term_start and context.term_end and recurrence_until < start_date:
            warnings.append("Series ends before term start")
            unresolved = True

        start_at = _combine(start_date, raw.start_time or "09:00")
        end_at = _combine(start_date, raw.end_time or "10:00")
        until = _combine(recurrence_until, "23:59")

        rrule = build_weekly_rrule(raw.weekdays or ["MO"], until, context.timezone)

        normalized.append(
            ImportCandidate(
                client_key=f"candidate-{index}",
                title=raw.title.strip() or "Untitled",
                start_at=start_at,
                end_at=end_at,
                weekdays=raw.weekdays,
                recurrence_until=until,
                timezone=context.timezone,
                rrule=rrule,
                rrule_human=humanize_rrule(rrule, context.timezone),
                domain_id=default_domain_id,
                source_snippet=raw.source_snippet,
                source_page=raw.source_page,
                confidence=raw.confidence,
                warnings=warnings,
                unresolved=unresolved,
                included=not unresolved,
            )
        )
    return normalized


def _term_start(context: ParseContext) -> str:
    if context.term_start:
        return context.term_start
    return f"{context.default_year}-08-18"


def _term_end(context: ParseContext) -> str:
    if context.term_end:
        return context.term_end
    return f"{context.default_year}-12-15"


def _combine(date_str: str, time_str: str) -> datetime:
    return datetime.fromisoformat(f"{date_str}T{time_str}:00")
