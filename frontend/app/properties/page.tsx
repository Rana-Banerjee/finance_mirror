"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"

interface Property {
  id: number
  name: string
  status: string
  property_value: number
  purchase_date: string | null
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/properties")
      .then(res => setProperties(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Properties</h1>
        <Link href="/properties/new">
          <button style={{ padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
            + Add Property
          </button>
        </Link>
      </header>

      {properties.length === 0 ? (
        <p>No properties yet. Add your first property to get started.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Value</th>
              <th style={{ padding: 8 }}>Purchase Date</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(property => (
              <tr key={property.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <Link href={`/properties/${property.id}`}>{property.name}</Link>
                </td>
                <td style={{ padding: 8 }}>{property.status}</td>
                <td style={{ padding: 8 }}>₹{Number(property.property_value).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{property.purchase_date || "—"}</td>
                <td style={{ padding: 8 }}>
                  <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}