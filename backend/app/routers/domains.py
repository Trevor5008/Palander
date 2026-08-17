from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Domain
from app.schemas.domain import DomainRead

# Router for domains path
router = APIRouter(prefix="/domains", tags=["domains"])

# List domains
@router.get("", response_model=list[DomainRead])
def list_domains(
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    return db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()
