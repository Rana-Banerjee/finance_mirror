"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface Event {
  id: number
  event_type: string
  event_date: string
  amount: number
  funding_source: string | null
  notes: string | null
}

interface InstallmentSchedulerProps {
  propertyId: number
  propertyStatus: string
}

export default function InstallmentScheduler({ propertyId, propertyStatus }: InstallmentSchedulerProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    event_type: "INSTALLMENT_PAYMENT",
    event_date: "",
    amount: "",
    funding_source: "SELF",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchEvents = () => {
    axios.get(`http://localhost:8000/api/v1/properties/${propertyId}/events`)
      .then(res => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvents()
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post(`http://localhost:8000/api/v1/properties/${propertyId}/events`, {
        ...form,
        amount: parseFloat(form.amount),
      })
      setForm({ event_type: "INSTALLMENT_PAYMENT", event_date: "", amount: "", funding_source: "SELF", notes: "" })
      setShowForm(false)
      fetchEvents()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/v1/properties/${propertyId}/events/${eventId}`)
      fetchEvents()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <p>Loading events...</p>

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Installment Timeline</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500, background: "#f5f5f5", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label>
            Event Type
            <select
              value={form.event_type}
              onChange={e => setForm({ ...form, event_type: e.target.value })}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            >
              <option value="INSTALLMENT_PAYMENT">Installment Payment</option>
              <option value="PREPAYMENT">Prepayment</option>
              <option value="SALE">Sale</option>
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.event_date}
              onChange={e => setForm({ ...form, event_date: e.target.value })}
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Amount (₹)
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          {form.event_type === "INSTALLMENT_PAYMENT" && (
            <label>
              Funding Source
              <select
                value={form.funding_source}
                onChange={e => setForm({ ...form, funding_source: e.target.value })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
              >
                <option value="SELF">Self</option>
                <option value="LOAN">Loan</option>
              </select>
            </label>
          )}
          <label>
            Notes
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={saving} style={{ padding: "10px 16px", background: "#28a745", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Add Event"}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <p style={{ color: "#666" }}>No events recorded. Add an installment to track payments.</p>
      ) : (
        <div style={{ position: "relative", paddingLeft: 20 }}>
          <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#ddd" }} />
          {events.map((event, idx) => (
            <div key={event.id} style={{ position: "relative", marginBottom: 16, paddingLeft: 16 }}>
              <div style={{ position: "absolute", left: -16, top: 8, width: 12, height: 12, borderRadius: "50%", background: event.event_type === "INSTALLMENT_PAYMENT" ? "#0070f3" : event.event_type === "PREPAYMENT" ? "#e67e22" : "#27ae60", border: "2px solid white" }} />
              <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{event.event_type.replace("_", " ")}</strong>
                    <span style={{ marginLeft: 8, color: "#666", fontSize: 14 }}>{event.event_date}</span>
                    {event.funding_source && (
                      <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 6px", background: event.funding_source === "LOAN" ? "#e8f5e9" : "#e3f2fd", borderRadius: 4, color: event.funding_source === "LOAN" ? "#2e7d32" : "#1565c0" }}>
                        {event.funding_source}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: "bold" }}>₹{Number(event.amount).toLocaleString()}</span>
                    <button
                      onClick={() => handleDelete(event.id)}
                      style={{ padding: "4px 8px", background: "#dc3545", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {event.notes && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{event.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}