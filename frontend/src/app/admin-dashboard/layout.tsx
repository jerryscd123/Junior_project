import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { AdminLayoutClient } from "@/components/admin-layout-client"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin management system",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
