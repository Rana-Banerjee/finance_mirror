from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.cashflow import (
    CashflowComponentCreate,
    CashflowComponentUpdate,
    CashflowComponentResponse,
)
from app.services import cashflow_service

router = APIRouter()


@router.get("/{property_id}/cashflow", response_model=CashflowComponentResponse)
def get_cashflow(property_id: int, db: Session = Depends(get_db)):
    cashflow = cashflow_service.get_cashflow(db, property_id)
    if not cashflow:
        raise HTTPException(
            status_code=404, detail="Cashflow not found for this property"
        )
    return cashflow


@router.post(
    "/{property_id}/cashflow",
    response_model=CashflowComponentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cashflow(
    property_id: int, data: CashflowComponentCreate, db: Session = Depends(get_db)
):
    return cashflow_service.create_cashflow(db, property_id, data)


@router.patch("/{property_id}/cashflow", response_model=CashflowComponentResponse)
def update_cashflow(
    property_id: int, data: CashflowComponentUpdate, db: Session = Depends(get_db)
):
    cashflow = cashflow_service.update_cashflow(db, property_id, data)
    if not cashflow:
        raise HTTPException(
            status_code=404, detail="Cashflow not found for this property"
        )
    return cashflow
