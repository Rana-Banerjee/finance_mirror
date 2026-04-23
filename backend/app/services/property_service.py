from sqlalchemy.orm import Session
from app.models.property import InvestmentUnit, AssetComponent
from app.schemas.property import (
    InvestmentUnitCreate,
    InvestmentUnitUpdate,
)


def get_properties(db: Session):
    return db.query(InvestmentUnit).all()


def get_property(db: Session, property_id: int):
    return db.query(InvestmentUnit).filter(InvestmentUnit.id == property_id).first()


def create_property(db: Session, property: InvestmentUnitCreate):
    db_property = InvestmentUnit(
        name=property.name,
        status=property.status,
        purchase_date=property.purchase_date,
        possession_date=property.possession_date,
        property_value=property.property_value,
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)

    for asset in property.assets:
        db_asset = AssetComponent(
            investment_unit_id=db_property.id,
            component_type=asset.component_type,
            base_value=asset.base_value,
            current_value=asset.base_value,
            appreciation_rate=asset.appreciation_rate,
        )
        db.add(db_asset)

    db.commit()
    db.refresh(db_property)
    return db_property


def update_property(db: Session, property_id: int, property: InvestmentUnitUpdate):
    db_property = get_property(db, property_id)
    if not db_property:
        return None

    update_data = property.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_property, field, value)

    db.commit()
    db.refresh(db_property)
    return db_property


def delete_property(db: Session, property_id: int):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    db.delete(db_property)
    db.commit()
    return db_property
