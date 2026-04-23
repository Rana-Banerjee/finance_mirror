from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date


class CashflowComponentBase(BaseModel):
    monthly_rent: Decimal = Decimal("0")
    rental_growth_rate_annual: Decimal = Decimal("0")
    monthly_maintenance: Decimal = Decimal("0")


class CashflowComponentCreate(CashflowComponentBase):
    pass


class CashflowComponentUpdate(BaseModel):
    monthly_rent: Optional[Decimal] = None
    rental_growth_rate_annual: Optional[Decimal] = None
    monthly_maintenance: Optional[Decimal] = None


class CashflowComponentResponse(CashflowComponentBase):
    id: int
    investment_unit_id: int
    created_at: Optional[date] = None

    class Config:
        from_attributes = True
