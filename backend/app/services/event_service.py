from sqlalchemy.orm import Session
from app.models.event import Event
from app.schemas.event import EventUpdate


def get_events(db: Session, property_id: int):
    return (
        db.query(Event)
        .filter(Event.investment_unit_id == property_id)
        .order_by(Event.event_date)
        .all()
    )


def get_event(db: Session, property_id: int, event_id: int):
    return (
        db.query(Event)
        .filter(Event.id == event_id, Event.investment_unit_id == property_id)
        .first()
    )


def create_event(db: Session, property_id: int, event_data: dict):
    db_event = Event(investment_unit_id=property_id, **event_data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def update_event(
    db: Session, property_id: int, event_id: int, update_data: EventUpdate
):
    db_event = get_event(db, property_id, event_id)
    if not db_event:
        return None
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_event, field, value)
    db.commit()
    db.refresh(db_event)
    return db_event


def delete_event(db: Session, property_id: int, event_id: int):
    db_event = get_event(db, property_id, event_id)
    if not db_event:
        return None
    db.delete(db_event)
    db.commit()
    return db_event
