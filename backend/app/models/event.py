from datetime import date
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


class EventType(str, enum.Enum):
    INSTALLMENT_PAYMENT = "INSTALLMENT_PAYMENT"
    PREPAYMENT = "PREPAYMENT"
    SALE = "SALE"


class FundingSource(str, enum.Enum):
    SELF = "SELF"
    LOAN = "LOAN"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    investment_unit_id = Column(
        Integer, ForeignKey("investment_units.id"), nullable=False
    )
    event_type = Column(String(30), nullable=False)
    event_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    funding_source = Column(String(10), nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(Date, default=date.today)

    investment_unit = relationship("InvestmentUnit", back_populates="events")
