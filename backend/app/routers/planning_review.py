from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.planning_review import (
    CarryForwardRequest,
    CarryForwardResult,
    PlanningProgressRead,
    WeeklyReviewRead,
)
from app.services.planning_review import (
    apply_carry_forward,
    build_planning_progress,
    build_weekly_review,
)

router = APIRouter(prefix="/planning", tags=["planning"])


@router.get("/weekly-review", response_model=WeeklyReviewRead)
def get_weekly_review(
    week_start: date = Query(..., alias="week_start"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return build_weekly_review(db, user_id, week_start)


@router.get("/progress", response_model=PlanningProgressRead)
def get_planning_progress(
    weeks: int = Query(8, ge=1, le=52),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return build_planning_progress(db, user_id, weeks)


@router.post("/carry-forward", response_model=CarryForwardResult)
def carry_forward_tasks(
    body: CarryForwardRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    items = [(item.task_id, item.planned_for) for item in body.items]
    updated = apply_carry_forward(db, user_id, items)
    return CarryForwardResult(updated=updated)
