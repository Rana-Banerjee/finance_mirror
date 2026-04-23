# Project: Property Investment Module

## Purpose

This repo is a **Property Investment Module** combining:
- Asset (value + appreciation)
- Liability (loan)
- Cashflows (EMI / pre-EMI / rent)
- Events (installments, prepayments, sale)

Tech stack: **Python (FastAPI) backend** + **Next.js frontend** in a single repository.

---

## Developer Commands

### Backend (Python/Fastapi)

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run dev server
uvicorn backend.app.main:app --reload --port 8000

# Run tests
pytest backend/

# Lint
ruff check backend/

# Typecheck
mypy backend/
```

### Frontend (Next.js)

```bash
# Install dependencies
cd frontend && npm install

# Run dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

### Full Stack

```bash
# Run both (from project root)
uvicorn backend.app.main:app --reload --port 8000 &
cd frontend && npm run dev
```

---

## Project Structure

```
/backend
  /app
    /models        # SQLAlchemy models
    /schemas      # Pydantic schemas
    /services     # Business logic
    /api/v1       # Endpoints
    /db           # Migrations, connection

/frontend
  /app/properties # Pages
  /components    # Reusable UI
```

---

## Architecture

### Backend (FastAPI)

- **Entry point:** `backend/app/main.py`
- **Database:** PostgreSQL (via SQLAlchemy)
- **API prefix:** `/api/v1`
- **Core services:**
  - `property_service` — CRUD + aggregate view
  - `loan_service` — EMI, overdraft, amortization
  - `projection_service` — monthly simulation

### Frontend (Next.js)

- **Entry point:** `frontend/app/` directory (App Router)
- **Pages:**
  - `/properties` — list
  - `/properties/new` — create
  - `/properties/[id]` — detail
  - `/properties/[id]/edit` — edit
- **Components:**
  - `PropertyForm.tsx`, `LoanForm.tsx`, `InstallmentScheduler.tsx`
  - `ProjectionGraph.tsx`, `EMIChart.tsx`, `RentEMICrossoverCard.tsx`

---

## Financial Calculations

### EMI (Reducing)

```
EMI = P * r * (1+r)^n / ((1+r)^n - 1)
where r = annual_rate/12
```

### EMI (Flat)

```
EMI = (P + P * annual_rate * years) / months
```

### Pre-EMI

```
interest = outstanding_balance * annual_rate / 12
payment = interest only
```

### Overdraft

```
effective_principal = max(0, outstanding_balance - linked_cash_balance)
interest = effective_principal * annual_rate / 12
```

### Installments

- SELF: property_value += amount
- LOAN: outstanding_balance += amount; property_value += amount

### Appreciation (monthly)

```
monthly_rate = (1 + annual_rate)^(1/12) - 1
property_value *= (1 + monthly_rate)
```

### Rent Growth (monthly)

```
monthly_growth = (1 + annual_growth)^(1/12) - 1
rent *= (1 + monthly_growth)
```

### Crossover

Find first month where `rent >= EMI` (only during EMI phase)

---

## Verification

- **Run full test suite:** `pytest backend/ && cd frontend && npm run test`
- **Build check:** `npm run build` (frontend) + no import errors (backend)
- **Lint:** `ruff check backend/` + `npm run lint` (frontend)
- **Order:** lint → typecheck → test → build

---

## Agent Workflow

### Phase 1 — Property Core (MVP)

- Tables: `investment_units`, `asset_components`
- APIs: create, list, get, update, delete property
- UI: list page + basic add/edit form
- Output: property value + basic summary

### Phase 2 — Loan Foundation

- Table: `liability_components`
- Logic: EMI (reducing + flat)
- APIs: attach/update loan, compute EMI
- UI: loan section in form + EMI preview

### Phase 3 — Under-Construction + Pre-EMI

- Fields: `property_status`, `possession_date`
- Events: `INSTALLMENT_PAYMENT`
- Logic: pre-EMI (interest-only), incremental disbursement
- UI: installment scheduler (timeline), pre-EMI preview

### Phase 4 — Advanced Loan (OD + Prepayment)

- Fields: `is_overdraft`, `linked_cash_unit_id`, `overdraft_mode`
- Events: `PREPAYMENT`
- Logic: overdraft interest (effective principal), schedule rebuild
- API: amortization schedule endpoint
- UI: OD toggle + impact preview

### Phase 5 — Projection Engine (Property-level)

- Service: `projection_service`
- Logic per month:
  1. apply installment events
  2. update loan (pre-EMI/EMI + overdraft)
  3. apply appreciation
  4. apply rent growth
  5. compute equity and net cash flow
  6. detect rent ≥ EMI crossover
- API: `GET /properties/{id}/projection`

### Phase 6 — Visualization & Insights

- Charts: property value, loan balance, equity, cash flow
- Marker: rent vs EMI crossover
- Controls: adjust appreciation, rent growth, rate (client-side overrides)

---

## Execution Order

1. Read `init.md` (if exists)
2. Start with Property Core (Phase 1)
3. Progress through phases in order
4. Update `init.md` after each completed task

---

## Resume Rule

If a session restarts:

1. Read `init.md`
2. Identify last completed phase
3. Resume from the next unfinished task
4. Update `init.md` after the next completed step

---

## Constraints

- Deterministic calculations only
- No mixing appreciation with income
- No duplicated data across tables
- Keep APIs aggregated per property unit
- Prefer pure functions for calculations