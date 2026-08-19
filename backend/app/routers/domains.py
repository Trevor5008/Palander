from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_db
from app.models.domain import Domain
from app.schemas.domain import DomainCreate, DomainRead, DomainUpdate

router = APIRouter(prefix="/domains", tags=["domains"])


def _get_domain_or_404(db: Session, domain_id: int, user_id: int) -> Domain:
    domain = (
        db.query(Domain)
        .filter(Domain.id == domain_id, Domain.user_id == user_id)
        .first()
    )
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    return domain


@router.get("", response_model=list[DomainRead])
def list_domains(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return db.query(Domain).filter(Domain.user_id == user_id).order_by(Domain.name).all()


@router.post("", response_model=DomainRead, status_code=status.HTTP_201_CREATED)
def create_domain(
    body: DomainCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    domain = Domain(name=body.name, user_id=user_id)
    db.add(domain)
    db.commit()
    db.refresh(domain)
    return domain


@router.get("/{domain_id}", response_model=DomainRead)
def get_domain(
    domain_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return _get_domain_or_404(db, domain_id, user_id)


@router.patch("/{domain_id}", response_model=DomainRead)
def update_domain(
    domain_id: int,
    body: DomainUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    domain = _get_domain_or_404(db, domain_id, user_id)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(domain, key, value)
    db.commit()
    db.refresh(domain)
    return domain


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_domain(
    domain_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    domain = _get_domain_or_404(db, domain_id, user_id)
    db.delete(domain)
    db.commit()
