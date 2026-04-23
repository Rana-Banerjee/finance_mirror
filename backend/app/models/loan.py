from datetime import date
from sqlalchemy import Column, Integer, Numeric, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class LiabilityComponent(Base):
    __tablename__ = "liability_components"

    id = Column(Integer, primary_key=True, index=True)
    investment_unit_id = Column(
        Integer, ForeignKey("investment_units.id"), nullable=False
    )
    original_loan_amount = Column(Numeric(12, 2), nullable=False)
    outstanding_balance = Column(Numeric(12, 2), nullable=False)
    interest_rate_annual = Column(Numeric(5, 4), nullable=False)
    tenure_months = Column(Integer, nullable=False)
    emi_type = Column(String(20), default="REDUCING", nullable=False)
    pre_emi_months = Column(Integer, default=0)
    is_overdraft = Column(Integer, default=0)
    linked_cash_unit_id = Column(
        Integer, ForeignKey("investment_units.id"), nullable=True
    )
    overdraft_mode = Column(String(20), default="reduce_tenure", nullable=False)
    created_at = Column(Date, default=date.today)

    investment_unit = relationship(
        "InvestmentUnit",
        back_populates="liabilities",
        foreign_keys=[investment_unit_id],
    )
