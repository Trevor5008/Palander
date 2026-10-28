from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.task_occurrence import TaskOccurrence
from app.recurrence.task_expand import due_at_for_occurrence_date, expand_task_occurrence_dates
from app.schemas.task import TaskRead
from app.schemas.task_serializers import task_to_read


def _occurrence_map(db: Session, task_ids: list[int]) -> dict[tuple[int, date], TaskOccurrence]:
    if not task_ids:
        return {}
    rows = db.query(TaskOccurrence).filter(TaskOccurrence.task_id.in_(task_ids)).all()
    return {(row.task_id, row.occurrence_date): row for row in rows}


def _resolve_occurrence_state(
    series: Task,
    occurrence_date: date,
    occ_row: TaskOccurrence | None,
) -> tuple[date, datetime, str, datetime | None]:
    planned = occurrence_date
    due = due_at_for_occurrence_date(series.due_at, occurrence_date)
    status = "active"
    completed_at = None
    if occ_row is not None:
        if occ_row.planned_for is not None:
            planned = occ_row.planned_for
        if occ_row.due_at is not None:
            due = occ_row.due_at
        status = occ_row.status
        completed_at = occ_row.completed_at
    return planned, due, status, completed_at


def _maybe_skip_expired(
    db: Session,
    series: Task,
    occurrence_date: date,
    occ_row: TaskOccurrence | None,
    today: date,
) -> TaskOccurrence | None:
    if series.overdue_policy != "skip_expired":
        return occ_row
    if occurrence_date >= today:
        return occ_row
    if occ_row is not None and occ_row.status != "active":
        return occ_row
    if occ_row is None:
        occ_row = TaskOccurrence(task_id=series.id, occurrence_date=occurrence_date, status="skipped")
        occ_row.skipped_at = datetime.now(tz=ZoneInfo("UTC"))
        db.add(occ_row)
    else:
        occ_row.status = "skipped"
        occ_row.skipped_at = datetime.now(tz=ZoneInfo("UTC"))
    db.flush()
    return occ_row


def expand_series_to_reads(
    db: Session,
    series: Task,
    range_start: date,
    range_end: date,
    *,
    workspace_date: date | None = None,
) -> list[TaskRead]:
    if not series.is_recurring or not series.rrule or not series.timezone:
        return []

    dates = expand_task_occurrence_dates(
        planned_for=series.planned_for,
        due_at=series.due_at,
        rrule=series.rrule,
        timezone_name=series.timezone,
        recurrence_until=series.recurrence_until,
        range_start=range_start,
        range_end=range_end,
    )
    occ_map = _occurrence_map(db, [series.id])
    today = workspace_date or date.today()
    reads: list[TaskRead] = []
    for occ_date in dates:
        occ_row = occ_map.get((series.id, occ_date))
        occ_row = _maybe_skip_expired(db, series, occ_date, occ_row, today)
        planned, due, status, completed_at = _resolve_occurrence_state(series, occ_date, occ_row)
        if status in ("cancelled", "skipped"):
            continue
        reads.append(
            task_to_read(
                series,
                series_id=series.id,
                occurrence_date=occ_date,
                planned_for=planned,
                due_at=due,
                status=status,
                completed_at=completed_at,
            )
        )
    return reads


def list_tasks_in_range(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> list[TaskRead]:
    non_recurring = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.is_recurring.is_(False),
            Task.status != "cancelled",
        )
        .all()
    )
    reads: list[TaskRead] = []
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())
    for task in non_recurring:
        in_range = start_date <= task.planned_for <= end_date or (
            start_dt <= task.due_at <= end_dt
        )
        if in_range:
            reads.append(task_to_read(task))

    series_rows = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.is_recurring.is_(True), Task.status != "cancelled")
        .all()
    )
    for series in series_rows:
        reads.extend(expand_series_to_reads(db, series, start_date, end_date))

    reads.sort(key=lambda t: t.due_at)
    return reads


def tasks_for_daily_workspace(
    db: Session,
    user_id: int,
    note_date: date,
) -> tuple[list[TaskRead], list[TaskRead], list[TaskRead]]:
    day_start = datetime(note_date.year, note_date.month, note_date.day)
    lookback_start = note_date - timedelta(days=365)
    lookforward_end = note_date + timedelta(days=365)

    series_rows = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.is_recurring.is_(True), Task.status != "cancelled")
        .all()
    )
    non_recurring = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.is_recurring.is_(False))
        .all()
    )

    today: list[TaskRead] = []
    overdue: list[TaskRead] = []
    completed: list[TaskRead] = []

    for task in non_recurring:
        read = task_to_read(task)
        if task.status == "completed" and task.completed_at:
            completed_at = task.completed_at.replace(tzinfo=None) if task.completed_at.tzinfo else task.completed_at
            if completed_at.date() == note_date:
                completed.append(read)
        elif task.status == "active":
            if task.planned_for == note_date:
                today.append(read)
            elif task.due_at < day_start:
                overdue.append(read)

    for series in series_rows:
        expanded = expand_series_to_reads(
            db,
            series,
            lookback_start,
            lookforward_end,
            workspace_date=note_date,
        )
        for read in expanded:
            if read.status == "completed" and read.completed_at:
                completed_at = read.completed_at.replace(tzinfo=None) if read.completed_at.tzinfo else read.completed_at
                if completed_at.date() == note_date:
                    completed.append(read)
                    continue
            if read.status != "active":
                continue
            effective_planned = read.planned_for
            if series.overdue_policy == "carry_forward" and effective_planned < note_date:
                effective_planned = note_date
                read = task_to_read(
                    series,
                    series_id=read.series_id,
                    occurrence_date=read.occurrence_date,
                    planned_for=effective_planned,
                    due_at=read.due_at,
                    status=read.status,
                    completed_at=read.completed_at,
                )
            if effective_planned == note_date:
                today.append(read)
            elif read.due_at < day_start and effective_planned < note_date:
                if series.overdue_policy == "keep_overdue":
                    overdue.append(read)
                elif series.overdue_policy == "carry_forward":
                    today.append(read)

    today.sort(key=lambda t: t.due_at)
    overdue.sort(key=lambda t: t.due_at)
    completed.sort(key=lambda t: t.completed_at or datetime.min, reverse=True)
    return today, overdue, completed
