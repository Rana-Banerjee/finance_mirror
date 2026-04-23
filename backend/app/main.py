from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import properties, loans, events, cashflow
from app.db.database import engine, Base
from app.models import loan  # noqa: F401
from app.models import event  # noqa: F401
from app.models import cashflow as cf_model  # noqa: F401
from app.schemas.loan import EMIRequest, EMIResponse
from app.services import loan_service

app = FastAPI(title="Property Investment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router, prefix="/api/v1/properties", tags=["properties"])
app.include_router(loans.router, prefix="/api/v1/properties", tags=["loans"])
app.include_router(events.router, prefix="/api/v1/properties", tags=["events"])
app.include_router(cashflow.router, prefix="/api/v1/properties", tags=["cashflow"])


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/v1/emi/calculate", response_model=EMIResponse)
def calculate_emi_endpoint(req: EMIRequest):
    return loan_service.calculate_emi(
        req.principal, req.annual_rate, req.tenure_months, req.emi_type
    )
