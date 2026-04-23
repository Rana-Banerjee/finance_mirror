from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.models.property import InvestmentUnit
from app.models.loan import LiabilityComponent
from app.models.cashflow import CashflowComponent
from app.models.event import Event


def simulate_monthly_projection(
    db: Session,
    property_id: int,
    projection_months: int = 360,
) -> list[dict]:
    prop = db.query(InvestmentUnit).filter(InvestmentUnit.id == property_id).first()
    if not prop:
        return []

    liability = (
        db.query(LiabilityComponent)
        .filter(LiabilityComponent.investment_unit_id == property_id)
        .first()
    )

    cashflow = (
        db.query(CashflowComponent)
        .filter(CashflowComponent.investment_unit_id == property_id)
        .first()
    )

    prepayments = (
        db.query(Event)
        .filter(
            Event.investment_unit_id == property_id,
            Event.event_type == "PREPAYMENT",
        )
        .order_by(Event.event_date)
        .all()
    )

    current_value: Decimal = Decimal(str(prop.property_value))
    rate_annual: Decimal = Decimal("0")

    if prop.assets:
        for asset in prop.assets:
            if asset.component_type == "appreciation":
                rate_annual = Decimal(str(asset.appreciation_rate))
                break

    monthly_rent: Decimal = Decimal("0")
    monthly_maintenance: Decimal = Decimal("0")
    rent_growth_annual: Decimal = Decimal("0")

    if cashflow:
        monthly_rent = Decimal(str(cashflow.monthly_rent))
        rent_growth_annual = Decimal(str(cashflow.rental_growth_rate_annual))
        monthly_maintenance = Decimal(str(cashflow.monthly_maintenance))

    rent_growth_monthly = (Decimal("1") + rent_growth_annual) ** (
        Decimal("1") / Decimal("12")
    ) - Decimal("1")
    appreciation_monthly = (Decimal("1") + rate_annual) ** (
        Decimal("1") / Decimal("12")
    ) - Decimal("1")

    loan_balance: Decimal = Decimal("0")
    emi: Decimal = Decimal("0")
    pre_emi: int = 0
    emi_type: str = "REDUCING"
    is_overdraft: bool = False
    linked_cash: Decimal = Decimal("0")

    if liability:
        loan_balance = Decimal(str(liability.outstanding_balance))
        pre_emi = int(liability.pre_emi_months or 0)
        emi_type = str(liability.emi_type or "REDUCING")
        is_overdraft = bool(liability.is_overdraft)
        tenure: int = int(liability.tenure_months)
        loan_rate: Decimal = Decimal(str(liability.interest_rate_annual))

        if liability.linked_cash_unit_id:
            linked_prop = (
                db.query(InvestmentUnit)
                .filter(InvestmentUnit.id == liability.linked_cash_unit_id)
                .first()
            )
            if linked_prop:
                linked_cash = Decimal(str(linked_prop.property_value))

        r: Decimal = loan_rate / 12
        remaining: int = max(1, tenure - pre_emi)

        if is_overdraft:
            effective_p: Decimal = max(Decimal("0"), loan_balance - linked_cash)
        else:
            effective_p = loan_balance

        if emi_type == "FLAT":
            total_int = effective_p * loan_rate * Decimal(remaining) / 12
            emi = (effective_p + total_int) / remaining
        else:
            if r == 0:
                emi = effective_p / remaining
            else:
                factor = (Decimal("1") + r) ** remaining
                emi = effective_p * r * factor / (factor - Decimal("1"))
        emi = round(emi, 2)

    current_month = 1
    current_date = prop.purchase_date or date.today()
    rent_vs_emi_crossover_month: Optional[int] = None
    loan_paid_off_month: Optional[int] = None
    projection = []

    for month_idx in range(projection_months):
        month_date = date(
            current_date.year + (current_date.month - 1 + month_idx) // 12,
            ((current_date.month - 1 + month_idx) % 12) + 1,
            min(current_date.day, 28),
        )

        current_value = round(current_value * (Decimal("1") + appreciation_monthly), 2)

        rent_this_month = round(
            monthly_rent * ((Decimal("1") + rent_growth_monthly) ** month_idx), 2
        )

        prepayment_reduction = Decimal("0")
        for prep in prepayments:
            if prep.event_date and prep.event_date == month_date:
                prepayment_reduction += Decimal(str(prep.amount))

        emi_payment = Decimal("0")
        interest_payment = Decimal("0")
        principal_payment = Decimal("0")
        phase = "NONE"
        effective_principal = max(Decimal("0"), loan_balance - linked_cash)

        if pre_emi > 0 and month_idx < pre_emi:
            phase = "PRE_EMI"
            if liability:
                loan_rate_val = Decimal(str(liability.interest_rate_annual))
                interest_payment = round(effective_principal * (loan_rate_val / 12), 2)
            emi_payment = interest_payment
        elif loan_balance > 0:
            if month_idx == pre_emi or (pre_emi == 0 and month_idx == 0):
                phase = "FIRST_EMI"
            else:
                phase = "EMI"
            effective_principal = max(Decimal("0"), loan_balance - linked_cash)
            if liability:
                loan_rate_val = Decimal(str(liability.interest_rate_annual))
                interest_payment = round(effective_principal * (loan_rate_val / 12), 2)
            principal_payment = max(Decimal("0"), emi - interest_payment)
            emi_payment = emi
            loan_balance = max(Decimal("0"), round(loan_balance - principal_payment, 2))
            if prepayment_reduction > 0:
                loan_balance = max(Decimal("0"), loan_balance - prepayment_reduction)

            effective_principal = max(Decimal("0"), loan_balance - linked_cash)

            if loan_balance == 0 and loan_paid_off_month is None:
                loan_paid_off_month = current_month

        net_cashflow = rent_this_month - emi_payment - monthly_maintenance
        equity = current_value - loan_balance

        if (
            rent_vs_emi_crossover_month is None
            and rent_this_month >= emi_payment
            and emi_payment > 0
        ):
            rent_vs_emi_crossover_month = current_month

        projection.append(
            {
                "month": current_month,
                "date": month_date.isoformat(),
                "property_value": float(current_value),
                "loan_balance": float(loan_balance),
                "equity": float(equity),
                "monthly_rent": float(rent_this_month),
                "monthly_maintenance": float(monthly_maintenance),
                "emi_payment": float(emi_payment),
                "interest_payment": float(interest_payment),
                "principal_payment": float(principal_payment),
                "net_cashflow": float(net_cashflow),
                "phase": phase,
                "effective_principal": float(effective_principal),
                "is_crossover": rent_vs_emi_crossover_month == current_month,
            }
        )

        current_month += 1

        if loan_balance == 0 and current_month > pre_emi + 1:
            break

    return projection
