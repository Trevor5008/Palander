from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _get_task_or_404(db: Session, task_id: int, user_id: int | None = None) -> Task:
    query = db.query(Task).filter(Task.id == task_id)
    if user_id is not None:
        query = query.filter(Task.user_id == user_id)
    task = query.first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskRead])
def list_tasks(
    user_id: int = Query(...),
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: Session = Depends(get_db),
):
    return (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.due_date >= start,
            Task.due_date <= end,
        )
        .order_by(Task.due_date)
        .all()
    )


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    return _get_task_or_404(db, task_id, user_id)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    body: TaskUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    task = _get_task_or_404(db, task_id, user_id)
    db.delete(task)
    db.commit()
