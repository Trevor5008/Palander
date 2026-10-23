from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.config import settings
from app.database import get_db
from app.models.event import Event
from app.recurrence.rrule_build import build_weekly_rrule
from app.schedule.dedupe import find_duplicate_event_id, mark_duplicates
from app.schedule.normalize import normalize_candidates
from app.schedule.openai_compat import get_schedule_parser
from app.schedule.parser import ParseContext
from app.schemas.schedule import (
    ConfirmedImportCandidate,
    FormatIssueRead,
    ImportCandidateRead,
    ScheduleImportRequest,
    ScheduleImportResponse,
    ScheduleParseRequest,
    ScheduleParseResponse,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/parse", response_model=ScheduleParseResponse)
async def parse_schedule(
    body: ScheduleParseRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    parser = get_schedule_parser(
        settings.schedule_parser_base_url,
        settings.schedule_parser_api_key,
        settings.schedule_parser_model,
    )
    context = ParseContext(
        default_year=body.default_year,
        timezone=body.timezone,
        term_start=body.term_start.isoformat() if body.term_start else None,
        term_end=body.term_end.isoformat() if body.term_end else None,
        format_hint=body.format_hint,
    )
    parse_result = await parser.parse(body.text, context)
    candidates = normalize_candidates(parse_result.candidates, context, default_domain_id=None)
    existing = db.query(Event).filter(Event.user_id == user_id).all()
    mark_duplicates(candidates, existing)
    return ScheduleParseResponse(
        candidates=[ImportCandidateRead.model_validate(item.__dict__) for item in candidates],
        format_issues=[FormatIssueRead.model_validate(issue.__dict__) for issue in parse_result.format_issues],
    )


@router.post("/import", response_model=ScheduleImportResponse)
def import_schedule(
    body: ScheduleImportRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    imported = 0
    skipped = 0
    duplicate = 0
    unresolved = 0

    existing = db.query(Event).filter(Event.user_id == user_id).all()

    try:
        for candidate in body.candidates:
            if not candidate.included:
                skipped += 1
                continue
            if any(
                find_duplicate_event_id(event, candidate.title, candidate.weekdays)
                for event in existing
            ):
                duplicate += 1
                continue
            if candidate.end_at < candidate.start_at:
                unresolved += 1
                continue

            try:
                rrule = build_weekly_rrule(
                    candidate.weekdays,
                    candidate.recurrence_until,
                    candidate.timezone,
                )
            except ValueError:
                unresolved += 1
                continue
            event = Event(
                title=candidate.title.strip(),
                start_at=candidate.start_at,
                end_at=candidate.end_at,
                is_recurring=True,
                rrule=rrule,
                timezone=candidate.timezone,
                recurrence_until=candidate.recurrence_until,
                domain_id=candidate.domain_id,
                user_id=user_id,
                objective_id=None,
            )
            db.add(event)
            imported += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    return ScheduleImportResponse(
        imported=imported,
        skipped=skipped,
        duplicate=duplicate,
        unresolved=unresolved,
    )
