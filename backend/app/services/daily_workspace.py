from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.domain import Domain
from app.models.objective import Objective
from app.schemas.daily_workspace import (
    DailyWorkspaceRead,
    DomainCoverageItem,
    ObjectiveActivityItem,
)
from app.services.events_list import list_events_in_range
from app.services.tasks_list import tasks_for_daily_workspace


def _day_bounds(note_date: date) -> tuple[datetime, datetime]:
    start = datetime(note_date.year, note_date.month, note_date.day)
    end = start + timedelta(days=1) - timedelta(microseconds=1)
    return start, end


def _event_minutes_for_occurrence(
    start: datetime,
    end: datetime,
    day_start: datetime,
    day_end: datetime,
) -> int:
    if start.tzinfo is not None:
        start = start.replace(tzinfo=None)
    if end.tzinfo is not None:
        end = end.replace(tzinfo=None)
    clip_start = max(start, day_start)
    clip_end = min(end, day_end)
    if clip_end <= clip_start:
        return 0
    return int((clip_end - clip_start).total_seconds() / 60.0)


def build_daily_workspace(db: Session, user_id: int, note_date: date) -> DailyWorkspaceRead:
    day_start, day_end = _day_bounds(note_date)
    today_tasks, overdue_tasks, completed_tasks = tasks_for_daily_workspace(db, user_id, note_date)
    events = list_events_in_range(db, user_id, day_start, day_end)

    domains = db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()
    domain_coverage: list[DomainCoverageItem] = []
    for domain in domains:
        event_minutes = 0
        for ev in events:
            if ev.domain_id != domain.id:
                continue
            event_minutes += _event_minutes_for_occurrence(
                ev.start_at, ev.end_at, day_start, day_end
            )
        domain_today = [t for t in today_tasks if t.domain_id == domain.id]
        task_count = len(domain_today)
        task_minutes = sum(t.estimated_duration_minutes or 0 for t in domain_today)
        domain_coverage.append(
            DomainCoverageItem(
                domain_id=domain.id,
                domain_name=domain.name,
                scheduled_event_minutes=event_minutes,
                planned_task_count=task_count,
                planned_task_minutes=task_minutes,
            )
        )

    objectives = (
        db.query(Objective)
        .filter(Objective.user_id == user_id, Objective.status.in_(("active", "paused")))
        .all()
    )
    objective_activity: list[ObjectiveActivityItem] = []
    for objective in objectives:
        planned_count = sum(1 for t in today_tasks if objective.id in t.objective_ids)
        completed_count = sum(1 for t in completed_tasks if objective.id in t.objective_ids)
        event_count = 0
        event_minutes = 0
        for ev in events:
            if objective.id not in ev.objective_ids:
                continue
            event_count += 1
            event_minutes += _event_minutes_for_occurrence(
                ev.start_at, ev.end_at, day_start, day_end
            )
        if planned_count == 0 and completed_count == 0 and event_count == 0:
            continue
        objective_activity.append(
            ObjectiveActivityItem(
                objective_id=objective.id,
                objective_title=objective.title,
                domain_id=objective.domain_id,
                planned_task_count=planned_count,
                completed_task_count=completed_count,
                scheduled_event_count=event_count,
                scheduled_event_minutes=event_minutes,
            )
        )

    return DailyWorkspaceRead(
        date=note_date,
        today=today_tasks,
        overdue=overdue_tasks,
        completed=completed_tasks,
        domain_coverage=domain_coverage,
        objective_activity=objective_activity,
    )
