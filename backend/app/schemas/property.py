from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional


class AssetComponentBase(BaseModel):
    component_type: str
    base_value: Decimal
    appreciation_rate: Decimal = Decimal("0")


class AssetComponentCreate(AssetComponentBase):
    pass


class AssetComponentResponse(AssetComponentBase):
    id: int
    investment_unit_id: int
    current_value: Decimal

    class Config:
        from_attributes = True


class InvestmentUnitBase(BaseModel):
    name: str
    status: str = "READY"
    purchase_date: Optional[date] = None
    possession_date: Optional[date] = None
    property_value: Decimal


class InvestmentUnitCreate(InvestmentUnitBase):
    assets: list[AssetComponentCreate] = []


class InvestmentUnitUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    purchase_date: Optional[date] = None
    possession_date: Optional[date] = None
    property_value: Optional[Decimal] = None


class InvestmentUnitResponse(InvestmentUnitBase):
    id: int
    created_at: date

    class Config:
        from_attributes = True


class PropertyDetailResponse(InvestmentUnitResponse):
    assets: list[AssetComponentResponse] = []
