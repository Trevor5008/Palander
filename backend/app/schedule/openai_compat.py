import json
import logging

import httpx

from app.schedule.parser import ParseContext, RawCandidate, ScheduleParseResult, ScheduleParser
from app.utils.schedule_time import normalize_time_token
from app.schedule.registry import CompositeScheduleParser
from app.schedule.sanitize import redact_pii

logger = logging.getLogger(__name__)

_RAW_CANDIDATE_SCHEMA = {
    "type": "object",
    "properties": {
        "candidates": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "weekdays": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "start_time": {"type": "string"},
                    "end_time": {"type": "string"},
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "location": {"type": "string"},
                    "source_snippet": {"type": "string"},
                    "confidence": {"type": "number"},
                    "warnings": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": ["title", "weekdays", "start_time", "end_time"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["candidates"],
    "additionalProperties": False,
}


class OpenAICompatScheduleParser:
    def __init__(self, base_url: str, api_key: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self._fallback: ScheduleParser = CompositeScheduleParser()

    async def parse(self, text: str, context: ParseContext) -> ScheduleParseResult:
        if not self.api_key:
            return await self._fallback.parse(text, context)

        term_start = context.term_start or f"{context.default_year}-08-18"
        term_end = context.term_end or f"{context.default_year}-12-15"
        prompt = (
            "Extract recurring weekly schedule events from the text. "
            "Use weekdays MO,TU,WE,TH,FR,SA,SU. Times as HH:MM (24h). "
            f"Default year {context.default_year}, timezone {context.timezone}. "
            f"If dates are missing, infer start near {term_start} and end by {term_end}. "
            "Include source_snippet (short) and confidence 0-1 per row.\n\n"
            f"Schedule text:\n{redact_pii(text[:8000])}"
        )

        payload: dict = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "Return JSON matching the schema. Events only.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "schedule_candidates",
                    "strict": True,
                    "schema": _RAW_CANDIDATE_SCHEMA,
                },
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                data = json.loads(content)
                rows = data.get("candidates", [])
                parsed = [_to_raw(row) for row in rows]
                logger.info(
                    "schedule_parse parser=openai_compat candidates=%s fallback=false",
                    len(parsed),
                )
                return ScheduleParseResult(candidates=parsed, format_issues=[])
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.info(
                "schedule_parse parser=openai_compat fallback=true reason=%s",
                type(exc).__name__,
            )
            return await self._fallback.parse(text, context)


def _to_raw(row: dict) -> RawCandidate:
    start_time = normalize_time_token(str(row.get("start_time", ""))) or row.get("start_time")
    end_time = normalize_time_token(str(row.get("end_time", ""))) or row.get("end_time")
    return RawCandidate(
        title=str(row.get("title", "Untitled")).strip(),
        weekdays=[str(day).upper() for day in row.get("weekdays", [])],
        start_time=start_time,
        end_time=end_time,
        start_date=row.get("start_date"),
        end_date=row.get("end_date"),
        location=row.get("location"),
        source_snippet=str(row.get("source_snippet", ""))[:160],
        confidence=float(row.get("confidence", 0.5)),
        warnings=[str(item) for item in row.get("warnings", [])],
    )


def get_schedule_parser(
    base_url: str | None,
    api_key: str | None,
    model: str | None,
) -> ScheduleParser:
    if base_url and api_key and model:
        return OpenAICompatScheduleParser(base_url, api_key, model)
    return CompositeScheduleParser()
