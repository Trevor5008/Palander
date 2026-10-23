import re

from app.schedule.format_issues import FormatIssue
from app.schedule.parser import ParseContext, RawCandidate, ScheduleParseResult
from app.schedule.sanitize import redact_pii
from app.utils.schedule_time import normalize_time_token
from app.utils.schedule_weekdays import parse_weekday_tokens


class TableScheduleParser:
    async def parse(self, text: str, context: ParseContext) -> ScheduleParseResult:
        candidates: list[RawCandidate] = []
        format_issues: list[FormatIssue] = []
        for line_number, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if not stripped or stripped.lower().startswith("title"):
                continue
            delimiter = "\t" if "\t" in stripped else ","
            parts = [part.strip() for part in stripped.split(delimiter)]
            if len(parts) < 4:
                if context.format_hint == "csv":
                    format_issues.append(
                        FormatIssue(
                            line_number=line_number,
                            snippet=redact_pii(stripped[:120]),
                            code="CSV_COLUMNS",
                            message="CSV rows need four columns: Title, weekdays, start time, end time.",
                            help_section="csv",
                        )
                    )
                continue
            title, days_token, start_raw, end_raw = parts[0], parts[1], parts[2], parts[3]
            start_time = normalize_time_token(start_raw)
            end_time = normalize_time_token(end_raw)
            if not start_time or not end_time:
                if context.format_hint == "csv":
                    format_issues.append(
                        FormatIssue(
                            line_number=line_number,
                            snippet=redact_pii(stripped[:120]),
                            code="TIME_UNRECOGNIZED",
                            message="Use 09:00 or 0900 for start and end times.",
                            help_section="csv",
                        )
                    )
                continue
            day_tokens = [p for p in re.split(r"[,;\s]+", days_token.strip()) if p]
            weekdays, unknown = parse_weekday_tokens(day_tokens)
            if unknown:
                if context.format_hint == "csv":
                    format_issues.append(
                        FormatIssue(
                            line_number=line_number,
                            snippet=redact_pii(stripped[:120]),
                            code="WEEKDAY_UNRECOGNIZED",
                            message=f"Unknown weekday(s): {', '.join(unknown)}.",
                            help_section="csv",
                        )
                    )
                continue
            if not title or not weekdays:
                if context.format_hint == "csv":
                    format_issues.append(
                        FormatIssue(
                            line_number=line_number,
                            snippet=redact_pii(stripped[:120]),
                            code="CSV_INCOMPLETE",
                            message="Title and at least one weekday are required.",
                            help_section="csv",
                        )
                    )
                continue
            candidates.append(
                RawCandidate(
                    title=title,
                    weekdays=weekdays,
                    start_time=start_time,
                    end_time=end_time,
                    source_snippet=redact_pii(stripped[:160]),
                    confidence=0.65,
                    warnings=[],
                )
            )
        return ScheduleParseResult(candidates=candidates, format_issues=format_issues)
