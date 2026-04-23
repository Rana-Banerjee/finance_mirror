from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import properties
from app.db.database import engine, Base

app = FastAPI(title="Property Investment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router, prefix="/api/v1/properties", tags=["properties"])


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
