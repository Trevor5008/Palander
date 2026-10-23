import re

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
STUDENT_ID_RE = re.compile(r"\b\d{6,10}\b")


def redact_pii(text: str) -> str:
    cleaned = EMAIL_RE.sub("[redacted-email]", text)
    return STUDENT_ID_RE.sub("[redacted-id]", cleaned)
