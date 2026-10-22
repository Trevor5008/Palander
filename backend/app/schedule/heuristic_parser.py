import re

from app.schedule.parser import ParseContext, RawCandidate, ScheduleParser
from app.schedule.sanitize import redact_pii

_TIME_RE = re.compile(r"(?P<start>\d{1,2}:\d{2})\s*-\s*(?P<end>\d{1,2}:\d{2})")
_DAYS_RE = re.compile(
    r"(?P<days>(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:,\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))*)",
    re.IGNORECASE,
)

_DAY_MAP = {
    "mon": "MO",
    "tue": "TU",
    "wed": "WE",
    "thu": "TH",
    "fri": "FR",
    "sat": "SA",
    "sun": "SU",
}


class HeuristicScheduleParser:
    async def parse(self, text: str, context: ParseContext) -> list[RawCandidate]:
        candidates: list[RawCandidate] = []
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            time_match = _TIME_RE.search(stripped)
            if not time_match:
                continue
            prefix = stripped[: time_match.start()].strip()
            days_match = _DAYS_RE.search(prefix)
            if not days_match:
                continue
            title = prefix[: days_match.start()].strip(" -")
            weekdays = []
            for token in re.split(r",\s*", days_match.group("days")):
                code = _DAY_MAP.get(token.strip().lower()[:3])
                if code:
                    weekdays.append(code)
            if not title:
                title = "Untitled"
            candidates.append(
                RawCandidate(
                    title=title,
                    weekdays=weekdays,
                    start_time=time_match.group("start"),
                    end_time=time_match.group("end"),
                    start_date=f"{context.default_year}-08-18",
                    source_snippet=redact_pii(stripped[:160]),
                    confidence=0.55,
                    warnings=[] if weekdays else ["No weekdays detected"],
                )
            )
        return candidates
