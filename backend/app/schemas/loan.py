from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date


class LiabilityComponentBase(BaseModel):
    original_loan_amount: Decimal
    outstanding_balance: Decimal
    interest_rate_annual: Decimal
    tenure_months: int
    emi_type: str = "REDUCING"
    pre_emi_months: int = 0
    is_overdraft: bool = False
    linked_cash_unit_id: Optional[int] = None
    overdraft_mode: Optional[str] = None


class LiabilityComponentCreate(LiabilityComponentBase):
    pass


class LiabilityComponentResponse(LiabilityComponentBase):
    id: int
    investment_unit_id: int
    created_at: date
    emi_amount: Optional[Decimal] = None
    pre_emi_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class LoanUpdate(BaseModel):
    original_loan_amount: Optional[Decimal] = None
    outstanding_balance: Optional[Decimal] = None
    interest_rate_annual: Optional[Decimal] = None
    tenure_months: Optional[int] = None
    emi_type: Optional[str] = None
    pre_emi_months: Optional[int] = None
    is_overdraft: Optional[bool] = None
    linked_cash_unit_id: Optional[int] = None
    overdraft_mode: Optional[str] = None


class EMIRequest(BaseModel):
    principal: Decimal
    annual_rate: Decimal
    tenure_months: int
    emi_type: str = "REDUCING"


class EMIResponse(BaseModel):
    emi_amount: Decimal
    emi_type: str
    tenure_months: int
    annual_rate: Decimal
    total_interest: Decimal
    total_payment: Decimal


class ScheduleRebuildRequest(BaseModel):
    effective_date: Optional[date] = None
