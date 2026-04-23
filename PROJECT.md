# 1. Objective

Build a **Property Investment Module** that models a property as a single Investment Unit combining:

* Asset (value + appreciation)
* Liability (loan)
* Cashflows (EMI / pre-EMI / rent)
* Events (installments, prepayments, sale)

The module must support:

* Ready vs Under-Construction lifecycle
* Installment-based funding
* Pre-EMI → EMI transition
* Overdraft home loans
* Rental growth
* Monthly projections with **rent vs EMI crossover**

---

## 2. Open-Code Execution Strategy

### Principles

* Build in **small, testable increments**
* Each step produces **running code**
* Avoid premature generalization
* Use **init.md** to track state and resume

### Task Rules

Each task must:

* Touch limited files
* Be independently verifiable (API/UI/test)
* Have clear inputs/outputs

---

## 3. Phased Build Plan

### Phase 1 — Property Core (MVP)

**Goal:** CRUD + aggregate view

* Tables: `investment_units`, `asset_components`
* APIs: create, list, get, update, delete property
* UI: list page + basic add/edit form
* Output: property value + basic summary

**Acceptance:** Create a property and view it end-to-end

---

### Phase 2 — Loan Foundation

**Goal:** Add loan + EMI

* Table: `liability_components`
* Logic: EMI (reducing + flat)
* APIs: attach/update loan, compute EMI
* UI: loan section in form + EMI preview

**Acceptance:** EMI shown correctly for a property

---

### Phase 3 — Under-Construction + Pre-EMI

**Goal:** Lifecycle support

* Fields: `property_status`, `possession_date`
* Events: `INSTALLMENT_PAYMENT`
* Logic: pre-EMI (interest-only), incremental disbursement
* UI: installment scheduler (timeline), pre-EMI preview

**Acceptance:** Installments affect loan balance and pre-EMI correctly

---

### Phase 4 — Advanced Loan (OD + Prepayment)

**Goal:** Real-world loan behavior

* Fields: `is_overdraft`, `linked_cash_unit_id`, `overdraft_mode`
* Events: `PREPAYMENT`
* Logic: overdraft interest (effective principal), schedule rebuild
* API: amortization schedule endpoint
* UI: OD toggle + impact preview

**Acceptance:** OD reduces interest dynamically; prepayment adjusts schedule

---

### Phase 5 — Projection Engine (Property-level)

**Goal:** Monthly simulation for one property

* Service: `projection_service`
* Logic per month:
  1. apply installment events
  2. update loan (pre-EMI/EMI + overdraft)
  3. apply appreciation
  4. apply rent growth
  5. compute equity and net cash flow
  6. detect rent ≥ EMI crossover
* API: `/properties/{id}/projection`

**Acceptance:** Time series returned for charts + crossover metadata

---

### Phase 6 — Visualization & Insights

**Goal:** Interactive charts + decisions

* Charts: property value, loan balance, equity, cash flow
* Marker: rent vs EMI crossover
* Controls: adjust appreciation, rent growth, rate (client-side overrides)

**Acceptance:** User can visualize future and see crossover clearly

---

## 4. Data Model (Minimal, Normalized)

### investment_units

* id
* name
* unit_type = 'property'
* property_status = `UNDER_CONSTRUCTION | READY_TO_MOVE`
* purchase_date
* possession_date (nullable)
* self_occupied (bool)
* created_at, updated_at

### asset_components

* id
* unit_id (FK)
* purchase_price
* current_market_value
* appreciation_rate_annual
* created_at, updated_at

### liability_components

* id
* unit_id (FK)
* original_loan_amount
* outstanding_balance
* interest_rate_annual
* tenure_months
* emi_type = `flat | reducing`
* pre_emi_months (derived/optional)
* is_overdraft (bool)
* linked_cash_unit_id (nullable)
* overdraft_mode = `reduce_tenure | reduce_emi`
* created_at, updated_at

### cashflow_components

