"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"

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
        .finally(() => setLoading(false))
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      await axios.patch(`http://localhost:8000/api/v1/properties/${params.id}`, formData)
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
    </main>
  )
}