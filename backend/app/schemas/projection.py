from typing import Optional
from pydantic import BaseModel


class ProjectionRow(BaseModel):
    month: int
    date: str
    property_value: float
    loan_balance: float
    equity: float
    monthly_rent: float
    monthly_maintenance: float
    emi_payment: float
    interest_payment: float
    principal_payment: float
    net_cashflow: float
    phase: str
    effective_principal: float
    is_crossover: bool


class ProjectionResponse(BaseModel):
    property_id: int
    projection_months: int
    rent_vs_emi_crossover_month: Optional[int] = None
    loan_paid_off_month: Optional[int] = None
    rows: list[ProjectionRow]
