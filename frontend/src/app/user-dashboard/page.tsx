import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Dashboard",
  description: "Your personal dashboard for managing activities and accessing resources",
}

export default function UserDashboard() {
  redirect("/user-dashboard/feed")
} 