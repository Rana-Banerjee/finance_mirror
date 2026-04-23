from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date


class EventBase(BaseModel):
    event_type: str
    event_date: date
    amount: Decimal
    funding_source: Optional[str] = None
    notes: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_type: Optional[str] = None
    event_date: Optional[date] = None
    amount: Optional[Decimal] = None
    funding_source: Optional[str] = None
    notes: Optional[str] = None


class EventResponse(EventBase):
    id: int
    investment_unit_id: int
    created_at: date

    class Config:
        from_attributes = True
