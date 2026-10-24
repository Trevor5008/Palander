"""Parse FIU PantherSoft Schedule of Classes PDF text."""

import re
from dataclasses import dataclass

from app.schedule.format_issues import FormatIssue
from app.schedule.parser import RawCandidate
from app.utils.schedule_time import parse_12h_time
from app.utils.schedule_weekdays import parse_weekday_tokens

COURSE_HEADER_RE = re.compile(
    r"^([A-Z]{2,4}-\d{4}\s*\([^)]+\)\s*-\s*\(\d+\)\s*-\s*)(.+?)\s*-\s*Units:\s*\d+\s*$",
    re.MULTILINE,
)
SCHEDULE_RE = re.compile(
    r"Days:\s*(?P<days>.+?)\s+"
    r"(?P<start>\d{1,2}:\d{2}\s*[AP]M)\s+to\s+"
    r"(?P<end>\d{1,2}:\d{2}\s*[AP]M)\s+"
    r"From:\s*(?P<from>\d{2}/\d{2}/\d{4})\s+"
    r"To:\s*(?P<to>\d{2}/\d{2}/\d{4})",
    re.IGNORECASE | re.DOTALL,
)
UNSUPPORTED_RE = re.compile(r"\b(TBA|Asynchronous|Online only)\b", re.IGNORECASE)


@dataclass(frozen=True)
class FiuParseResult:
    candidates: list[RawCandidate]
    format_issues: list[FormatIssue]


def is_fiu_schedule_of_classes(text: str) -> bool:
    return "Schedule of Classes" in text and COURSE_HEADER_RE.search(text) is not None


def parse_fiu_schedule_text(text: str, page_number: int = 1) -> FiuParseResult:
    candidates: list[RawCandidate] = []
    issues: list[FormatIssue] = []
    if not is_fiu_schedule_of_classes(text):
        issues.append(
            FormatIssue(
                line_number=0,
                snippet="",
                code="UNSUPPORTED_PDF",
                message="PDF is not a recognized FIU Schedule of Classes export.",
                help_section="pdf",
            )
        )
        return FiuParseResult(candidates=candidates, format_issues=issues)

    headers = list(COURSE_HEADER_RE.finditer(text))
    for index, match in enumerate(headers):
        block_start = match.start()
        block_end = headers[index + 1].start() if index + 1 < len(headers) else len(text)
        block = text[block_start:block_end]
        course_code = match.group(0).split(" - ")[0].strip()
        title = match.group(2).strip()

        if UNSUPPORTED_RE.search(block):
            issues.append(
                FormatIssue(
                    line_number=page_number,
                    snippet=course_code,
                    code="UNSUPPORTED_MEETING",
                    message=f"{course_code}: TBA or asynchronous meetings are not imported automatically.",
                    help_section="pdf",
                )
            )
            continue

        schedule_match = SCHEDULE_RE.search(block)
        if not schedule_match:
            issues.append(
                FormatIssue(
                    line_number=page_number,
                    snippet=course_code,
                    code="SCHEDULE_UNPARSED",
                    message=f"{course_code}: could not read Days/times/dates in schedule block.",
                    help_section="pdf",
                )
            )
            continue

        day_tokens = re.split(r"\s+", schedule_match.group("days").strip())
        weekdays, unknown = parse_weekday_tokens(day_tokens)
        if unknown:
            issues.append(
                FormatIssue(
                    line_number=page_number,
                    snippet=course_code,
                    code="WEEKDAY_UNRECOGNIZED",
                    message=f"{course_code}: unknown weekday(s): {', '.join(unknown)}.",
                    help_section="pdf",
                )
            )
            continue

        start_time = parse_12h_time(schedule_match.group("start"))
        end_time = parse_12h_time(schedule_match.group("end"))
        if not start_time or not end_time:
            issues.append(
                FormatIssue(
                    line_number=page_number,
                    snippet=course_code,
                    code="TIME_UNRECOGNIZED",
                    message=f"{course_code}: could not parse meeting times.",
                    help_section="pdf",
                )
            )
            continue

        start_date = _mdy_to_iso(schedule_match.group("from"))
        end_date = _mdy_to_iso(schedule_match.group("to"))
        snippet = f"{course_code} — {schedule_match.group(0).replace(chr(10), ' ')[:140]}"

        candidates.append(
            RawCandidate(
                title=title,
                weekdays=weekdays,
                start_time=start_time,
                end_time=end_time,
                start_date=start_date,
                end_date=end_date,
                source_snippet=snippet,
                source_page=page_number,
                confidence=0.85,
                warnings=[],
            )
        )

    return FiuParseResult(candidates=candidates, format_issues=issues)


def _mdy_to_iso(value: str) -> str:
    month, day, year = value.strip().split("/")
    return f"{year}-{int(month):02d}-{int(day):02d}"
