from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.objective import Objective
from app.models.task import Task


def set_task_objectives(db: Session, task: Task, objective_ids: list[int]) -> None:
    if not objective_ids:
        task.objectives = []
        return
    rows = (
        db.query(Objective)
        .filter(Objective.id.in_(objective_ids), Objective.user_id == task.user_id)
        .all()
    )
    task.objectives = rows


def set_event_objectives(db: Session, event: Event, objective_ids: list[int]) -> None:
    if not objective_ids:
        event.objectives = []
        return
    rows = (
        db.query(Objective)
        .filter(Objective.id.in_(objective_ids), Objective.user_id == event.user_id)
        .all()
    )
    event.objectives = rows


def objective_ids_for_task(task: Task) -> list[int]:
    return sorted(obj.id for obj in task.objectives)


def objective_ids_for_event(event: Event) -> list[int]:
    return sorted(obj.id for obj in event.objectives)
