# Property Investment Module

FastAPI backend + Next.js frontend for property investment tracking.

## Commands

```bash
# Backend
pip install -r backend/requirements.txt
ruff check backend/ && mypy backend/
uvicorn backend.app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run lint   # or: npx next lint
npm run build  # verify production build
npm run dev
```

## Architecture

- Backend: `backend/app/main.py`, API prefix `/api/v1`
- Frontend: Next.js 15.5.15 (App Router at `frontend/app/`)
- DB: SQLite (see `backend/app/db/database.py`)

## Verified Gotchas

1. **Next.js 14.2.3 + Node 22**: Crashes with Bus error → use 15.5.15+
2. **SQLAlchemy ForeignKey**: Define `ForeignKey("investment_units.id")` on child table AND `foreign_keys=` on relationship
3. **SQLite server_default**: Never use `server_default="CURRENT_DATE"` → use `default=_current_date` (Python callable)
4. **No external DB**: PostgreSQL/MySQL unavailable → SQLite fallback in database.py

## Key Calculations

- EMI (reducing): `P * r * (1+r)^n / ((1+r)^n - 1)` where `r = annual_rate/12`
- Pre-EMI: `outstanding_balance * annual_rate / 12` (interest only)
- Overdraft: `effective_principal = max(0, outstanding_balance - linked_cash_balance)`

## Workflow

1. Read `init.md` for resume state
2. Edit: lint → typecheck → test (pytest placeholder) → build
3. Verify: backend lint+typecheck pass, frontend build pass

## Testing

```bash
pytest backend/  # no tests yet, placeholder
```