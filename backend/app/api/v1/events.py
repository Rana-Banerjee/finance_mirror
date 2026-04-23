from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
)
from app.services import event_service

router = APIRouter()


@router.get("/{property_id}/events", response_model=list[EventResponse])
def list_events(property_id: int, db: Session = Depends(get_db)):
    events = event_service.get_events(db, property_id)
    return events


@router.post(
    "/{property_id}/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    property_id: int, event_data: EventCreate, db: Session = Depends(get_db)
):
    return event_service.create_event(db, property_id, event_data.model_dump())


@router.patch("/{property_id}/events/{event_id}", response_model=EventResponse)
def update_event(
    property_id: int,
    event_id: int,
    update_data: EventUpdate,
    db: Session = Depends(get_db),
):
    event = event_service.update_event(db, property_id, event_id, update_data)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.delete(
    "/{property_id}/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_event(property_id: int, event_id: int, db: Session = Depends(get_db)):
    result = event_service.delete_event(db, property_id, event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
