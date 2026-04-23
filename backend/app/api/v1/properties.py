from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.property import (
    InvestmentUnitResponse,
    InvestmentUnitCreate,
    InvestmentUnitUpdate,
    PropertyDetailResponse,
)
from app.services import property_service

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
