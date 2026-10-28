from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.schemas.task_serializers import task_to_read
from app.services.link_validation import validate_domain_and_objectives
from app.services.objective_links import set_task_objectives
from app.services.task_lifecycle import apply_task_status_change
from app.services.task_recurrence_edit import delete_task_with_scope, patch_task_with_scope
from app.services.tasks_list import list_tasks_in_range

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


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    body: TaskCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    validate_domain_and_objectives(db, user_id, body.domain_id, body.objective_ids)
    data = body.model_dump(exclude={"objective_ids"})
    task = Task(**data, user_id=user_id)
    if task.status == "completed" and task.completed_at is None:
        apply_task_status_change(task, "completed")
    db.add(task)
    db.flush()
    set_task_objectives(db, task, body.objective_ids)
    db.commit()
    db.refresh(task)
    return task_to_read(task)


@router.get("", response_model=list[TaskRead])
def list_tasks(
    start: datetime = Query(...),
    end: datetime = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    start_date = start.date() if isinstance(start, datetime) else start
    end_date = end.date() if isinstance(end, datetime) else end
    return list_tasks_in_range(db, user_id, start_date, end_date)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    return task_to_read(task)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    body: TaskUpdate,
    scope: str = Query(default="series"),
    occurrence_date: date | None = Query(default=None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    try:
        result = patch_task_with_scope(
            db,
            task,
            body,
            scope=scope,
            occurrence_date=occurrence_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    db.commit()
    db.refresh(result)
    if result.is_recurring and occurrence_date is not None and scope == "occurrence":
        from app.services.tasks_list import expand_series_to_reads

        expanded = expand_series_to_reads(db, result, occurrence_date, occurrence_date)
        if expanded:
            return expanded[0]
    return task_to_read(result)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    scope: str = Query(default="series"),
    occurrence_date: date | None = Query(default=None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    try:
        delete_task_with_scope(
            db,
            task,
            scope=scope,
            occurrence_date=occurrence_date,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc
    db.commit()