* id
* unit_id (FK)
* monthly_rent
* rental_growth_rate_annual
* emi_amount (derived/cache optional)
* pre_emi_amount (derived/cache optional)
* monthly_maintenance (optional)
* created_at, updated_at

### events

* id
* unit_id (FK)
* event_type = `INSTALLMENT_PAYMENT | PREPAYMENT | SALE`
* event_date
* amount
* funding_source = `SELF | LOAN` (for INSTALLMENT_PAYMENT)
* sale_price (nullable)
* created_at, updated_at

> Rule:  **No duplication of business facts** . Derived values may be cached but must be recomputable.

---

## 5. Backend Structure (FastAPI)

```
/backend/app
  /models
  /schemas
  /services
  /api/v1
  /db
```

### Core Services

* `property_service` — CRUD + aggregate view
* `loan_service` — EMI, overdraft, amortization
* `projection_service` — monthly simulation

---

## 6. API Contracts (Core)

### Properties

* POST `/properties`
* GET `/properties`
* GET `/properties/{id}` (aggregated)
* PUT `/properties/{id}`
* DELETE `/properties/{id}`

### Events

* POST `/properties/{id}/events`
* GET `/properties/{id}/events`

### Loan

* POST `/properties/{id}/loan/rebuild-schedule`
* GET `/properties/{id}/loan/schedule`

### Projection

* GET `/properties/{id}/projection`

**Projection response (per month):**

* month
* property_value
* loan_balance
* equity
* emi
* pre_emi
* rental_income
* net_cash_flow

**Analytics (embedded or separate):**

* rent_emi_crossover: { exists, month, months_from_now, emi, rental_income }

---

## 7. Core Calculations (Deterministic)

### EMI (Reducing)

EMI = P * r * (1+r)^n / ((1+r)^n - 1), where r = annual_rate/12

### EMI (Flat)

EMI = (P + P * annual_rate * years) / months

### Pre-EMI

interest = outstanding_balance * annual_rate / 12
payment = interest only

### Overdraft

effective_principal = max(0, outstanding_balance - linked_cash_balance)
interest = effective_principal * annual_rate / 12

### Installments

* SELF: property_value += amount; (cash reduced in linked unit outside scope)
* LOAN: outstanding_balance += amount; property_value += amount

### Appreciation (monthly)

monthly_rate = (1 + annual_rate)^(1/12) - 1
property_value *= (1 + monthly_rate)

### Rent Growth (monthly)

monthly_growth = (1 + annual_growth)^(1/12) - 1
rent *= (1 + monthly_growth)

### Crossover

Find first month where rent >= EMI (only during EMI phase)

---

## 8. Frontend Structure (Next.js)

```
/frontend/app/properties
  page.tsx
  /new
  /[id]
  /[id]/edit

/frontend/components
  PropertyForm.tsx
  LoanForm.tsx
  InstallmentScheduler.tsx
  ProjectionGraph.tsx
  EMIChart.tsx
  RentEMICrossoverCard.tsx
```

### UX Rules

* Single flow for property + loan
* Progressive disclosure (construction/OD/events)
* Immediate feedback (EMI, equity, rent projection)
* Separate **value vs cash flow** clearly

---

## 9. Parallel Tracks

* Track A: Models + migrations + services
* Track B: UI pages + forms + charts (use mocked APIs initially)
* Track C: Financial logic + unit tests
* Track D: API integration + E2E checks

---

## 10. Milestones

* M1: Property CRUD end-to-end
* M2: Loan + EMI working
* M3: Construction + installments + pre-EMI
* M4: Overdraft + prepayment + schedule
* M5: Projection + charts + crossover

---

## 11. Constraints

* Deterministic calculations only
* No mixing appreciation with income
* No duplicated data across tables
* Keep APIs aggregated per property unit
* Prefer pure functions for calculations

---

## 12. init.md Integration

After each completed task, update:

* phase
* completed items
* in-progress items
* blockers
* next tasks

On restart:

1. Read `init.md`
2. Resume from next pending task
