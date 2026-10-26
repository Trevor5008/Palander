from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.domain import Domain
from app.models.objective import Objective
from app.models.task import Task
from app.services.events_list import list_events_in_range
from app.schemas.daily_workspace import (
    DailyWorkspaceRead,
    DomainCoverageItem,
    ObjectiveActivityItem,
)


def _day_bounds(note_date: date) -> tuple[datetime, datetime]:
    """Naive local day bounds — matches event/task datetimes stored without tzinfo."""
    start = datetime(note_date.year, note_date.month, note_date.day)
    end = start + timedelta(days=1) - timedelta(microseconds=1)
    return start, end


def build_daily_workspace(db: Session, user_id: int, note_date: date) -> DailyWorkspaceRead:
    day_start, day_end = _day_bounds(note_date)

    today_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "active",
            Task.planned_for == note_date,
        )
        .order_by(Task.due_at)
        .all()
    )

    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "active",
            Task.due_at < day_start,
        )
        .order_by(Task.due_at)
        .all()
    )

    completed_end = day_start + timedelta(days=1)
    completed_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "completed",
            Task.completed_at.isnot(None),
            Task.completed_at >= day_start,
            Task.completed_at < completed_end,
        )
        .order_by(Task.completed_at.desc())
        .all()
    )

    events = list_events_in_range(db, user_id, day_start, day_end)

    domains = db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()
    domain_coverage: list[DomainCoverageItem] = []
    for domain in domains:
        event_minutes = _event_minutes_for_domain(events, domain.id, note_date, day_start, day_end)
        task_count = sum(
            1 for t in today_tasks if t.domain_id == domain.id
        )
        domain_coverage.append(
            DomainCoverageItem(
                domain_id=domain.id,
                domain_name=domain.name,
                scheduled_event_minutes=event_minutes,
                planned_task_count=task_count,
            )
        )

    objectives = (
        db.query(Objective)
        .filter(Objective.user_id == user_id, Objective.status.in_(("active", "paused")))
        .all()
    )
    objective_activity: list[ObjectiveActivityItem] = []
    for objective in objectives:
        planned_count = sum(
            1 for t in today_tasks if t.objective_id == objective.id
        )
        completed_count = sum(
            1 for t in completed_tasks if t.objective_id == objective.id
        )
        if planned_count == 0 and completed_count == 0:
            continue
        objective_activity.append(
            ObjectiveActivityItem(
                objective_id=objective.id,
                objective_title=objective.title,
                domain_id=objective.domain_id,
                planned_task_count=planned_count,
                completed_task_count=completed_count,
            )
        )

    from app.schemas.task import TaskRead

    return DailyWorkspaceRead(
        date=note_date,
        today=[TaskRead.model_validate(t) for t in today_tasks],
        overdue=[TaskRead.model_validate(t) for t in overdue_tasks],
        completed=[TaskRead.model_validate(t) for t in completed_tasks],
        domain_coverage=domain_coverage,
        objective_activity=objective_activity,
    )


def _event_minutes_for_domain(
    events: list,
    domain_id: int,
    note_date: date,
    day_start: datetime,
    day_end: datetime,
) -> int:
    total = 0.0
    for ev in events:
        if getattr(ev, "domain_id", None) != domain_id:
            continue
        start = ev.start_at
        end = ev.end_at
        if start.tzinfo is not None:
            start = start.replace(tzinfo=None)
        if end.tzinfo is not None:
            end = end.replace(tzinfo=None)
        clip_start = max(start, day_start)
        clip_end = min(end, day_end)
        if clip_end > clip_start:
            total += (clip_end - clip_start).total_seconds() / 60.0
    return int(total)
