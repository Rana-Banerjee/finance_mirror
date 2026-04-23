"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import InstallmentScheduler from "../../../components/InstallmentScheduler"
import PropertyCharts from "../../../components/PropertyCharts"

interface Asset {
  id: number
  component_type: string
  base_value: number
  current_value: number
  appreciation_rate: number
}

interface Loan {
  id: number
  original_loan_amount: number
  outstanding_balance: number
  interest_rate_annual: number
  tenure_months: number
  emi_type: string
  pre_emi_months: number
  is_overdraft: boolean
  linked_cash_unit_id: number | null
  overdraft_mode: string
  emi_amount: number | null
  pre_emi_amount: number | null
}

interface Cashflow {
  monthly_rent: number
  rental_growth_rate_annual: number
  monthly_maintenance: number
}

interface ProjectionRow {
  month: number
  date: string
  property_value: number
  loan_balance: number
  equity: number
  monthly_rent: number
  monthly_maintenance: number
  emi_payment: number
  interest_payment: number
  principal_payment: number
  net_cashflow: number
  phase: string
  effective_principal: number
  is_crossover: boolean
}

interface Projection {
  property_id: number
  projection_months: number
  rent_vs_emi_crossover_month: number | null
  loan_paid_off_month: number | null
  rows: ProjectionRow[]
}

