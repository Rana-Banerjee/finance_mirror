from sqlalchemy import Column, Integer, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class CashflowComponent(Base):
    __tablename__ = "cashflow_components"

    id = Column(Integer, primary_key=True, index=True)
    investment_unit_id = Column(
        Integer, ForeignKey("investment_units.id"), nullable=False
    )
    monthly_rent = Column(Numeric(12, 2), default=0)
    rental_growth_rate_annual = Column(Numeric(5, 4), default=0)
    monthly_maintenance = Column(Numeric(12, 2), default=0)
    created_at = Column(Date, nullable=True)

    investment_unit = relationship("InvestmentUnit", back_populates="cashflow")
