from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ScheduleParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)
    default_year: int
    timezone: str = Field(..., max_length=64)
    term_start: date | None = None
    term_end: date | None = None
    format_hint: Literal["auto", "plain", "csv"] = "auto"

    @model_validator(mode="after")
    def term_range_valid(self) -> "ScheduleParseRequest":
        if self.term_start and self.term_end and self.term_end < self.term_start:
            raise ValueError("term_end must be on or after term_start")
        return self


class ImportCandidateRead(BaseModel):
    client_key: str
    title: str
    start_at: datetime
    end_at: datetime
    weekdays: list[str]
    recurrence_until: datetime
    timezone: str
    rrule: str
    rrule_human: str
    domain_id: int | None
    source_snippet: str
    confidence: float
    warnings: list[str]
    duplicate_of_event_id: int | None
    included: bool
    unresolved: bool


class FormatIssueRead(BaseModel):
    line_number: int
    snippet: str
    code: str
    message: str
    help_section: str


class ScheduleParseResponse(BaseModel):
    candidates: list[ImportCandidateRead]
    format_issues: list[FormatIssueRead] = Field(default_factory=list)


class ConfirmedImportCandidate(BaseModel):
    client_key: str
    title: str
    start_at: datetime
    end_at: datetime
    weekdays: list[str]
    recurrence_until: datetime
    timezone: str
    domain_id: int
    included: bool = True


class ScheduleImportRequest(BaseModel):
    candidates: list[ConfirmedImportCandidate]


class ScheduleImportResponse(BaseModel):
    imported: int
    skipped: int
    duplicate: int
    unresolved: int
