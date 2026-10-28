from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.associations import task_objectives
from app.models.domain import Domain
from app.models.objective import Objective
from app.models.task import Task
from app.schemas.planning_review import (
    CompletedObjectiveItem,
    DomainAllocationItem,
    DomainWeeklyCompletions,
    ObjectiveWarningItem,
    ObjectiveWeeklyActivity,
    PlanningProgressRead,
    WeeklyReviewRead,
)
from app.services.events_list import list_events_in_range
from app.services.tasks_list import list_tasks_in_range

TARGET_DATE_WARN_DAYS = 14
INACTIVITY_DAYS = 21


def _week_bounds(week_start: date) -> tuple[datetime, datetime, date]:
    week_end_date = week_start + timedelta(days=6)
    range_start = datetime(week_start.year, week_start.month, week_start.day)
    range_end = datetime(
        week_end_date.year,
        week_end_date.month,
        week_end_date.day,
        23,
        59,
        59,
        999999,
    )
    return range_start, range_end, week_end_date


def _event_minutes_in_range(events: list, domain_id: int, range_start: datetime, range_end: datetime) -> int:
    total = 0.0
    for ev in events:
        if ev.domain_id != domain_id:
            continue
        start = ev.start_at
        end = ev.end_at
        if start.tzinfo is not None:
            start = start.replace(tzinfo=None)
        if end.tzinfo is not None:
            end = end.replace(tzinfo=None)
        clip_start = max(start, range_start)
        clip_end = min(end, range_end)
        if clip_end > clip_start:
            total += (clip_end - clip_start).total_seconds() / 60.0
    return int(total)


def _tasks_linked_to_objective(db: Session, user_id: int, objective_id: int):
    return (
        db.query(Task)
        .join(task_objectives, Task.id == task_objectives.c.task_id)
        .filter(Task.user_id == user_id, task_objectives.c.objective_id == objective_id)
    )


def build_weekly_review(db: Session, user_id: int, week_start: date, today: date | None = None) -> WeeklyReviewRead:
    if today is None:
        today = date.today()
    range_start, range_end, week_end = _week_bounds(week_start)
    today_start = datetime(today.year, today.month, today.day)

    events = list_events_in_range(db, user_id, range_start, range_end)
    week_tasks = list_tasks_in_range(db, user_id, week_start, week_end)
    domains = db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()

    domain_allocation: list[DomainAllocationItem] = []
    for domain in domains:
        planned_reads = [
            t
            for t in week_tasks
            if t.domain_id == domain.id
            and t.status == "active"
            and week_start <= t.planned_for <= week_end
        ]
        completed_reads = [
            t
            for t in week_tasks
            if t.domain_id == domain.id
            and t.status == "completed"
            and t.completed_at is not None
        ]
        domain_allocation.append(
            DomainAllocationItem(
                domain_id=domain.id,
                domain_name=domain.name,
                scheduled_event_minutes=_event_minutes_in_range(
                    events, domain.id, range_start, range_end
                ),
                tasks_planned=len(planned_reads),
                tasks_completed=len(completed_reads),
                planned_task_minutes=sum(t.estimated_duration_minutes or 0 for t in planned_reads),
            )
        )

    carry_forward = [
        t
        for t in week_tasks
        if t.status == "active"
        and (t.planned_for < week_start or t.due_at.replace(tzinfo=None) < today_start)
    ]
    carry_forward.sort(key=lambda t: t.due_at)

    objectives = (
        db.query(Objective)
        .filter(Objective.user_id == user_id, Objective.status.in_(("active", "paused")))
        .all()
    )
    objective_warnings: list[ObjectiveWarningItem] = []
    inactivity_cutoff = today - timedelta(days=INACTIVITY_DAYS)

    for obj in objectives:
        if obj.target_date is not None:
            td = obj.target_date
            target_day = td.date() if isinstance(td, datetime) else td
            days_left = (target_day - today).days
            if days_left < 0:
                objective_warnings.append(
                    ObjectiveWarningItem(
                        objective_id=obj.id,
                        objective_title=obj.title,
                        domain_id=obj.domain_id,
                        warning_type="target_date_past",
                        message=f"Target date was {target_day.isoformat()}",
                    )
                )
            elif days_left <= TARGET_DATE_WARN_DAYS:
                objective_warnings.append(
                    ObjectiveWarningItem(
                        objective_id=obj.id,
                        objective_title=obj.title,
                        domain_id=obj.domain_id,
                        warning_type="target_date_approaching",
                        message=f"Target date in {days_left} day(s) ({target_day.isoformat()})",
                    )
                )

        recent_task = (
            _tasks_linked_to_objective(db, user_id, obj.id)
            .filter(Task.status.in_(("active", "completed")))
            .order_by(Task.due_at.desc())
            .first()
        )
        if recent_task is None:
            objective_warnings.append(
                ObjectiveWarningItem(
                    objective_id=obj.id,
                    objective_title=obj.title,
                    domain_id=obj.domain_id,
                    warning_type="inactivity",
                    message="No linked tasks yet",
                )
            )
        else:
            last_touch = recent_task.completed_at or datetime.combine(
                recent_task.planned_for, datetime.min.time()
            )
            if last_touch.tzinfo is not None:
                last_touch = last_touch.replace(tzinfo=None)
            if last_touch.date() < inactivity_cutoff:
                objective_warnings.append(
                    ObjectiveWarningItem(
                        objective_id=obj.id,
                        objective_title=obj.title,
                        domain_id=obj.domain_id,
                        warning_type="inactivity",
                        message=f"No task activity since {last_touch.date().isoformat()}",
                    )
                )

        linked = _tasks_linked_to_objective(db, user_id, obj.id).filter(Task.status == "active").all()
        linked_ids = {t.id for t in linked}
        expanded_linked = [t for t in week_tasks if t.id in linked_ids or t.series_id in linked_ids]
        if linked and not any(
            week_start <= t.planned_for <= week_end for t in expanded_linked if t.status == "active"
        ):
            objective_warnings.append(
                ObjectiveWarningItem(
                    objective_id=obj.id,
                    objective_title=obj.title,
                    domain_id=obj.domain_id,
                    warning_type="unplanned_work",
                    message="Active linked tasks are not planned for this week",
                )
            )

    return WeeklyReviewRead(
        week_start=week_start,
        week_end=week_end,
        domain_allocation=domain_allocation,
        carry_forward=carry_forward,
        objective_warnings=objective_warnings,
    )


