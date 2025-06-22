"use client";

import React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  User,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import CreateNotificationModal from "./create-notification-modal";
import { TypingAnimation } from "@/components/magicui/typing-animation";

// Redux imports
import { useNotifications } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { 
  fetchNotifications, 
  setFilters, 
  markAllAsRead,
  clearNotifications,
  markSpecificAsRead,
  loadMoreNotifications
} from "@/store/slices/notificationSlice";

export default function AdminNotificationDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<
    Set<number>
  >(new Set());
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<number>
  >(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Redux state
  const dispatch = useAppDispatch();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    hasMorePages,
    filters: reduxFilters
  } = useNotifications();

  type NotificationType =
    | "like" 
    | "comment" 
    | "admin_message" 
    | "post_approved" 
    | "post_rejected" 
    | "comment_approved" 
    | "comment_rejected";

  useEffect(() => {
    setIsVisible(true);
    // Fetch notifications from API
    dispatch(fetchNotifications({}));
  }, [dispatch]);

  // Update Redux filters when local filters change
  useEffect(() => {
    const newFilters: Record<string, unknown> = {}
    
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
    dispatch(markSpecificAsRead([id]));
  };

  const markAllNotificationsAsRead = () => {
    dispatch(markAllAsRead());
  };

  const clearAll = () => {
    dispatch(clearNotifications());
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotifications(newExpanded);
  };

  const toggleSelectNotification = (id: number) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply active filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(notification => notification.type === activeFilter);
    }

    // Apply unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.is_read);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query) ||
        notification.data?.user_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const loadMore = () => {
    if (hasMorePages && !loading.fetchNotifications) {
      dispatch(loadMoreNotifications(reduxFilters));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <TrendingUp className="h-4 w-4" />;
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "admin_message":
        return <AlertTriangle className="h-4 w-4" />;
      case "post_approved":
      case "comment_approved":
        return <Check className="h-4 w-4" />;
      case "post_rejected":
      case "comment_rejected":
        return <X className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "like":
        return "bg-green-100 text-green-700";
      case "comment":
        return "bg-blue-100 text-blue-700";
      case "admin_message":
        return "bg-red-100 text-red-700";
      case "post_approved":
      case "comment_approved":
        return "bg-emerald-100 text-emerald-700";
      case "post_rejected":
      case "comment_rejected":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const truncateMessage = (message: string, maxLength = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  // Filter options for admin notifications
  const filterOptions = [
    { id: "all", label: "All", icon: Bell },
    { id: "like", label: "Likes", icon: TrendingUp },
    { id: "comment", label: "Comments", icon: MessageSquare },
    { id: "admin_message", label: "Admin Messages", icon: AlertTriangle },
    { id: "post_approved", label: "Approved Posts", icon: Check },
    { id: "post_rejected", label: "Rejected Posts", icon: X },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-6">
            <Bell className="h-6 w-6 text-blue-600" />
            <TypingAnimation
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Admin Notification Dashboard
            </TypingAnimation>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage and monitor all user notifications, system alerts, and
            administrative messages in one centralized dashboard.
          </p>
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

        {/* Notification Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">You have</p>
                <p className="text-lg font-semibold text-blue-900">
                  {unreadCount} unread notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={markAllNotificationsAsRead}
                disabled={loading.markAsRead}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-green-500 bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {loading.markAsRead ? "Marking..." : "Mark all read"}
              </Button>
              <Button
                onClick={clearAll}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-red-700 bg-red-600"
              >
                <X className="h-4 w-4 mr-2" />
                Clear all
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Filters
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {filterOptions.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    variant={activeFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      activeFilter === filter.id
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-500 bg-gray-300 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            {/* Show unread only toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-unread"
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-yellow-400 text-white"
              />
              <Label
                htmlFor="show-unread"
                className="text-sm font-medium text-gray-700"
              >
                Show unread only
              </Label>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search for a notification"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-700 border-gray-200"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading.fetchNotifications && filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </motion.div>
        )}

        {/* No Notifications State */}
        {!loading.fetchNotifications && filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || showUnreadOnly || activeFilter !== "all" 
                ? "Try adjusting your filters or search query."
                : "No notifications to display at the moment."}
            </p>
            {(searchQuery || showUnreadOnly || activeFilter !== "all") && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setShowUnreadOnly(false);
                  setActiveFilter("all");
                }}
                variant="outline"
                size="sm"
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Notifications Table */}
        {filteredNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 w-12">
                        <Checkbox
                          checked={
                            filteredNotifications.length > 0 &&
                            selectedNotifications.size ===
                              filteredNotifications.length
                          }
                          onCheckedChange={toggleSelectAll}
                          className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
                        />
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        User Email
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <tr
                          className={`hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? "bg-blue-50/30" : ""
                          } ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={selectedNotifications.has(notification.id)}
                              onCheckedChange={() =>
                                toggleSelectNotification(notification.id)
                              }
                              className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {notification.data?.user_name ? `${notification.data.user_name}@university.edu` : "system@university.edu"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${getTypeColor(notification.type as NotificationType)}`}>
                                {getTypeIcon(notification.type as NotificationType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium text-sm ${
                                    notification.is_read
                                      ? "text-gray-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {notification.title || notification.data?.message || "Untitled notification"}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                                  {truncateMessage(notification.message)}
                                </div>
                                {/* Content Indicators */}
                                <div className="flex items-center gap-1 mt-2">
                                  {notification.url && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                      <LinkIcon className="h-3 w-3" />
                                      <span>Link</span>
                                    </div>
                                  )}
                                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type as NotificationType)}`}>
                                    {getTypeIcon(notification.type as NotificationType)}
                                    <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {notification.data?.user_name || "System"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(notification.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            {notification.is_read ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 rounded-full px-3 py-1">
                                Read
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 rounded-full px-3 py-1">
                                Unread
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => toggleExpanded(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-sm font-medium flex items-center gap-1 rounded-lg px-3 py-2"
                              >
                                View details
                                {expandedNotifications.has(notification.id) ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </Button>
                              {!notification.is_read && (
                                <Button
                                  onClick={() => markAsRead(notification.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        <AnimatePresence>
                          {expandedNotifications.has(notification.id) && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td
                                colSpan={7}
                                className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200"
                              >
                                <div className="space-y-4">
                                  {/* Notification Details */}
                                  <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-900 mb-2">Notification Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-700">ID:</span>
                                        <span className="ml-2 text-gray-600">#{notification.id}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-700">Type:</span>
                                        <span className="ml-2 text-gray-600 capitalize">{notification.type.replace('_', ' ')}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-700">Created:</span>
                                        <span className="ml-2 text-gray-600">{formatFullDate(notification.created_at)}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <span className={`ml-2 ${notification.is_read ? 'text-green-600' : 'text-blue-600'}`}>
                                          {notification.is_read ? 'Read' : 'Unread'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Message Content */}
                                  <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                      {notification.message}
                                    </p>
                                  </div>

                                  {/* User Info */}
                                  {notification.data?.user_name && (
                                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                      <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 ring-2 ring-blue-200">
                                          <AvatarImage
                                            src={notification.data?.user_avatar || "/placeholder.svg"}
                                          />
                                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                            {notification.data.user_name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <span className="font-semibold text-gray-900">
                                              {notification.data.user_name}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {notification.data.user_name}@university.edu
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Additional Data */}
                                  {notification.data && Object.keys(notification.data).length > 0 && (
                                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                                      <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {notification.data.post_id && (
                                          <div>
                                            <span className="font-medium text-gray-700">Post ID:</span>
                                            <span className="ml-2 text-gray-600">#{notification.data.post_id}</span>
                                          </div>
                                        )}
                                        {notification.data.post_title && (
                                          <div>
                                            <span className="font-medium text-gray-700">Post Title:</span>
                                            <span className="ml-2 text-gray-600">{notification.data.post_title}</span>
                                          </div>
                                        )}
                                        {notification.data.comment_id && (
                                          <div>
                                            <span className="font-medium text-gray-700">Comment ID:</span>
                                            <span className="ml-2 text-gray-600">#{notification.data.comment_id}</span>
                                          </div>
                                        )}
                                        {notification.data.admin_note && (
                                          <div className="md:col-span-2">
                                            <span className="font-medium text-gray-700">Admin Note:</span>
                                            <div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                              <p className="text-orange-800 text-sm">{notification.data.admin_note}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex justify-end gap-3">
                                    {notification.url && (
                                      <a
                                        href={notification.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                      >
                                        <LinkIcon className="h-4 w-4" />
                                        View Source
                                      </a>
                                    )}
                                    {!notification.is_read && (
                                      <Button
                                        onClick={() => markAsRead(notification.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        size="sm"
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as Read
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {hasMorePages && (
                <div className="p-4 border-t border-gray-200">
                  <Button
                    onClick={loadMore}
                    disabled={loading.fetchNotifications}
                    variant="outline"
                    className="w-full"
                  >
                    {loading.fetchNotifications ? "Loading..." : "Load More Notifications"}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Create Notification Modal */}
        <CreateNotificationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onNotificationSent={() => {
            // Implement the logic to send the notification to the backend
            // and update the notifications state
            setIsCreateModalOpen(false);
          }}
        />
      </div>
    </div>
  );
}
