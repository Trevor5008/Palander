from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.task_occurrence import TaskOccurrence
from app.recurrence.task_expand import due_at_for_occurrence_date
from app.schemas.task import TaskUpdate, TaskWriteBase
from app.schemas.task_serializers import task_to_read
from app.services.objective_links import set_task_objectives
from app.services.task_lifecycle import apply_task_status_change


def _get_or_create_occurrence(
    db: Session, task_id: int, occurrence_date: date
) -> TaskOccurrence:
    row = (
        db.query(TaskOccurrence)
        .filter(
            TaskOccurrence.task_id == task_id,
            TaskOccurrence.occurrence_date == occurrence_date,
        )
        .first()
    )
    if row is None:
        row = TaskOccurrence(task_id=task_id, occurrence_date=occurrence_date)
        db.add(row)
        db.flush()
    return row


def patch_task_with_scope(
    db: Session,
    task: Task,
    body: TaskUpdate,
    *,
    scope: str,
    occurrence_date: date | None,
) -> Task:
    updates = body.model_dump(exclude_unset=True)
    objective_ids = updates.pop("objective_ids", None)

    if scope == "series" or not task.is_recurring:
        domain_id = updates.get("domain_id", task.domain_id)
        if objective_ids is not None:
            from app.services.link_validation import validate_domain_and_objectives

            validate_domain_and_objectives(db, task.user_id, domain_id, objective_ids)
            set_task_objectives(db, task, objective_ids)
        if "status" in updates:
            new_status = updates.pop("status")
            apply_task_status_change(task, new_status)
        if "completed_at" in updates:
            task.completed_at = updates.pop("completed_at")
        for key, value in updates.items():
            setattr(task, key, value)
        if task.is_recurring:
            TaskWriteBase.model_validate(task, from_attributes=True)
        return task

    if occurrence_date is None:
        raise ValueError("occurrence_date is required for occurrence or future scope")

    if scope == "occurrence":
        occ = _get_or_create_occurrence(db, task.id, occurrence_date)
        if "planned_for" in updates:
            occ.planned_for = updates["planned_for"]
        if "due_at" in updates:
            occ.due_at = updates["due_at"]
        if "status" in updates:
            new_status = updates["status"]
            occ.status = new_status
            if new_status == "completed":
                occ.completed_at = updates.get("completed_at") or datetime.now(timezone.utc)
            elif new_status == "active":
                occ.completed_at = None
            elif new_status == "cancelled":
                occ.skipped_at = None
        if objective_ids is not None:
            set_task_objectives(db, task, objective_ids)
        return task

    if scope == "future":
        if task.recurrence_until is not None:
            split_dt = datetime.combine(occurrence_date, task.due_at.time())
            task.recurrence_until = split_dt - timedelta(seconds=1)
        new_task = Task(
            user_id=task.user_id,
            domain_id=updates.get("domain_id", task.domain_id),
            name=updates.get("name", task.name),
            planned_for=updates.get("planned_for", occurrence_date),
            due_at=updates.get("due_at", due_at_for_occurrence_date(task.due_at, occurrence_date)),
            status="active",
            is_recurring=updates.get("is_recurring", task.is_recurring),
            rrule=updates.get("rrule", task.rrule),
            timezone=updates.get("timezone", task.timezone),
            recurrence_until=updates.get("recurrence_until", task.recurrence_until),
            estimated_duration_minutes=updates.get(
                "estimated_duration_minutes", task.estimated_duration_minutes
            ),
            overdue_policy=updates.get("overdue_policy", task.overdue_policy),
            event_id=updates.get("event_id", task.event_id),
        )
        db.add(new_task)
        db.flush()
        if objective_ids is not None:
            set_task_objectives(db, new_task, objective_ids)
        else:
            set_task_objectives(db, new_task, [o.id for o in task.objectives])
        return new_task

    raise ValueError("scope must be occurrence, future, or series")


def delete_task_with_scope(
    db: Session,
    task: Task,
    *,
    scope: str,
    occurrence_date: date | None,
) -> None:
    if scope == "series" or not task.is_recurring:
        db.delete(task)
        return
    if occurrence_date is None:
        raise ValueError("occurrence_date is required for occurrence or future scope")
    if scope == "occurrence":
        occ = _get_or_create_occurrence(db, task.id, occurrence_date)
        occ.status = "cancelled"
        return
    if scope == "future":
        if task.recurrence_until is not None:
            split_dt = datetime.combine(occurrence_date, task.due_at.time())
            task.recurrence_until = split_dt - timedelta(seconds=1)
        return
    raise ValueError("scope must be occurrence, future, or series")
