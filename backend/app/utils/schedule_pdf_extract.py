"""Extract and normalize text from schedule PDF uploads."""

import re
from dataclasses import dataclass
from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_PDF_BYTES = 5 * 1024 * 1024
MAX_PDF_PAGES = 30
MIN_TEXT_CHARS_FOR_OCR = 40


@dataclass(frozen=True)
class PdfPageText:
    page_number: int
    text: str


@dataclass(frozen=True)
class PdfExtractResult:
    pages: list[PdfPageText]
    combined_text: str


class PdfExtractError(Exception):
    pass


class OcrRequiredError(PdfExtractError):
    pass


def validate_pdf_bytes(data: bytes) -> None:
    if not data.startswith(b"%PDF"):
        raise PdfExtractError("File is not a PDF")
    if len(data) > MAX_PDF_BYTES:
        raise PdfExtractError("PDF exceeds maximum upload size")


def extract_pdf_text(data: bytes) -> PdfExtractResult:
    validate_pdf_bytes(data)
    try:
        reader = PdfReader(BytesIO(data))
    except PdfReadError as exc:
        raise PdfExtractError("Could not read PDF") from exc

    if len(reader.pages) > MAX_PDF_PAGES:
        raise PdfExtractError("PDF exceeds maximum page count")

    pages: list[PdfPageText] = []
    for index, page in enumerate(reader.pages, start=1):
        raw = page.extract_text() or ""
        pages.append(PdfPageText(page_number=index, text=normalize_pdf_text(raw)))

    combined = "\n\n".join(page.text for page in pages if page.text.strip())
    if len(combined.strip()) < MIN_TEXT_CHARS_FOR_OCR:
        raise OcrRequiredError("This PDF has no readable text layer (OCR required)")

    return PdfExtractResult(pages=pages, combined_text=combined)


def normalize_pdf_text(text: str) -> str:
    """Fix line breaks inside times and schedule phrases from PDF layout."""
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r":\s*\n\s*(\d{2}\s*[AP]M)", r":\1", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"(\d{1,2}:\d{2}\s*[AP]M)\s*\n\s*to\s", r"\1 to ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bto\s*\n\s*(\d{1,2}:\d{2})", r"to \1", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"From:\s*\n\s*", "From: ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bTo:\s*\n\s*", "To: ", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"P\s*a\s*g\s*e\s*\|\s*\d+\s*of\s*\d+.*", "", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\d{1,2}/\d{1,2}/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M.*", "", normalized)
    return normalized
