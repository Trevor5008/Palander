from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.domain import Domain
from app.models.objective import Objective
from app.schemas.objective import ObjectiveCreate, ObjectiveRead, ObjectiveUpdate

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


def _get_user_domain_or_404(db: Session, domain_id: int, user_id: int) -> Domain:
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.user_id == user_id)
        .first()
    )
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    return domain


@router.post("", response_model=ObjectiveRead, status_code=status.HTTP_201_CREATED)
def create_objective(
    body: ObjectiveCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    _get_user_domain_or_404(db, body.domain_id, user_id)
    objective = Objective(**body.model_dump(), user_id=user_id)
    db.add(objective)
    db.commit()
    db.refresh(objective)
    return objective


@router.get("", response_model=list[ObjectiveRead])
def list_objectives(
    domain_id: int | None = Query(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(Objective).filter(Objective.user_id == user_id)
    if domain_id is not None:
        query = query.filter(Objective.domain_id == domain_id)
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
    if "domain_id" in updates:
        _get_user_domain_or_404(db, updates["domain_id"], user_id)
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
