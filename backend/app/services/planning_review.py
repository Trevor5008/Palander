from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

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
from app.schemas.task import TaskRead
from app.services.events_list import list_events_in_range

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


def build_weekly_review(db: Session, user_id: int, week_start: date, today: date | None = None) -> WeeklyReviewRead:
    if today is None:
        today = date.today()
    range_start, range_end, week_end = _week_bounds(week_start)
    today_start = datetime(today.year, today.month, today.day)

    events = list_events_in_range(db, user_id, range_start, range_end)
    domains = db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()

    active_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.status == "active")
        .all()
    )
    completed_in_week = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status == "completed",
            Task.completed_at.isnot(None),
            Task.completed_at >= range_start,
            Task.completed_at <= range_end,
        )
        .all()
    )

    domain_allocation: list[DomainAllocationItem] = []
    for domain in domains:
        planned = sum(
            1
            for t in active_tasks
            if t.domain_id == domain.id and week_start <= t.planned_for <= week_end
        )
        completed = sum(1 for t in completed_in_week if t.domain_id == domain.id)
        domain_allocation.append(
            DomainAllocationItem(
                domain_id=domain.id,
                domain_name=domain.name,
                scheduled_event_minutes=_event_minutes_in_range(
                    events, domain.id, range_start, range_end
                ),
                tasks_planned=planned,
                tasks_completed=completed,
            )
        )

    carry_ids: set[int] = set()
    carry_forward: list[Task] = []
    for task in active_tasks:
        if task.planned_for < week_start or task.due_at.replace(tzinfo=None) < today_start:
            if task.id not in carry_ids:
                carry_ids.add(task.id)
                carry_forward.append(task)
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
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.objective_id == obj.id,
                Task.status.in_(("active", "completed")),
            )
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

        unplanned = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.objective_id == obj.id,
                Task.status == "active",
            )
            .all()
        )
        if unplanned and not any(week_start <= t.planned_for <= week_end for t in unplanned):
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
        carry_forward=[TaskRead.model_validate(t) for t in carry_forward],
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

        for obj in objectives:
            planned = (
                db.query(Task)
                .filter(
                    Task.user_id == user_id,
                    Task.objective_id == obj.id,
                    Task.status == "active",
                    Task.planned_for >= ws,
                    Task.planned_for <= we,
                )
                .count()
            )
            completed = (
                db.query(Task)
                .filter(
                    Task.user_id == user_id,
                    Task.objective_id == obj.id,
                    Task.status == "completed",
                    Task.completed_at.isnot(None),
                    Task.completed_at >= rs,
                    Task.completed_at <= re,
                )
                .count()
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
            completed_count = (
                db.query(Task)
                .filter(
                    Task.user_id == user_id,
                    Task.domain_id == domain_id,
                    Task.status == "completed",
                    Task.completed_at.isnot(None),
                    Task.completed_at >= rs,
                    Task.completed_at <= re,
                )
                .count()
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
        task.planned_for = planned_for
        updated += 1
    db.commit()
    return updated
