import json

import httpx

from app.schedule.heuristic_parser import HeuristicScheduleParser
from app.schedule.parser import ParseContext, RawCandidate, ScheduleParser
from app.schedule.sanitize import redact_pii


class OpenAICompatScheduleParser:
    def __init__(self, base_url: str, api_key: str, model: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self._fallback = HeuristicScheduleParser()

    async def parse(self, text: str, context: ParseContext) -> list[RawCandidate]:
        if not self.api_key:
            return await self._fallback.parse(text, context)

        prompt = (
            "Extract schedule events as JSON array with objects containing: "
            "title, weekdays (MO..SU), start_time (HH:MM), end_time (HH:MM), "
            "start_date (YYYY-MM-DD optional), location, source_snippet, confidence (0-1), warnings.\n"
            f"Default year: {context.default_year}. Timezone: {context.timezone}.\n"
            f"Schedule text:\n{redact_pii(text[:8000])}"
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
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
                rows = data if isinstance(data, list) else data.get("candidates", [])
                return [_to_raw(row) for row in rows]
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, TypeError):
            return await self._fallback.parse(text, context)


def _to_raw(row: dict) -> RawCandidate:
    return RawCandidate(
        title=str(row.get("title", "Untitled")).strip(),
        weekdays=[str(day).upper() for day in row.get("weekdays", [])],
        start_time=row.get("start_time"),
        end_time=row.get("end_time"),
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
    return HeuristicScheduleParser()
