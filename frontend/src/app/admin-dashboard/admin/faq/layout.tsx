import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ Management | Admin Dashboard",
  description: "Manage frequently asked questions on the platform",
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 