"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"

interface Asset {
  id: number
  component_type: string
  base_value: number
  current_value: number
  appreciation_rate: number
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id
    if (id) {
      axios.get(`http://localhost:8000/api/v1/properties/${id}`)
        .then(res => setProperty(res.data))
        .finally(() => setLoading(false))
    }
  }, [params.id])

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
    </main>
  )
}