interface Property {
  id: number
  name: string
  status: string
  property_value: number
  purchase_date: string | null
  possession_date: string | null
  created_at: string
  assets: Asset[]
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loan, setLoan] = useState<Loan | null>(null)
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [projection, setProjection] = useState<Projection | null>(null)
  const [showProjection, setShowProjection] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id
    if (id) {
      axios.get(`http://localhost:8000/api/v1/properties/${id}`)
        .then(res => setProperty(res.data))
        .finally(() => setLoading(false))
      axios.get(`http://localhost:8000/api/v1/properties/${id}/loan`)
        .then(res => setLoan(res.data))
        .catch(() => {})
      axios.get(`http://localhost:8000/api/v1/properties/${id}/cashflow`)
        .then(res => setCashflow(res.data))
        .catch(() => {})
      if (showProjection) {
        axios.get(`http://localhost:8000/api/v1/properties/${id}/projection`)
          .then(res => setProjection(res.data))
          .catch(() => {})
      }
    }
  }, [params.id, showProjection])

  if (loading) return <p>Loading...</p>
  if (!property) return <p>Property not found</p>

  return (
    <main>
      <header style={{ marginBottom: 20 }}>
        <Link href="/properties" style={{ color: "#0070f3" }}>← Back to Properties</Link>
      </header>

      <h1>{property.name}</h1>
      <p>Status: {property.status}</p>
      <p>Value: ₹{Number(property.property_value).toLocaleString()}</p>
      <p>Purchase Date: {property.purchase_date || "—"}</p>
      <p>Possession Date: {property.possession_date || "—"}</p>

      <div style={{ marginTop: 20, marginBottom: 10 }}>
        <Link href={`/properties/${property.id}/edit`}>
          <button style={{ padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
            Edit Property
          </button>
        </Link>
      </div>

      {loan && (
        <section style={{ marginTop: 20, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <h2>Loan Details</h2>
          <p>Original Loan: ₹{Number(loan.original_loan_amount).toLocaleString()}</p>
          <p>Outstanding Balance: ₹{Number(loan.outstanding_balance).toLocaleString()}</p>
          <p>Interest Rate: {Number(loan.interest_rate_annual) * 100}% p.a.</p>
          <p>Tenure: {loan.tenure_months} months</p>
          <p>EMI Type: {loan.emi_type}</p>
          {loan.emi_amount && <p><strong>EMI: ₹{Number(loan.emi_amount).toLocaleString()}/mo</strong></p>}
          {loan.pre_emi_amount && <p>Pre-EMI: ₹{Number(loan.pre_emi_amount).toLocaleString()}/mo</p>}
          {loan.is_overdraft && (
            <>
              <p><em>Overdraft: Yes</em></p>
              <p>Overdraft Mode: {loan.overdraft_mode}</p>
              {loan.linked_cash_unit_id && <p>Linked Cash Unit ID: {loan.linked_cash_unit_id}</p>}
            </>
          )}
        </section>
      )}

      {cashflow && (
        <section style={{ marginTop: 20, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <h2>Cashflow Details</h2>
          <p>Monthly Rent: ₹{Number(cashflow.monthly_rent).toLocaleString()}</p>
          <p>Rental Growth Rate: {Number(cashflow.rental_growth_rate_annual) * 100}% p.a.</p>
          <p>Monthly Maintenance: ₹{Number(cashflow.monthly_maintenance).toLocaleString()}</p>
          <p>Net Monthly Cashflow: ₹{Number(cashflow.monthly_rent - cashflow.monthly_maintenance).toLocaleString()}</p>
        </section>
      )}

      {property.assets.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2>Assets</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Base Value</th>
                <th style={{ padding: 8 }}>Current Value</th>
                <th style={{ padding: 8 }}>Appreciation Rate</th>
              </tr>
            </thead>
            <tbody>
              {property.assets.map(asset => (
                <tr key={asset.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{asset.component_type}</td>
                  <td style={{ padding: 8 }}>₹{Number(asset.base_value).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>₹{Number(asset.current_value).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{Number(asset.appreciation_rate) * 100}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <InstallmentScheduler propertyId={property.id} propertyStatus={property.status} />

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => setShowProjection(!showProjection)}
          style={{ padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {showProjection ? "Hide Projection" : "Show Projection"}
        </button>
      </div>

      {showProjection && projection && (
        <section style={{ marginTop: 20, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <h2>Projection Summary</h2>
          <p>Projection Period: {projection.projection_months} months</p>
          {projection.rent_vs_emi_crossover_month && (
            <p><strong>Rent ≥ EMI Crossover: Month {projection.rent_vs_emi_crossover_month}</strong></p>
          )}
          {projection.loan_paid_off_month && (
            <p><strong>Loan Paid Off: Month {projection.loan_paid_off_month}</strong></p>
          )}

          <PropertyCharts
            rows={projection.rows}
            rentVsEmiCrossoverMonth={projection.rent_vs_emi_crossover_month}
            loanPaidOffMonth={projection.loan_paid_off_month}
          />

          <div style={{ marginTop: 16, maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", position: "sticky", top: 0, background: "#f5f5f5" }}>
                  <th style={{ padding: 6 }}>Month</th>
                  <th style={{ padding: 6 }}>Date</th>
                  <th style={{ padding: 6 }}>Property Value</th>
                  <th style={{ padding: 6 }}>Loan Balance</th>
                  <th style={{ padding: 6 }}>Equity</th>
                  <th style={{ padding: 6 }}>Rent</th>
                  <th style={{ padding: 6 }}>EMI</th>
                  <th style={{ padding: 6 }}>Interest</th>
                  <th style={{ padding: 6 }}>Principal</th>
                  <th style={{ padding: 6 }}>Net CF</th>
                  <th style={{ padding: 6 }}>Phase</th>
                </tr>
              </thead>
              <tbody>
                {projection.rows.map(row => (
                  <tr key={row.month} style={{ borderBottom: "1px solid #eee", background: row.is_crossover ? "#e8f5e9" : undefined }}>
                    <td style={{ padding: 6 }}>{row.month}</td>
                    <td style={{ padding: 6 }}>{row.date}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.property_value).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.loan_balance).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.equity).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.monthly_rent).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.emi_payment).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.interest_payment).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>₹{Number(row.principal_payment).toLocaleString()}</td>
                    <td style={{ padding: 6, color: row.net_cashflow >= 0 ? "green" : "red" }}>₹{Number(row.net_cashflow).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>{row.phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}