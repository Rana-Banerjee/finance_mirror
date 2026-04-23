from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.loan import (
    LiabilityComponentCreate,
    LiabilityComponentResponse,
    LoanUpdate,
    ScheduleRebuildRequest,
)
from app.services import loan_service

router = APIRouter()


def _get_emi_type(emi_type):
    if hasattr(emi_type, "value"):
        return emi_type.value
    return emi_type


def _build_loan_response(liability) -> LiabilityComponentResponse:
    resp = LiabilityComponentResponse.model_validate(liability)
    emi_calc = loan_service.calculate_emi(
        liability.outstanding_balance,
        liability.interest_rate_annual,
        liability.tenure_months,
        _get_emi_type(liability.emi_type),
    )
    resp.emi_amount = emi_calc["emi_amount"]
    if liability.pre_emi_months > 0:
        resp.pre_emi_amount = loan_service.calculate_pre_emi(
            liability.outstanding_balance, liability.interest_rate_annual
        )
    return resp


@router.get("/{property_id}/loan", response_model=LiabilityComponentResponse)
def get_loan(property_id: int, db: Session = Depends(get_db)):
    liability = loan_service.get_liability(db, property_id)
    if not liability:
        raise HTTPException(status_code=404, detail="Loan not found for this property")
    return _build_loan_response(liability)


@router.post(
    "/{property_id}/loan",
    response_model=LiabilityComponentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_loan(
    property_id: int, liability: LiabilityComponentCreate, db: Session = Depends(get_db)
):
    db_liability = loan_service.create_liability(
        db, property_id, liability.model_dump()
    )
    return _build_loan_response(db_liability)


@router.patch("/{property_id}/loan", response_model=LiabilityComponentResponse)
def update_loan(
    property_id: int, update_data: LoanUpdate, db: Session = Depends(get_db)
):
    db_liability = loan_service.update_liability(db, property_id, update_data)
    if not db_liability:
        raise HTTPException(status_code=404, detail="Loan not found for this property")
    return _build_loan_response(db_liability)


@router.delete("/{property_id}/loan", status_code=status.HTTP_204_NO_CONTENT)
def delete_loan(property_id: int, db: Session = Depends(get_db)):
    result = loan_service.delete_liability(db, property_id)
    if not result:
        raise HTTPException(status_code=404, detail="Loan not found for this property")


@router.get("/{property_id}/loan/schedule")
def get_loan_schedule(property_id: int, db: Session = Depends(get_db)):
    liability = loan_service.get_liability(db, property_id)
    if not liability:
        raise HTTPException(status_code=404, detail="Loan not found for this property")
    schedule = loan_service.build_loan_schedule(
        liability.outstanding_balance,
        liability.interest_rate_annual,
        liability.tenure_months,
        _get_emi_type(liability.emi_type),
        liability.pre_emi_months,
    )
    return {
        "property_id": property_id,
        "pre_emi_months": liability.pre_emi_months,
        "schedule": schedule,
    }


@router.post("/{property_id}/loan/rebuild-schedule")
def rebuild_schedule(
    property_id: int,
    body: ScheduleRebuildRequest,
    db: Session = Depends(get_db),
):
    liability = loan_service.get_liability(db, property_id)
    if not liability:
        raise HTTPException(status_code=404, detail="Loan not found for this property")
    linked_cash_balance = Decimal("0")
    if liability.is_overdraft and liability.linked_cash_unit_id:
        linked_unit = loan_service.get_liability(db, liability.linked_cash_unit_id)
        if linked_unit:
            linked_cash_balance = linked_unit.outstanding_balance
    schedule = loan_service.rebuild_loan_schedule(
        db, property_id, liability, linked_cash_balance
    )
    return {
        "property_id": property_id,
        "pre_emi_months": liability.pre_emi_months,
        "schedule": schedule,
    }
