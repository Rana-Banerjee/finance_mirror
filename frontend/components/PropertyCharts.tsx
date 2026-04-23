"use client"

import { useState } from "react"
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
  Bar,
} from "recharts"

interface ChartRow {
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

interface PropertyChartsProps {
  rows: ChartRow[]
  rentVsEmiCrossoverMonth: number | null
  loanPaidOffMonth: number | null
}

export default function PropertyCharts({ rows, rentVsEmiCrossoverMonth, loanPaidOffMonth }: PropertyChartsProps) {
  const [activeChart, setActiveChart] = useState<"value" | "cashflow" | "breakdown">("value")

  const formatINR = (value: number) =>
    `₹${(value / 100000).toFixed(1)}L`

  const formatINRFull = (value: number) =>
    `₹${value.toLocaleString()}`

  const tooltipFormatter = (value: number, name: string) => [formatINRFull(value), name]

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["value", "cashflow", "breakdown"] as const).map(chart => (
          <button
            key={chart}
            onClick={() => setActiveChart(chart)}
            style={{
              padding: "6px 12px",
              background: activeChart === chart ? "#0070f3" : "#e0e0e0",
              color: activeChart === chart ? "white" : "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {chart === "value" ? "Property Value & Equity" : chart === "cashflow" ? "Cashflow Analysis" : "EMI Breakdown"}
          </button>
        ))}
      </div>

      {activeChart === "value" && (
        <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginBottom: 8 }}>Property Value, Loan Balance & Equity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                label={{ value: "Month", position: "insideBottom", offset: -5, fontSize: 11 }}
              />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="property_value" fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} name="Property Value" />
              <Line type="monotone" dataKey="loan_balance" stroke="#d32f2f" strokeWidth={2} dot={false} name="Loan Balance" />
              <Line type="monotone" dataKey="equity" stroke="#388e3c" strokeWidth={2} dot={false} name="Equity" />
              {rentVsEmiCrossoverMonth && (
                <Line
                  type="monotone"
                  dataKey={() => rows.find(r => r.month === rentVsEmiCrossoverMonth)?.property_value}
                  stroke="#4caf50"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Crossover (M${rentVsEmiCrossoverMonth})`}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Area = Property Value, Red Line = Loan Balance, Green Line = Equity
          </p>
        </div>
      )}

      {activeChart === "cashflow" && (
        <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginBottom: 8 }}>Monthly Cashflow: Rent vs Net Cashflow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                label={{ value: "Month", position: "insideBottom", offset: -5, fontSize: 11 }}
              />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="monthly_rent" fill="#1976d2" name="Monthly Rent" />
              <Bar dataKey="monthly_maintenance" fill="#ff7043" name="Maintenance" />
              <Line type="monotone" dataKey="net_cashflow" stroke="#4caf50" strokeWidth={2} dot={false} name="Net Cashflow" />
              <Line
                type="monotone"
                dataKey="emi_payment"
                stroke="#d32f2f"
                strokeWidth={2}
                dot={false}
                name="EMI Payment"
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Bars = Rent (blue) & Maintenance (orange), Line = Net Cashflow, Dashed = EMI
          </p>
        </div>
      )}

      {activeChart === "breakdown" && (
        <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginBottom: 8 }}>EMI Breakdown: Interest vs Principal Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                label={{ value: "Month", position: "insideBottom", offset: -5, fontSize: 11 }}
              />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="interest_payment" fill="#ff9800" stackId="emi" name="Interest" />
              <Bar dataKey="principal_payment" fill="#4caf50" stackId="emi" name="Principal" />
              <Line type="monotone" dataKey="emi_payment" stroke="#d32f2f" strokeWidth={2} dot={false} name="Total EMI" />
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Stacked bars = Interest (orange) + Principal (green) = EMI, Red line = Total EMI
          </p>
        </div>
      )}
    </div>
  )
}