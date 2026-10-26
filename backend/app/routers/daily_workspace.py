from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.schemas.daily_workspace import DailyWorkspaceRead
from app.services.daily_workspace import build_daily_workspace

router = APIRouter(prefix="/daily-workspace", tags=["daily-workspace"])


@router.get("", response_model=DailyWorkspaceRead)
def get_daily_workspace(
    date: date = Query(..., alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return build_daily_workspace(db, user_id, date)
