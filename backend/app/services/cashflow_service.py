from sqlalchemy.orm import Session
from app.models.cashflow import CashflowComponent
from app.schemas.cashflow import CashflowComponentCreate, CashflowComponentUpdate


def get_cashflow(db: Session, property_id: int):
    return (
        db.query(CashflowComponent)
        .filter(CashflowComponent.investment_unit_id == property_id)
        .first()
    )


def create_cashflow(db: Session, property_id: int, data: CashflowComponentCreate):
    db_cf = CashflowComponent(investment_unit_id=property_id, **data.model_dump())
    db.add(db_cf)
    db.commit()
    db.refresh(db_cf)
    return db_cf


def update_cashflow(db: Session, property_id: int, data: CashflowComponentUpdate):
    db_cf = get_cashflow(db, property_id)
    if not db_cf:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cf, field, value)
    db.commit()
    db.refresh(db_cf)
    return db_cf


def delete_cashflow(db: Session, property_id: int):
    db_cf = get_cashflow(db, property_id)
    if not db_cf:
        return None
    db.delete(db_cf)
    db.commit()
    return db_cf
