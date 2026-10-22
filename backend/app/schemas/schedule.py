from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)
    default_year: int
    timezone: str = Field(..., max_length=64)


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


class ScheduleParseResponse(BaseModel):
    candidates: list[ImportCandidateRead]


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
