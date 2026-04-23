# init.md — Property Investment Module

> Track execution state for resume-ability. Update after each completed task.

## Current Phase

**Phase:** 6 — Visualization — **COMPLETED**

## Completed Items

- Set up project structure (backend + frontend directories)
- Install dependencies and verify dev servers run
- Create database models (investment_units, asset_components)
- Implement Property CRUD APIs
- Create frontend property list page + form
- Verify end-to-end flow (lint + typecheck pass)
- **Fix:** Upgraded Next.js 14.2.3 → 15.5.15 for Node 22 compatibility
- Add delete button to property list (with cascade delete via `cascade="all, delete-orphan"`)
- **Phase 2 — Loan Foundation:**
  - `liability_components` model with EMI (reducing/flat), pre-EMI support
  - Loan CRUD APIs with automatic EMI calculation
  - Loan section in property detail + edit pages
  - EMI preview calculator endpoint (`POST /api/v1/emi/calculate`)
  - Consolidated model files: `property.py` (InvestmentUnit, AssetComponent), `loan.py` (LiabilityComponent)
  - Model refactor: removed duplicate class definitions, `InvestmentUnit` has `liabilities` relationship
- **Phase 3 — Under-Construction + Pre-EMI:**
  - `events` model (INSTALLMENT_PAYMENT, PREPAYMENT, SALE) with timeline CRUD API
  - `cashflow_components` model (monthly_rent, rental_growth, maintenance)
  - Cashflow CRUD API under `/properties/{id}/cashflow`
  - `build_loan_schedule()` in loan_service — pre-EMI (interest-only) + EMI phases with amortization table
  - `GET /api/v1/properties/{id}/loan/schedule` endpoint returning full amortization timeline
  - `InstallmentScheduler` frontend component with timeline visualization and event add/delete
  - Cashflow section in property edit page (rent, growth rate, maintenance)
- **Phase 4 — Advanced Loan (OD + Prepayment):**
  - Added `linked_cash_unit_id`, `overdraft_mode` to LiabilityComponent model
  - Updated loan schemas with OD fields (is_overdraft, linked_cash_unit_id, overdraft_mode)
  - `POST /api/v1/properties/{id}/loan/rebuild-schedule` endpoint
  - `rebuild_loan_schedule()` service function with overdraft effective_principal logic
  - Prepayment events reduce balance; `reduce_tenure` mode recalculates EMI
  - Frontend loan form: OD toggle, linked_cash_unit_id, overdraft_mode selector
  - Property detail page shows overdraft info
  - **Bug fix:** Added missing `linked_cash_unit_id` and `overdraft_mode` columns to SQLite DB
  - **Bug fix:** Fixed `overdraft_mode` in LiabilityComponentResponse from non-nullable `str` to `Optional[str]`
  - **Bug fix:** Added Cashflow section to property detail page (API fetch + display)
- **Phase 5 — Projection Engine:**
  - `projection_service.py` with monthly simulation: appreciation, rent growth, loan amortization, equity, net cashflow
  - Detects rent ≥ EMI crossover month and loan paid-off month
  - `GET /api/v1/properties/{id}/projection` endpoint with optional `months` query param
  - Projection schema (`ProjectionRow`, `ProjectionResponse`)
  - Frontend: "Show Projection" button on property detail page with scrollable table
  - Net cashflow (green/red), crossover row highlighted in green
- **Phase 6 — Visualization:**
  - `PropertyCharts` component with 3 togglable charts: Property Value & Equity, Cashflow Analysis, EMI Breakdown
  - All 3 charts use recharts (Area, Line, Bar, ComposedChart)
  - Dashboard page (`/dashboard`) with portfolio summary cards (total value, equity, loan, rent, net CF)
  - Per-property summary table with equity/loan/rent metrics
  - Portfolio-wide charts: equity vs loan by property, monthly cashflow by property
  - Nav bar with Properties and Dashboard links
  - Backend lint (ruff) + typecheck (mypy) pass, frontend build pass

## In Progress Items

- None yet

## Blockers

- None yet

## Next Tasks

1. All 6 phases complete — Module is feature-complete

---

## Status History

| Date | Phase | Completed | Notes |
|------|-------|----------|------|
| 2026-04-23 | 2 | (all tasks) | Loan Foundation complete: liability CRUD, EMI calc, frontend loan forms |
| 2026-04-23 | 3 | (all tasks) | Under-Construction + Pre-EMI: events, cashflow, loan schedule, timeline UI |
| 2026-04-23 | 4 | (all tasks) | Advanced Loan: OD fields, linked_cash, rebuild-schedule, prepayments, frontend OD toggle |
| 2026-04-23 | 6 | (all tasks) | Visualization: charts component, dashboard page, portfolio summary, nav bar |

(End of file - total 54 lines)