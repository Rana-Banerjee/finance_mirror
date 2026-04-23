"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts"

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
  emi_amount: number | null
}

interface Cashflow {
  monthly_rent: number
  monthly_maintenance: number
}

interface Property {
  id: number
  name: string
  status: string
  property_value: number
  assets: Asset[]
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loans, setLoans] = useState<Record<number, Loan>>({})
  const [cashflows, setCashflows] = useState<Record<number, Cashflow>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/properties")
      .then(async res => {
        const props = res.data as Property[]
        setProperties(props)
        const loanResults: Record<number, Loan> = {}
        const cfResults: Record<number, Cashflow> = {}
        await Promise.allSettled(props.map(p =>
          Promise.all([
            axios.get(`http://localhost:8000/api/v1/properties/${p.id}/loan`)
              .then(r => { loanResults[p.id] = r.data })
              .catch(() => {}),
            axios.get(`http://localhost:8000/api/v1/properties/${p.id}/cashflow`)
              .then(r => { cfResults[p.id] = r.data })
              .catch(() => {}),
          ])
        ))
        setLoans(loanResults)
        setCashflows(cfResults)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalValue = properties.reduce((s, p) => s + Number(p.property_value), 0)
  const totalLoan = Object.values(loans).reduce((s, l) => s + Number(l.outstanding_balance), 0)
  const totalRent = Object.values(cashflows).reduce((s, c) => s + Number(c.monthly_rent), 0)
  const totalMaintenance = Object.values(cashflows).reduce((s, c) => s + Number(c.monthly_maintenance), 0)
  const totalEquity = totalValue - totalLoan
  const totalMonthlyCF = totalRent - totalMaintenance

  const formatINR = (v: number) => `₹${(v / 100000).toFixed(1)}L`

  if (loading) return <p>Loading...</p>

  return (
    <main>
      <header style={{ marginBottom: 20 }}>
        <Link href="/properties" style={{ color: "#0070f3" }}>← Back to Properties</Link>
      </header>

      <h1 style={{ marginBottom: 20 }}>Portfolio Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Property Value", value: formatINR(totalValue), color: "#1976d2" },
          { label: "Total Loan Outstanding", value: formatINR(totalLoan), color: "#d32f2f" },
          { label: "Total Equity", value: formatINR(totalEquity), color: "#388e3c" },
          { label: "Total Monthly Rent", value: formatINR(totalRent), color: "#7b1fa2" },
          { label: "Total Maintenance", value: formatINR(totalMaintenance), color: "#ff7043" },
          { label: "Net Monthly Cashflow", value: formatINR(totalMonthlyCF), color: totalMonthlyCF >= 0 ? "#388e3c" : "#d32f2f" },
        ].map(m => (
          <div key={m.label} style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, borderLeft: `4px solid ${m.color}` }}>
            <div style={{ fontSize: 12, color: "#666" }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 12 }}>Property Summary</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Property</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Value</th>
            <th style={{ padding: 8 }}>Loan</th>
            <th style={{ padding: 8 }}>Equity</th>
            <th style={{ padding: 8 }}>Rent</th>
            <th style={{ padding: 8 }}>Net CF</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(p => {
            const loan = loans[p.id]
            const cf = cashflows[p.id]
            const value = Number(p.property_value)
            const loanBal = loan ? Number(loan.outstanding_balance) : 0
            const equity = value - loanBal
            const rent = cf ? Number(cf.monthly_rent) : 0
            const maint = cf ? Number(cf.monthly_maintenance) : 0
            const net = rent - maint
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <Link href={`/properties/${p.id}`} style={{ color: "#0070f3" }}>{p.name}</Link>
                </td>
                <td style={{ padding: 8 }}>{p.status}</td>
                <td style={{ padding: 8 }}>₹{value.toLocaleString()}</td>
                <td style={{ padding: 8, color: loanBal > 0 ? "#d32f2f" : "#388e3c" }}>₹{loanBal.toLocaleString()}</td>
                <td style={{ padding: 8, color: "#388e3c" }}>₹{equity.toLocaleString()}</td>
                <td style={{ padding: 8 }}>₹{rent.toLocaleString()}</td>
                <td style={{ padding: 8, color: net >= 0 ? "#388e3c" : "#d32f2f" }}>₹{net.toLocaleString()}</td>
                <td style={{ padding: 8 }}>
                  <Link href={`/properties/${p.id}`} style={{ color: "#0070f3" }}>View</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {properties.length > 0 && (
        <>
          <h2 style={{ marginBottom: 12 }}>Portfolio Equity vs Loan Balance</h2>
          <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={properties.map(p => {
                const loan = loans[p.id]
                const value = Number(p.property_value)
                const loanBal = loan ? Number(loan.outstanding_balance) : 0
                return { name: p.name, value, loan: loanBal, equity: value - loanBal }
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number, n: string) => [`₹${v.toLocaleString()}`, n]} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="value" fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} name="Property Value" />
                <Line type="monotone" dataKey="loan" stroke="#d32f2f" strokeWidth={2} dot={{ r: 4 }} name="Loan Balance" />
                <Line type="monotone" dataKey="equity" stroke="#388e3c" strokeWidth={2} dot={{ r: 4 }} name="Equity" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <h2 style={{ marginBottom: 12, marginTop: 24 }}>Monthly Cashflow by Property</h2>
          <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={properties.map(p => {
                const cf = cashflows[p.id]
                const rent = cf ? Number(cf.monthly_rent) : 0
                const maint = cf ? Number(cf.monthly_maintenance) : 0
                return { name: p.name, rent, maintenance: maint, net: rent - maint }
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number, n: string) => [`₹${v.toLocaleString()}`, n]} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="rent" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} name="Rent" />
                <Line type="monotone" dataKey="net" stroke="#388e3c" strokeWidth={2} dot={{ r: 4 }} name="Net Cashflow" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </main>
  )
}