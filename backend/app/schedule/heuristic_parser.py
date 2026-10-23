import re

from app.schedule.format_issues import FormatIssue
from app.schedule.parser import ParseContext, RawCandidate, ScheduleParseResult
from app.schedule.sanitize import redact_pii
from app.utils.schedule_plain_line import parse_plain_schedule_line, tokenize_schedule_line
from app.utils.schedule_time import normalize_time_token
from app.utils.schedule_weekdays import resolve_weekday_token

_TIMEISH_RE = re.compile(r"\d{1,2}:\d{2}|\d{3,4}")


def _line_looks_like_schedule(line: str) -> bool:
    if _TIMEISH_RE.search(line):
        return True
    for token in tokenize_schedule_line(line):
        if resolve_weekday_token(token):
            return True
    return False


class HeuristicScheduleParser:
    async def parse(self, text: str, context: ParseContext) -> ScheduleParseResult:
        candidates: list[RawCandidate] = []
        format_issues: list[FormatIssue] = []
        for line_number, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if not stripped:
                continue
            parsed = parse_plain_schedule_line(stripped)
            if parsed.title and parsed.weekdays and parsed.start_time and parsed.end_time:
                candidates.append(
                    RawCandidate(
                        title=parsed.title,
                        weekdays=parsed.weekdays,
                        start_time=parsed.start_time,
                        end_time=parsed.end_time,
                        source_snippet=redact_pii(stripped[:160]),
                        confidence=0.6,
                        warnings=[],
                    )
                )
                continue
            if parsed.issue_code and _line_looks_like_schedule(stripped):
                format_issues.append(
                    FormatIssue(
                        line_number=line_number,
                        snippet=redact_pii(stripped[:120]),
                        code=parsed.issue_code,
                        message=parsed.issue_message or "Could not parse line.",
                        help_section=parsed.help_section,
                    )
                )
        return ScheduleParseResult(candidates=candidates, format_issues=format_issues)
