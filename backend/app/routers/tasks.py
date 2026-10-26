from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.link_validation import validate_domain_and_objective
from app.services.task_lifecycle import apply_task_status_change

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _get_task_or_404(db: Session, task_id: int, user_id: int) -> Task:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _apply_task_links(
    db: Session,
    user_id: int,
    domain_id: int,
    objective_id: int | None,
) -> None:
    validate_domain_and_objective(db, user_id, domain_id, objective_id)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    body: TaskCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _apply_task_links(db, user_id, body.domain_id, body.objective_id)
    data = body.model_dump()
    task = Task(**data, user_id=user_id)
    if task.status == "completed" and task.completed_at is None:
        apply_task_status_change(task, "completed")
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskRead])
def list_tasks(
    start: datetime = Query(...),
    end: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    start_date = start.date() if isinstance(start, datetime) else start
    end_date = end.date() if isinstance(end, datetime) else end

    return (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.status != "cancelled",
            or_(
                and_(Task.planned_for >= start_date, Task.planned_for <= end_date),
                and_(Task.due_at >= start, Task.due_at <= end),
            ),
        )
        .order_by(Task.due_at)
        .all()
    )


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_task_or_404(db, task_id, user_id)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    body: TaskUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    updates = body.model_dump(exclude_unset=True)

    domain_id = updates.get("domain_id", task.domain_id)
    objective_id = updates.get("objective_id", task.objective_id)
    if "domain_id" in updates or "objective_id" in updates:
        if objective_id is not None and "domain_id" not in updates:
            domain_id = task.domain_id
        _apply_task_links(db, user_id, domain_id, objective_id)

    if "status" in updates:
        new_status = updates["status"]
        apply_task_status_change(task, new_status)
        updates.pop("status", None)
        if "completed_at" in updates and new_status == "completed":
            task.completed_at = updates.pop("completed_at")
        elif "completed_at" in updates:
            updates.pop("completed_at")

    for key, value in updates.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    db.delete(task)
    db.commit()
