import { redirect } from 'next/navigation'

export default function AdminDashboard() {
  // Redirect to the main admin dashboard page
  redirect('/admin-dashboard/admin/dashboard')
} 