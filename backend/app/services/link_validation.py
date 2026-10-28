from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.domain import Domain
from app.models.objective import Objective


def assert_domain_owned(db: Session, domain_id: int, user_id: int) -> Domain:
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.user_id == user_id)
        .first()
    )
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found",
        )
    return domain


def assert_objective_in_domain(
    db: Session,
    objective_id: int,
    user_id: int,
    domain_id: int,
    *,
    allow_cancelled: bool = False,
) -> Objective:
    objective = (
        db.query(Objective)
        .filter(Objective.id == objective_id, Objective.user_id == user_id)
        .first()
    )
    if not objective:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Objective not found",
        )
    if objective.domain_id != domain_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Objective does not belong to the selected domain",
        )
    if not allow_cancelled and objective.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot link to a cancelled objective",
        )
    return objective


def validate_domain_and_objectives(
    db: Session,
    user_id: int,
    domain_id: int,
    objective_ids: list[int],
) -> None:
    assert_domain_owned(db, domain_id, user_id)
    seen: set[int] = set()
    for objective_id in objective_ids:
        if objective_id in seen:
            continue
        seen.add(objective_id)
        assert_objective_in_domain(db, objective_id, user_id, domain_id)


def validate_domain_and_objective(
    db: Session,
    user_id: int,
    domain_id: int,
    objective_id: int | None,
) -> None:
    if objective_id is None:
        validate_domain_and_objectives(db, user_id, domain_id, [])
    else:
        validate_domain_and_objectives(db, user_id, domain_id, [objective_id])
