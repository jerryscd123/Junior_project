"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Menu,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import logo from "@/assets/admin.png";
import { TypingAnimation } from "./magicui/typing-animation";
// Redux imports
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
// Notification Redux imports
import { useNotifications } from "@/store/hooks";
import { fetchNotifications, markAllAsRead, fetchUnreadCount } from "@/store/slices/notificationSlice";

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
  sidebarCollapsed: boolean;
}

export function Navbar({
  onMenuClick,
  isMobile,
  sidebarCollapsed,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Notification Redux hooks
  const { notifications, unreadCount, isLoading: notificationsLoading } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (user) {
      console.log("🔔 Admin Navbar: Fetching notifications for admin user");
      dispatch(fetchNotifications({ page: 1, per_page: 10 }));
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log("🚪 Admin Navbar: Starting logout process");
      await dispatch(logoutUser()).unwrap();
      console.log("✅ Admin Navbar: Logout successful, redirecting to home");
      router.push("/");
    } catch (error) {
      console.error("❌ Admin Navbar: Logout failed", error);
      // Still redirect to home even if logout fails on server
      router.push("/");
    }
  };

  // Handle mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      console.log("🔔 Admin Navbar: Marking all notifications as read");
      await dispatch(markAllAsRead()).unwrap();
      console.log("✅ Admin Navbar: All notifications marked as read");
      // Refresh notifications and unread count
      dispatch(fetchNotifications({ page: 1, per_page: 10 }));
      dispatch(fetchUnreadCount());
    } catch (error) {
      console.error("❌ Admin Navbar: Failed to mark all notifications as read", error);
    }
  };

  // Get user display name and initials
  const getUserDisplayName = () => {
    if (!user) return "Admin"
    return user.name || "Admin"
  }

  const getUserInitials = () => {
    if (!user || !user.name) return "A"
    const names = user.name.split(" ")
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Format notification time
  const formatNotificationTime = (createdAt: string) => {
    const now = new Date()
    const notificationTime = new Date(createdAt)
    const diffInMs = now.getTime() - notificationTime.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    return notificationTime.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-black/70 backdrop-blur-xl border-b border-white/20 px-4 lg:px-8",
        scrolled ? "shadow-md" : "",
        isMobile ? "pl-4" : sidebarCollapsed ? "pl-24" : "pl-[288px]"
      )}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu size={20} />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Image src={logo} alt="Admin Logo" width={24} height={24} />
            </div>
            <TypingAnimation className="font-bold text-gray-800 dark:text-gray-200 text-sm">
              ADMIN DASHBOARD
            </TypingAnimation>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative bg-white/70 dark:bg-black/50 backdrop-blur-sm shadow-lg hover:bg-white/90 dark:hover:bg-black/70 transition-all duration-300 rounded-xl border border-white/30"
              >
                <Bell size={18} className="text-gray-600 dark:text-gray-200" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-lg"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 bg-white/90 dark:bg-zinc-900 backdrop-blur-xl border border-white/30 shadow-2xl rounded-xl p-0"
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <DropdownMenuLabel className="text-base font-semibold m-0 text-gray-900 dark:text-gray-100">
                  Notifications
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 text-xs text-[#1d2b7d] dark:text-blue-400 hover:text-[#1d2b7d]/80 dark:hover:text-blue-300 hover:bg-[#1d2b7d]/10 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800/50 last:border-0",
                        !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10",
                      )}
                    >
                      {notification.data.user_avatar ? (
                        <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          <AvatarImage src={notification.data.user_avatar || "/placeholder.svg"} alt="User" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                            notification.is_read
                              ? "bg-gray-100 dark:bg-gray-800"
                              : "bg-[#1d2b7d]/10 dark:bg-blue-900/20",
                          )}
                        >
                          <Bell
                            className={cn(
                              "h-4 w-4",
                              notification.is_read
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-[#1d2b7d] dark:text-blue-400",
                            )}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              notification.is_read
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-900 dark:text-white",
                            )}
                          >
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                            {formatNotificationTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {notificationsLoading ? "Loading notifications..." : "No notifications"}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="ghost"
                  className="w-full text-[#1d2b7d] dark:text-blue-400 hover:text-[#1d2b7d]/80 dark:hover:text-blue-300 hover:bg-[#1d2b7d]/10 dark:hover:bg-blue-900/20 text-sm font-medium transition-colors"
                >
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-auto px-3 bg-white/70 dark:bg-black/50 backdrop-blur-sm shadow-lg hover:bg-white/90 dark:hover:bg-black/70 transition-all duration-300 rounded-xl border border-white/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-10 ring-2 ring-white/50">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-[#1d2b7d] text-white dark:bg-blue-900">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 ml-1" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 bg-white/90 dark:bg-zinc-900 backdrop-blur-xl border border-white/30 shadow-2xl rounded-xl"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal px-4 py-3 text-gray-800 dark:text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              {/* Dark Mode Toggle */}
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="px-4 py-3 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg mx-2 my-1"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-3 h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-3 h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/30" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 focus:text-red-600 rounded-lg mx-2 my-1"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}