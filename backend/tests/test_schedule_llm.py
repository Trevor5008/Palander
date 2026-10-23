import asyncio
import json
from unittest.mock import AsyncMock, patch

from app.schedule.openai_compat import OpenAICompatScheduleParser
from app.schedule.parser import ParseContext


def test_openai_compat_structured_response():
    parser = OpenAICompatScheduleParser(
        "https://example.com/v1",
        "test-key",
        "test-model",
    )
    context = ParseContext(
        default_year=2026,
        timezone="America/New_York",
        term_start="2026-08-18",
        term_end="2026-12-15",
    )
    payload = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "candidates": [
                                {
                                    "title": "Seminar",
                                    "weekdays": ["TU"],
                                    "start_time": "14:00",
                                    "end_time": "15:30",
                                    "confidence": 0.9,
                                    "warnings": [],
                                    "source_snippet": "Seminar Tue 14:00-15:30",
                                }
                            ]
                        }
                    )
                }
            }
        ]
    }

    mock_response = AsyncMock()
    mock_response.raise_for_status = lambda: None
    mock_response.json = lambda: payload

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.schedule.openai_compat.httpx.AsyncClient", return_value=mock_client):
        result = asyncio.run(parser.parse("Seminar Tue 14:00-15:30", context))

    assert len(result.candidates) == 1
    assert result.candidates[0].title == "Seminar"
    assert result.candidates[0].weekdays == ["TU"]
