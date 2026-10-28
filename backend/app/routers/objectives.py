from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.associations import event_objectives, task_objectives
from app.models.objective import Objective
from app.schemas.objective import ObjectiveCreate, ObjectiveRead, ObjectiveUpdate
from app.services.link_validation import assert_domain_owned
from app.services.objective_lifecycle import apply_objective_status_change

router = APIRouter(prefix="/objectives", tags=["objectives"])


def _get_objective_or_404(db: Session, objective_id: int, user_id: int) -> Objective:
    objective = (
        db.query(Objective)
        .filter(Objective.id == objective_id, Objective.user_id == user_id)
        .first()
    )
    if not objective:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective not found")
    return objective


@router.post("", response_model=ObjectiveRead, status_code=status.HTTP_201_CREATED)
def create_objective(
    body: ObjectiveCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    assert_domain_owned(db, body.domain_id, user_id)
    objective = Objective(**body.model_dump(), user_id=user_id)
    db.add(objective)
    db.commit()
    db.refresh(objective)
    return objective


@router.get("", response_model=list[ObjectiveRead])
def list_objectives(
    domain_id: int | None = Query(None),
    status: str | None = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(Objective).filter(Objective.user_id == user_id)
    if domain_id is not None:
        query = query.filter(Objective.domain_id == domain_id)
    if status is not None:
        query = query.filter(Objective.status == status)
    return query.order_by(Objective.title).all()


@router.get("/{objective_id}", response_model=ObjectiveRead)
def get_objective(
    objective_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_objective_or_404(db, objective_id, user_id)


@router.patch("/{objective_id}", response_model=ObjectiveRead)
def update_objective(
    objective_id: int,
    body: ObjectiveUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    objective = _get_objective_or_404(db, objective_id, user_id)
    updates = body.model_dump(exclude_unset=True)

    if "domain_id" in updates and updates["domain_id"] != objective.domain_id:
        new_domain_id = updates["domain_id"]
        assert_domain_owned(db, new_domain_id, user_id)
        linked_tasks = (
            db.query(task_objectives)
            .filter(task_objectives.c.objective_id == objective.id)
            .count()
        )
        linked_events = (
            db.query(event_objectives)
            .filter(event_objectives.c.objective_id == objective.id)
            .count()
        )
        if linked_tasks or linked_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change domain while tasks or events are linked to this objective",
            )

    if "domain_id" in updates:
        assert_domain_owned(db, updates["domain_id"], user_id)

    if "status" in updates:
        apply_objective_status_change(objective, updates["status"])
        updates.pop("status")

    for key, value in updates.items():
        setattr(objective, key, value)

    db.commit()
    db.refresh(objective)
    return objective


@router.delete("/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_objective(
    objective_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    objective = _get_objective_or_404(db, objective_id, user_id)
    db.delete(objective)
    db.commit()
