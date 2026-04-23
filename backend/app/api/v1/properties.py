from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.schemas.property import (
    InvestmentUnitResponse,
    InvestmentUnitCreate,
    InvestmentUnitUpdate,
    PropertyDetailResponse,
)
from app.schemas.projection import ProjectionResponse, ProjectionRow
from app.services import property_service
from app.services import projection_service

router = APIRouter()


@router.get("", response_model=List[InvestmentUnitResponse])
def list_properties(db: Session = Depends(get_db)):
    return property_service.get_properties(db)


@router.get("/{property_id}", response_model=PropertyDetailResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property = property_service.get_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.post(
    "", response_model=PropertyDetailResponse, status_code=status.HTTP_201_CREATED
)
def create_property(property: InvestmentUnitCreate, db: Session = Depends(get_db)):
    return property_service.create_property(db, property)


@router.patch("/{property_id}", response_model=PropertyDetailResponse)
def update_property(
    property_id: int,
    property: InvestmentUnitUpdate,
    db: Session = Depends(get_db),
):
    db_property = property_service.update_property(db, property_id, property)
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    db_property = property_service.delete_property(db, property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")


@router.get("/{property_id}/projection", response_model=ProjectionResponse)
def get_projection(
    property_id: int,
    months: Optional[int] = Query(default=360, ge=1, le=600),
    db: Session = Depends(get_db),
):
    prop = property_service.get_property(db, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    rows = projection_service.simulate_monthly_projection(
        db, property_id, months or 360
    )
    rent_vs_emi_crossover_month: Optional[int] = None
    loan_paid_off_month: Optional[int] = None
    for row in rows:
        if row.get("is_crossover") and rent_vs_emi_crossover_month is None:
            rent_vs_emi_crossover_month = row["month"]
        if row.get("loan_balance") == 0 and loan_paid_off_month is None:
            loan_paid_off_month = row["month"]
    return ProjectionResponse(
        property_id=property_id,
        projection_months=len(rows),
        rent_vs_emi_crossover_month=rent_vs_emi_crossover_month,
        loan_paid_off_month=loan_paid_off_month,
        rows=[ProjectionRow(**r) for r in rows],
    )
