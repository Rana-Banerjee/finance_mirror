import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "Property Investment",
  description: "Property Investment Module",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #eee", marginBottom: 16 }}>
          <Link href="/properties">Properties</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}