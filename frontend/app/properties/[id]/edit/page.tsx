"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"

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
}

interface Cashflow {
  id: number
  monthly_rent: number
  rental_growth_rate_annual: number
  monthly_maintenance: number
}

interface Property {
  id: number
  name: string
  status: string
  property_value: number
  purchase_date: string | null
  possession_date: string | null
}

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<Property | null>(null)
  const [loanData, setLoanData] = useState<Loan | null>(null)
  const [cashflowData, setCashflowData] = useState<Cashflow | null>(null)
  const [hasLoan, setHasLoan] = useState(false)
  const [hasCashflow, setHasCashflow] = useState(false)
  const [cashflowForm, setCashflowForm] = useState({
    monthly_rent: "",
    rental_growth_rate_annual: "",
    monthly_maintenance: "",
  })
  const [loanForm, setLoanForm] = useState({
    original_loan_amount: "",
    outstanding_balance: "",
    interest_rate_annual: "",
    tenure_months: "",
    emi_type: "REDUCING",
    pre_emi_months: "0",
    is_overdraft: false,
    linked_cash_unit_id: "",
    overdraft_mode: "reduce_tenure",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = params.id
    if (id) {
      axios.get(`http://localhost:8000/api/v1/properties/${id}`)
        .then(res => {
          const data = res.data
          setFormData({
            id: data.id,
            name: data.name,
            status: data.status,
            property_value: data.property_value,
            purchase_date: data.purchase_date,
            possession_date: data.possession_date,
          })
        })
      axios.get(`http://localhost:8000/api/v1/properties/${id}/loan`)
        .then(res => {
          setLoanData(res.data)
          setHasLoan(true)
          setLoanForm({
            original_loan_amount: String(res.data.original_loan_amount),
            outstanding_balance: String(res.data.outstanding_balance),
            interest_rate_annual: String(res.data.interest_rate_annual),
            tenure_months: String(res.data.tenure_months),
            emi_type: res.data.emi_type,
            pre_emi_months: String(res.data.pre_emi_months),
            is_overdraft: res.data.is_overdraft,
            linked_cash_unit_id: res.data.linked_cash_unit_id ? String(res.data.linked_cash_unit_id) : "",
            overdraft_mode: res.data.overdraft_mode || "reduce_tenure",
          })
        })
        .catch(() => setHasLoan(false))
        .finally(() => setLoading(false))
      axios.get(`http://localhost:8000/api/v1/properties/${id}/cashflow`)
        .then(res => {
          setCashflowData(res.data)
          setHasCashflow(true)
          setCashflowForm({
            monthly_rent: String(res.data.monthly_rent),
            rental_growth_rate_annual: String(res.data.rental_growth_rate_annual),
            monthly_maintenance: String(res.data.monthly_maintenance),
          })
        })
        .catch(() => setHasCashflow(false))
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      await axios.patch(`http://localhost:8000/api/v1/properties/${params.id}`, formData)
      if (hasLoan) {
        const loanPayload = {
          original_loan_amount: parseFloat(loanForm.original_loan_amount),
          outstanding_balance: parseFloat(loanForm.outstanding_balance),
          interest_rate_annual: parseFloat(loanForm.interest_rate_annual),
          tenure_months: parseInt(loanForm.tenure_months),
          emi_type: loanForm.emi_type,
          pre_emi_months: parseInt(loanForm.pre_emi_months),
          is_overdraft: loanForm.is_overdraft,
          linked_cash_unit_id: loanForm.linked_cash_unit_id ? parseInt(loanForm.linked_cash_unit_id) : null,
          overdraft_mode: loanForm.overdraft_mode,
        }
        if (loanData) {
          await axios.patch(`http://localhost:8000/api/v1/properties/${params.id}/loan`, loanPayload)
        } else {
          await axios.post(`http://localhost:8000/api/v1/properties/${params.id}/loan`, loanPayload)
        }
      } else if (loanData) {
        await axios.delete(`http://localhost:8000/api/v1/properties/${params.id}/loan`)
      }
      if (hasCashflow) {
        const cashflowPayload = {
          monthly_rent: parseFloat(cashflowForm.monthly_rent) || 0,
          rental_growth_rate_annual: parseFloat(cashflowForm.rental_growth_rate_annual) || 0,
          monthly_maintenance: parseFloat(cashflowForm.monthly_maintenance) || 0,
        }
        if (cashflowData) {
          await axios.patch(`http://localhost:8000/api/v1/properties/${params.id}/cashflow`, cashflowPayload)
        } else {
          await axios.post(`http://localhost:8000/api/v1/properties/${params.id}/cashflow`, cashflowPayload)
        }
      }
      router.push(`/properties/${params.id}`)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (!formData) return <p>Property not found</p>

  return (
    <main>
      <header style={{ marginBottom: 20 }}>
        <Link href={`/properties/${params.id}`} style={{ color: "#0070f3" }}>← Back to Property</Link>
      </header>

      <h1>Edit Property</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>
        <label>
          Name
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Status
          <select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="READY">Ready</option>
            <option value="UNDER_CONSTRUCTION">Under Construction</option>
          </select>
        </label>

        <label>
          Property Value (₹)
          <input
            type="number"
            step="0.01"
            value={formData.property_value}
            onChange={e => setFormData({ ...formData, property_value: parseFloat(e.target.value) })}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Purchase Date
          <input
            type="date"
            value={formData.purchase_date || ""}
            onChange={e => setFormData({ ...formData, purchase_date: e.target.value || null })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Possession Date
          <input
            type="date"
            value={formData.possession_date || ""}
            onChange={e => setFormData({ ...formData, possession_date: e.target.value || null })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={saving} style={{ padding: "10px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Update Property"}
        </button>
      </form>

      <hr style={{ margin: "24px 0" }} />

      <h2>Loan Details</h2>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={hasLoan}
          onChange={e => setHasLoan(e.target.checked)}
        />
        Has Loan
      </label>

      {hasLoan && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
          <label>
            Original Loan Amount (₹)
            <input type="number" step="0.01" value={loanForm.original_loan_amount}
              onChange={e => setLoanForm({ ...loanForm, original_loan_amount: e.target.value })} required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Outstanding Balance (₹)
            <input type="number" step="0.01" value={loanForm.outstanding_balance}
              onChange={e => setLoanForm({ ...loanForm, outstanding_balance: e.target.value })} required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Interest Rate (% p.a.)
            <input type="number" step="0.0001" value={loanForm.interest_rate_annual}
              onChange={e => setLoanForm({ ...loanForm, interest_rate_annual: e.target.value })} required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Tenure (months)
            <input type="number" value={loanForm.tenure_months}
              onChange={e => setLoanForm({ ...loanForm, tenure_months: e.target.value })} required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            EMI Type
            <select value={loanForm.emi_type} onChange={e => setLoanForm({ ...loanForm, emi_type: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}>
              <option value="REDUCING">Reducing Balance</option>
              <option value="FLAT">Flat Rate</option>
            </select>
          </label>
          <label>
            Pre-EMI Months
            <input type="number" value={loanForm.pre_emi_months}
              onChange={e => setLoanForm({ ...loanForm, pre_emi_months: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={loanForm.is_overdraft}
              onChange={e => setLoanForm({ ...loanForm, is_overdraft: e.target.checked })} />
            Overdraft Loan
          </label>
          {loanForm.is_overdraft && (
            <>
              <label>
                Linked Cash Unit ID
                <input type="number" value={loanForm.linked_cash_unit_id}
                  onChange={e => setLoanForm({ ...loanForm, linked_cash_unit_id: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
              </label>
              <label>
                Overdraft Mode
                <select value={loanForm.overdraft_mode}
                  onChange={e => setLoanForm({ ...loanForm, overdraft_mode: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}>
                  <option value="reduce_tenure">Reduce Tenure</option>
                  <option value="reduce_emi">Reduce EMI</option>
                </select>
              </label>
            </>
          )}
          <button type="submit" disabled={saving} style={{ padding: "10px 16px", background: "#28a745", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : loanData ? "Update Loan" : "Add Loan"}
          </button>
        </form>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>Rental Income</h2>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={hasCashflow}
          onChange={e => setHasCashflow(e.target.checked)}
        />
        Has Rental Income
      </label>

      {hasCashflow && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
          <label>
            Monthly Rent (₹)
            <input type="number" step="0.01" value={cashflowForm.monthly_rent}
              onChange={e => setCashflowForm({ ...cashflowForm, monthly_rent: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Rental Growth Rate (% p.a.)
            <input type="number" step="0.01" value={cashflowForm.rental_growth_rate_annual}
              onChange={e => setCashflowForm({ ...cashflowForm, rental_growth_rate_annual: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Monthly Maintenance (₹)
            <input type="number" step="0.01" value={cashflowForm.monthly_maintenance}
              onChange={e => setCashflowForm({ ...cashflowForm, monthly_maintenance: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <button type="submit" disabled={saving} style={{ padding: "10px 16px", background: "#6f42c1", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : cashflowData ? "Update Cashflow" : "Add Cashflow"}
          </button>
        </form>
      )}
    </main>
  )
}