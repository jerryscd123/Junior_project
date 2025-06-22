"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, Clock, Users, Bell, MessageSquare, ChevronLeft, X, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import logo  from "@/assets/admin.png"
import Image from "next/image"

const sidebarItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard/admin/dashboard" },
  { title: "Pending Posts", icon: Clock, href: "/admin-dashboard/admin/approval" },
  { title: "User Management", icon: Users, href: "/admin-dashboard/admin/user-management" },
  { title: "Notifications", icon: Bell, href: "/admin-dashboard/admin/notification" },
  { title: "Contact Us", icon: MessageSquare, href: "/admin-dashboard/admin/contact" },
  { title: "FAQ Management", icon: BookOpen, href: "/admin-dashboard/admin/faq" },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AdminSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isMobile ? (isOpen ? 0 : -280) : 0,
          width: isMobile ? 280 : collapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-full bg-white/90 backdrop-blur-xl border-r border-white/30 shadow-2xl z-50",
          "flex flex-col pt-16",
        )}
      >
        {/* Top Controls Bar */}
        <motion.div className="flex items-center justify-between h-12 px-4 border-b border-white/10" layout>
          {/* Collapse Toggle - Desktop Only */}
          {!isMobile && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 bg-white/50 hover:bg-white/70 transition-all duration-300 rounded-xl border border-white/30 shadow-lg hover:shadow-xl"
                onClick={onToggleCollapse}
              >
                <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronLeft size={16} className="text-gray-600" />
                </motion.div>
              </Button>
            </motion.div>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-9 h-9 bg-white/50 hover:bg-red-50 hover:text-red-600 transition-all duration-300 rounded-xl border border-white/30 shadow-lg"
              >
                <X size={16} />
              </Button>
            </motion.div>
          )}

          {/* Spacer for alignment */}
          <div></div>
        </motion.div>

        {/* Logo and Title Section */}
        <motion.div className={cn("flex flex-col items-center py-6 px-4", collapsed && !isMobile ? "px-2" : "")} layout>
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center"
              >
                {/* Logo Image */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl bg-black flex items-center justify-center mb-3 border-2 border-white/30"
                >
                  <Image
                    src={logo}
                    width={48}
                    height={48}
                    alt="Company Logo"
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.currentTarget.style.display = "none"
                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null
                      if (nextSibling) {
                        nextSibling.style.display = "flex"
                      }
                    }}
                  />
                  <span className="text-white text-2xl font-bold hidden">A</span>
                </motion.div>
                {/* Title */}
                <div>
                  <h1 className="font-bold text-gray-800 text-sm">ADMIN DASHBOARD</h1>
                  <p className="text-xs text-gray-500 mt-1">Mindspeak Uniconfess Management</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Logo */}
          {collapsed && !isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 rounded-xl overflow-hidden shadow-xl bg-black flex items-center justify-center border-2 border-white/30"
            >
              <Image
                src={logo}
                width={32}
                height={32}
                alt="Company Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = "none"
                    const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null
                    if (nextSibling) {
                      nextSibling.style.display = "flex"
                    }
                  }}
              />
              <span className="text-white text-xl font-bold hidden">A</span>
            </motion.div>
          )}
        </motion.div>

        <Separator className="mx-4 bg-white/20" />

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onHoverStart={() => setHoveredItem(item.title)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                      "group overflow-hidden",
                      collapsed && !isMobile ? "justify-center px-2" : "",
                      isActive
                        ? "bg-black text-white shadow-lg"
                        : "hover:bg-white/70 hover:shadow-md text-gray-700 hover:text-white",
                    )}
                    onClick={() => isMobile && onClose()}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-black rounded-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Hover effect */}
                    {!isActive && hoveredItem === item.title && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-white/70 rounded-xl"
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    <item.icon
                      size={20}
                      className={cn(
                        "transition-all duration-300 flex-shrink-0 relative z-10",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-black",
                        hoveredItem === item.title && !isActive ? "scale-110" : "",
                      )}
                    />

                    <AnimatePresence>
                      {(!collapsed || isMobile) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "text-sm font-medium transition-colors duration-300 relative z-10",
                            isActive ? "text-white" : "text-gray-700 group-hover:text-gray-600",
                          )}
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Notification badge for some items */}
                    {(item.title === "Notifications" || item.title === "Pending Posts") && !collapsed && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center relative z-10"
                      >
                        {item.title === "Notifications" ? "3" : "5"}
                      </motion.span>
                    )}
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </nav>
      </motion.div>
    </>
  )
}
