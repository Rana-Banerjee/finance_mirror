from decimal import Decimal
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models.loan import LiabilityComponent
from app.models.event import Event
from app.schemas.loan import LoanUpdate


def calculate_emi(
    principal: Decimal, annual_rate: Decimal, tenure_months: int, emi_type: str
) -> dict:
    r = annual_rate / 12
    if emi_type == "FLAT":
        total_interest = principal * annual_rate * Decimal(tenure_months) / 12
        emi = (principal + total_interest) / tenure_months
        total_payment = principal + total_interest
    else:
        if r == 0:
            emi = principal / tenure_months
        else:
            factor = (1 + r) ** tenure_months
            emi = principal * r * factor / (factor - 1)
        total_interest = emi * tenure_months - principal
        total_payment = emi * tenure_months
    return {
        "emi_amount": round(emi, 2),
        "emi_type": emi_type,
        "tenure_months": tenure_months,
        "annual_rate": annual_rate,
        "total_interest": round(total_interest, 2),
        "total_payment": round(total_payment, 2),
    }


def calculate_pre_emi(outstanding_balance: Decimal, annual_rate: Decimal) -> Decimal:
    return round(outstanding_balance * annual_rate / 12, 2)


def get_liability(db: Session, property_id: int):
    return (
        db.query(LiabilityComponent)
        .filter(LiabilityComponent.investment_unit_id == property_id)
        .first()
    )


def create_liability(db: Session, property_id: int, liability: dict):
    db_liability = LiabilityComponent(investment_unit_id=property_id, **liability)
    db.add(db_liability)
    db.commit()
    db.refresh(db_liability)
    return db_liability


def update_liability(db: Session, property_id: int, update_data: LoanUpdate):
    db_liability = get_liability(db, property_id)
    if not db_liability:
        return None
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_liability, field, value)
    db.commit()
    db.refresh(db_liability)
    return db_liability


def delete_liability(db: Session, property_id: int):
    db_liability = get_liability(db, property_id)
    if not db_liability:
        return None
    db.delete(db_liability)
    db.commit()
    return db_liability


def calculate_pre_emi_timeline(
    start_date: date,
    possession_date: Optional[date],
    pre_emi_months: int,
) -> list[dict]:
    timeline = []
    if possession_date and pre_emi_months > 0:
        for i in range(pre_emi_months):
            month_date = date(
                possession_date.year + (possession_date.month - 1 + i) // 12,
                ((possession_date.month - 1 + i) % 12) + 1,
                min(possession_date.day, 28),
            )
            timeline.append({"month": i + 1, "date": month_date, "phase": "PRE_EMI"})
    return timeline


def build_loan_schedule(
    principal: Decimal,
    annual_rate: Decimal,
    tenure_months: int,
    emi_type: str,
    pre_emi_months: int = 0,
    start_emi_date: Optional[date] = None,
) -> list[dict]:
    schedule = []
    r = annual_rate / 12

    for i in range(pre_emi_months):
        interest = round(principal * r, 2)
        schedule.append(
            {
                "month": i + 1,
                "payment": interest,
                "principal": Decimal("0"),
                "interest": interest,
                "balance": principal,
                "phase": "PRE_EMI",
            }
        )

    if pre_emi_months > 0 and tenure_months > pre_emi_months:
        remaining_principal = principal
        remaining_months = tenure_months - pre_emi_months
    else:
        remaining_principal = principal
        remaining_months = tenure_months

    if remaining_months > 0:
        if emi_type == "FLAT":
            total_interest = (
                remaining_principal * annual_rate * Decimal(remaining_months) / 12
            )
            emi = (remaining_principal + total_interest) / remaining_months
        else:
            if r == 0:
                emi = remaining_principal / remaining_months
            else:
                factor = (1 + r) ** remaining_months
                emi = remaining_principal * r * factor / (factor - 1)
        emi = round(emi, 2)

        balance = remaining_principal
        for i in range(remaining_months):
            interest_portion = round(balance * r, 2)
            principal_portion = emi - interest_portion
            balance = max(Decimal("0"), round(balance - principal_portion, 2))
            schedule.append(
                {
                    "month": pre_emi_months + i + 1,
                    "payment": emi,
                    "principal": principal_portion,
                    "interest": interest_portion,
                    "balance": balance,
                    "phase": "EMI",
                }
            )

    return schedule


