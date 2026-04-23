"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

interface Asset {
  component_type: string
  base_value: number
  appreciation_rate: number
}

export default function NewPropertyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    status: "READY",
    property_value: "",
    purchase_date: "",
    possession_date: "",
  })
  const [assets, setAssets] = useState<Asset[]>([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post("http://localhost:8000/api/v1/properties", {
        ...formData,
        property_value: parseFloat(formData.property_value),
        assets,
      })
      router.push("/properties")
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <main>
      <h1>Add Property</h1>
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
            onChange={e => setFormData({ ...formData, property_value: e.target.value })}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Purchase Date
          <input
            type="date"
            value={formData.purchase_date}
            onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Possession Date
          <input
            type="date"
            value={formData.possession_date}
            onChange={e => setFormData({ ...formData, possession_date: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={saving} style={{ padding: "10px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Save Property"}
        </button>
      </form>
    </main>
  )
}