def build_planning_progress(db: Session, user_id: int, weeks: int = 8) -> PlanningProgressRead:
    today = date.today()
    current_week_start = today - timedelta(days=(today.weekday() + 1) % 7)

    week_starts: list[date] = []
    for i in range(weeks):
        week_starts.append(current_week_start - timedelta(weeks=i))
    week_starts.reverse()

    oldest_start = week_starts[0]
    range_start = datetime(oldest_start.year, oldest_start.month, oldest_start.day)

    recently_completed = (
        db.query(Objective)
        .filter(
            Objective.user_id == user_id,
            Objective.status == "completed",
            Objective.completed_at.isnot(None),
            Objective.completed_at >= range_start,
        )
        .order_by(Objective.completed_at.desc())
        .all()
    )

    objectives = (
        db.query(Objective)
        .filter(
            Objective.user_id == user_id,
            Objective.status.in_(("active", "paused", "completed")),
        )
        .all()
    )
    domains = {d.id: d for d in db.query(Domain).filter(Domain.user_id == user_id).all()}

    objective_weekly: list[ObjectiveWeeklyActivity] = []
    domain_weekly: list[DomainWeeklyCompletions] = []

    for ws in week_starts:
        we = ws + timedelta(days=6)
        rs = datetime(ws.year, ws.month, ws.day)
        re = datetime(we.year, we.month, we.day, 23, 59, 59, 999999)
        week_tasks = list_tasks_in_range(db, user_id, ws, we)

        for obj in objectives:
            planned = sum(
                1
                for t in week_tasks
                if obj.id in t.objective_ids and t.status == "active" and ws <= t.planned_for <= we
            )
            completed = sum(
                1
                for t in week_tasks
                if obj.id in t.objective_ids
                and t.status == "completed"
                and t.completed_at is not None
                and rs <= t.completed_at.replace(tzinfo=None) <= re
            )
            if planned or completed:
                objective_weekly.append(
                    ObjectiveWeeklyActivity(
                        objective_id=obj.id,
                        objective_title=obj.title,
                        domain_id=obj.domain_id,
                        week_start=ws,
                        planned_task_count=planned,
                        completed_task_count=completed,
                    )
                )

        for domain_id, domain in domains.items():
            completed_count = sum(
                1
                for t in week_tasks
                if t.domain_id == domain_id
                and t.status == "completed"
                and t.completed_at is not None
                and rs <= t.completed_at.replace(tzinfo=None) <= re
            )
            if completed_count:
                domain_weekly.append(
                    DomainWeeklyCompletions(
                        domain_id=domain_id,
                        domain_name=domain.name,
                        week_start=ws,
                        completed_task_count=completed_count,
                    )
                )

    return PlanningProgressRead(
        weeks=weeks,
        recently_completed_objectives=[
            CompletedObjectiveItem(
                objective_id=o.id,
                title=o.title,
                domain_id=o.domain_id,
                completed_at=o.completed_at,
            )
            for o in recently_completed
            if o.completed_at is not None
        ],
        objective_weekly_activity=objective_weekly,
        domain_weekly_completions=domain_weekly,
    )


def apply_carry_forward(
    db: Session,
    user_id: int,
    items: list[tuple[int, date]],
) -> int:
    updated = 0
    for task_id, planned_for in items:
        task = (
            db.query(Task)
            .filter(Task.id == task_id, Task.user_id == user_id)
            .first()
        )
        if not task:
            continue
        if task.is_recurring:
            continue
        task.planned_for = planned_for
        updated += 1
    db.commit()
    return updated