def get_prepayment_events(db: Session, property_id: int) -> list:
    return (
        db.query(Event)
        .filter(
            Event.investment_unit_id == property_id,
            Event.event_type == "PREPAYMENT",
        )
        .order_by(Event.event_date)
        .all()
    )


def rebuild_loan_schedule(
    db: Session,
    property_id: int,
    liability: LiabilityComponent,
    linked_cash_balance: Decimal = Decimal("0"),
) -> list[dict]:
    balance: Decimal = Decimal(str(liability.outstanding_balance))
    rate: Decimal = Decimal(str(liability.interest_rate_annual))
    tenure: int = int(liability.tenure_months)
    pre_emi: int = int(liability.pre_emi_months or 0)
    overdraft_mode: str = str(liability.overdraft_mode or "reduce_tenure")
    emi_type: str = _get_emi_type_val(liability.emi_type)
    linked_cash: Decimal = Decimal(str(linked_cash_balance))

    r = rate / 12
    prepayments = get_prepayment_events(db, property_id)
    prepayments.sort(key=lambda p: p.event_date or date.today())

    schedule = []
    current_month = 1

    for pre_emi_idx in range(pre_emi):
        effective_principal = max(Decimal("0"), balance - linked_cash)
        interest = round(effective_principal * r, 2)
        schedule.append(
            {
                "month": current_month,
                "payment": interest,
                "principal": Decimal("0"),
                "interest": interest,
                "balance": balance,
                "effective_principal": effective_principal,
                "phase": "PRE_EMI",
            }
        )
        current_month += 1

    remaining_months = tenure - pre_emi
    if remaining_months > 0 and balance > 0:
        effective_principal = max(Decimal("0"), balance - linked_cash)
        if emi_type == "FLAT":
            total_interest = effective_principal * rate * Decimal(remaining_months) / 12
            emi = (effective_principal + total_interest) / remaining_months
        else:
            if r == 0:
                emi = effective_principal / remaining_months
            else:
                factor = (1 + r) ** remaining_months
                emi = effective_principal * r * factor / (factor - 1)
        emi = round(emi, 2)

        while current_month <= tenure and balance > 0:
            prepayment_reduction = Decimal("0")
            for prep in list(prepayments):
                if prep.event_date and prep.event_date <= _month_to_date(current_month):
                    prepayment_reduction += Decimal(str(prep.amount))

            balance = max(Decimal("0"), balance - prepayment_reduction)
            effective_principal = max(Decimal("0"), balance - linked_cash)

            if prepayment_reduction > 0 and overdraft_mode == "reduce_tenure":
                remaining_months_emi = max(1, tenure - current_month + 1)
                if emi_type == "FLAT":
                    total_int = (
                        effective_principal * rate * Decimal(remaining_months_emi) / 12
                    )
                    emi = (effective_principal + total_int) / remaining_months_emi
                else:
                    if r == 0:
                        emi = effective_principal / remaining_months_emi
                    else:
                        factor = (1 + r) ** remaining_months_emi
                        emi = effective_principal * r * factor / (factor - 1)
                emi = round(emi, 2)

            interest_portion = round(effective_principal * r, 2)
            principal_portion = max(Decimal("0"), emi - interest_portion)
            balance = max(Decimal("0"), round(balance - principal_portion, 2))
            effective_principal = max(Decimal("0"), balance - linked_cash)
            schedule.append(
                {
                    "month": current_month,
                    "payment": emi,
                    "principal": principal_portion,
                    "interest": interest_portion,
                    "balance": balance,
                    "effective_principal": effective_principal,
                    "phase": "EMI",
                }
            )
            current_month += 1

    return schedule


def _get_emi_type_val(emi_type):
    if hasattr(emi_type, "value"):
        return emi_type.value
    return emi_type


def _month_to_date(month: int) -> date:
    today = date.today()
    return date(today.year, today.month, 1)
