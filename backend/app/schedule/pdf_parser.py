from app.schedule.format_issues import FormatIssue
from app.schedule.parser import RawCandidate, ScheduleParseResult
from app.utils.fiu_schedule_of_classes import is_fiu_schedule_of_classes, parse_fiu_schedule_text
from app.utils.schedule_pdf_extract import (
    OcrRequiredError,
    PdfExtractError,
    extract_pdf_text,
)


def parse_schedule_pdf_bytes(data: bytes, filename: str | None = None) -> ScheduleParseResult:
    try:
        extracted = extract_pdf_text(data)
    except OcrRequiredError:
        raise
    except PdfExtractError as exc:
        return ScheduleParseResult(
            candidates=[],
            format_issues=[
                FormatIssue(
                    line_number=0,
                    snippet=filename or "",
                    code="PDF_INVALID",
                    message=str(exc),
                    help_section="pdf",
                )
            ],
        )

    candidates: list[RawCandidate] = []
    issues: list[FormatIssue] = []
    matched_profile = False

    for page in extracted.pages:
        if not page.text.strip():
            continue
        if is_fiu_schedule_of_classes(page.text):
            matched_profile = True
            result = parse_fiu_schedule_text(page.text, page_number=page.page_number)
            candidates.extend(result.candidates)
            issues.extend(result.format_issues)

    if not matched_profile:
        issues.append(
            FormatIssue(
                line_number=0,
                snippet=filename or "",
                code="UNSUPPORTED_PDF",
                message="No supported schedule layout detected in this PDF.",
                help_section="pdf",
            )
        )

    return ScheduleParseResult(candidates=candidates, format_issues=issues)
