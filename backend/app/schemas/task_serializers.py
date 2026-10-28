from datetime import date

from app.models.task import Task
from app.schemas.task import TaskRead
from app.services.objective_links import objective_ids_for_task


def task_to_read(
    task: Task,
    *,
    series_id: int | None = None,
    occurrence_date: date | None = None,
    planned_for: date | None = None,
    due_at=None,
    status: str | None = None,
    completed_at=None,
) -> TaskRead:
    return TaskRead(
        id=task.id,
        user_id=task.user_id,
        name=task.name,
        planned_for=planned_for if planned_for is not None else task.planned_for,
        due_at=due_at if due_at is not None else task.due_at,
        status=status if status is not None else task.status,
        completed_at=completed_at if completed_at is not None else task.completed_at,
        is_recurring=task.is_recurring,
        rrule=task.rrule,
        timezone=task.timezone,
        recurrence_until=task.recurrence_until,
        estimated_duration_minutes=task.estimated_duration_minutes,
        overdue_policy=task.overdue_policy,
        domain_id=task.domain_id,
        event_id=task.event_id,
        objective_ids=objective_ids_for_task(task),
        series_id=series_id,
        occurrence_date=occurrence_date,
    )
