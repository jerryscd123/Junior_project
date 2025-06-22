"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Filter, Check, Calendar, Megaphone, Info, AlertTriangle, X } from "lucide-react"
import NotificationItem from "./notification-item"
import NotificationFilter from "./notification-filter"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useNotifications } from "@/store/hooks"
import { useAppDispatch } from "@/store/hooks"
import { 
  fetchNotifications, 
  setFilters, 
  markAllAsRead,
  clearNotifications,
  markSpecificAsRead 
} from "@/store/slices/notificationSlice"

export default function NotificationsPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)

  // Redux state
  const dispatch = useAppDispatch()
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error
  } = useNotifications()

  useEffect(() => {
    setIsVisible(true)
    // Fetch notifications from API
    dispatch(fetchNotifications({}))
  }, [dispatch])

  // Update Redux filters when local filters change
  useEffect(() => {
    const newFilters: Record<string, string | boolean | number> = {}
    
    if (activeFilter !== "all") {
      newFilters.type = activeFilter
    }
    
    if (showUnreadOnly) {
      newFilters.is_read = false
    }

    dispatch(setFilters({ ...newFilters, page: 1 }))
    dispatch(fetchNotifications(newFilters))
  }, [activeFilter, showUnreadOnly, dispatch])

  const markAsRead = (id: number) => {
    dispatch(markSpecificAsRead([id]))
  }

  const dismissNotification = (id: number) => {
    // For now, we'll mark as read instead of dismissing since the API might not support dismissing
    markAsRead(id)
  }

  const markAllAsReadHandler = () => {
    dispatch(markAllAsRead())
  }

  const clearAllNotifications = () => {
    dispatch(clearNotifications())
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    if (activeFilter !== "all") {
      filtered = filtered.filter(notification => notification.type === activeFilter)
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.is_read)
    }

    return filtered
  }

  const filteredNotifications = getFilteredNotifications()

  const filterOptions = [
    { id: "all", label: "All", icon: Bell },
    { id: "like", label: "Likes", icon: Megaphone },
    { id: "comment", label: "Comments", icon: Calendar },
    { id: "admin_message", label: "Admin Messages", icon: AlertTriangle },
    { id: "post_approved", label: "Post Updates", icon: Info },
  ]

  return (
    <div className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="inline-block px-3 py-1 bg-[#1d2b7d]/10 text-[#1d2b7d] rounded-full text-sm font-medium mb-4">
            NOTIFICATIONS
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1d2b7d] mb-4">Your Notifications</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Stay updated with important announcements, events, and alerts from Paragon University.
          </p>
        </motion.div>

        {/* Notification Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-col sm:flex-row justify-between items-center"
        >
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-[#1d2b7d]/10 p-2 rounded-full mr-3">
              <Bell className="h-5 w-5 text-[#1d2b7d]" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">You have</p>
              <p className="font-bold text-[#1d2b7d]">
                {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={markAllAsReadHandler}
              disabled={loading.markAsRead}
              className="px-3 py-1.5 text-sm font-medium text-[#1d2b7d] bg-[#1d2b7d]/10 rounded-lg hover:bg-[#1d2b7d]/20 transition-colors flex items-center disabled:opacity-50"
            >
              <Check className="h-4 w-4 mr-1" />
              {loading.markAsRead ? "Marking..." : "Mark all read"}
            </button>
            <button
              onClick={clearAllNotifications}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-red-800 font-medium">Error loading notifications</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => dispatch(fetchNotifications({}))}
                className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="md:hidden px-2 py-1 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex flex-wrap gap-2 mb-4">
            {filterOptions.map((filter, index) => (
              <NotificationFilter
                key={filter.id}
                filter={filter}
                isActive={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
                delay={index * 0.05}
              />
            ))}
          </div>

          {/* Mobile Filters Dropdown */}
          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden bg-white rounded-lg shadow-sm overflow-hidden mb-4"
              >
                <div className="p-2 grid grid-cols-2 gap-2">
                  {filterOptions.map((filter) => (
                    <NotificationFilter
                      key={filter.id}
                      filter={filter}
                      isActive={activeFilter === filter.id}
                      onClick={() => {
                        setActiveFilter(filter.id)
                        setIsFilterMenuOpen(false)
                      }}
                      delay={0}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center">
            <Switch id="unread-only" checked={showUnreadOnly} onCheckedChange={setShowUnreadOnly} className="mr-2" />
            <Label htmlFor="unread-only" className="text-sm text-slate-600">
              Show unread only
            </Label>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          {loading.fetchNotifications ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-[#1d2b7d] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">Loading notifications...</h3>
              <p className="text-slate-500">Please wait while we fetch your latest notifications</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
                delay={index * 0.05}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-700 mb-2">No notifications</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {notifications.length > 0
                  ? "No notifications match your current filters. Try adjusting your filter settings."
                  : "You don't have any notifications at the moment. Check back later for updates."}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
