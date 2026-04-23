from datetime import date
from sqlalchemy import Column, Integer, String, Numeric, Enum, Date, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


def _current_date():
    return date.today()


class PropertyStatus(str, enum.Enum):
    READY = "READY"
    UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION"


class InvestmentUnit(Base):
    __tablename__ = "investment_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    status = Column(Enum(PropertyStatus), default=PropertyStatus.READY, nullable=True)  # type: ignore[var-annotated]
    purchase_date = Column(Date, nullable=True)
    possession_date = Column(Date, nullable=True)
    property_value = Column(Numeric(12, 2), nullable=False)
    created_at = Column(Date, default=_current_date)

    assets = relationship(
        "AssetComponent",
        back_populates="investment_unit",
        foreign_keys="AssetComponent.investment_unit_id",
        cascade="all, delete-orphan",
    )
    liabilities = relationship(
        "LiabilityComponent",
        back_populates="investment_unit",
        foreign_keys="LiabilityComponent.investment_unit_id",
        cascade="all, delete-orphan",
    )
    events = relationship(
        "Event",
        back_populates="investment_unit",
        foreign_keys="Event.investment_unit_id",
        cascade="all, delete-orphan",
    )
    cashflow = relationship(
        "CashflowComponent",
        back_populates="investment_unit",
        foreign_keys="CashflowComponent.investment_unit_id",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AssetComponent(Base):
    __tablename__ = "asset_components"

    id = Column(Integer, primary_key=True, index=True)
    investment_unit_id = Column(
        Integer, ForeignKey("investment_units.id"), nullable=False
    )
    component_type = Column(String(50), nullable=False)
    base_value = Column(Numeric(12, 2), nullable=False)
    current_value = Column(Numeric(12, 2), nullable=False)
    appreciation_rate = Column(Numeric(5, 4), default=0)
    created_at = Column(Date, default=_current_date)

    investment_unit = relationship("InvestmentUnit", back_populates="assets")
