from io import BytesIO
from pathlib import Path

import pytest
from pypdf import PdfWriter

from app.utils.fiu_schedule_of_classes import parse_fiu_schedule_text
from app.utils.schedule_pdf_extract import OcrRequiredError, extract_pdf_text
from app.utils.schedule_time import parse_12h_time

FIXTURES = Path(__file__).parent / "fixtures" / "schedules"
FIU_PDF = FIXTURES / "fiu_schedule_of_classes.pdf"
FIU_TEXT = FIXTURES / "fiu_schedule_of_classes.txt"


def test_parse_12h_time():
    assert parse_12h_time("12:30PM") == "12:30"
    assert parse_12h_time("01:45PM") == "13:45"
    assert parse_12h_time("06:25PM") == "18:25"


def test_fiu_schedule_text_fixture():
    text = FIU_TEXT.read_text()
    result = parse_fiu_schedule_text(text, page_number=1)
    assert len(result.candidates) == 3
    titles = {candidate.title for candidate in result.candidates}
    assert "Fundamentals of Modeling & Simulations" in titles
    assert "Capstone II" in titles


def test_extract_fiu_pdf():
    if not FIU_PDF.exists():
        pytest.skip("FIU PDF fixture missing")
    data = FIU_PDF.read_bytes()
    extracted = extract_pdf_text(data)
    assert len(extracted.pages) >= 1
    result = parse_fiu_schedule_text(extracted.pages[0].text, 1)
    assert len(result.candidates) == 3


def test_blank_pdf_requires_ocr():
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = BytesIO()
    writer.write(buffer)
    with pytest.raises(OcrRequiredError):
        extract_pdf_text(buffer.getvalue())


def test_parse_schedule_pdf_endpoint(client, auth_headers):
    if not FIU_PDF.exists():
        pytest.skip("FIU PDF fixture missing")
    with FIU_PDF.open("rb") as handle:
        response = client.post(
            "/schedule/parse-pdf",
            files={"file": ("schedule.pdf", handle, "application/pdf")},
            data={
                "default_year": 2026,
                "timezone": "America/New_York",
            },
            headers=auth_headers,
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["candidates"]) == 3
    assert body["candidates"][0]["source_filename"] == "schedule.pdf"
    assert body["candidates"][0]["source_page"] == 1
    assert body["candidates"][0]["recurrence_until"].startswith("2026-12-05")
