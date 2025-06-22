"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  MessageSquare,
  Heart,
  TrendingUp,
  Search,
  Mail,
  Calendar,
  MoreHorizontal,
  UserCheck,
  Activity,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Shield,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TypingAnimation } from "@/components/magicui/typing-animation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { 
  fetchDashboardOverview, 
  fetchAllUsers,
  setUserFilters,
  updateUser,
  deleteUser
} from "@/store/slices/adminSlice"

interface User {
  id: number
  name: string
  email: string
  avatar: string
  totalLikes: number
  totalComments: number
  totalPosts: number
  joinDate: string
  status: "active" | "inactive" | "banned"
}

export default function UserManagementPage() {
  const dispatch = useAppDispatch()
  const {
    dashboardOverview,
    allUsers,
    pagination,
    loading,
    error
  } = useAppSelector((state) => state.admin)

  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'email'>("created_at")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  useEffect(() => {
    setMounted(true)
    dispatch(fetchDashboardOverview())
    dispatch(fetchAllUsers({ page: 1, per_page: itemsPerPage }))
  }, [dispatch, itemsPerPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setUserFilters({
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page: currentPage,
        per_page: itemsPerPage,
      }))
      
      dispatch(fetchAllUsers({
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page: currentPage,
        per_page: itemsPerPage,
      }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, sortBy, currentPage, dispatch, itemsPerPage])

  const users: User[] = useMemo(() => {
    return allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || "/placeholder.svg?height=40&width=40",
      totalLikes: user.statistics?.total_likes_received || 0,
      totalComments: user.statistics?.total_comments || 0,
      totalPosts: user.statistics?.total_posts || 0,
      joinDate: user.created_at,
      status: user.role === 'admin' ? 'active' : 'active'
    }))
  }, [allUsers])

  const userStats = useMemo(() => {
    if (!dashboardOverview) {
      return {
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        userGrowth: 0,
      }
    }
    return {
      totalUsers: dashboardOverview.total_users,
      newUsers: dashboardOverview.new_users_last_week,
      activeUsers: dashboardOverview.total_users,
      userGrowth: 12.5,
    }
  }, [dashboardOverview])

  const totalPages = pagination.allUsers?.last_page || 1

  const handleUserAction = async (userId: number, action: string) => {
    try {
      switch (action) {
        case "makeAdmin":
          await dispatch(updateUser({ 
            userId, 
            role: 'admin' 
          })).unwrap();
          break;
        case "delete":
          await dispatch(deleteUser(userId)).unwrap();
          break;
        default:
          console.log(`Action ${action} not implemented for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error performing ${action} on user ${userId}:`, error);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (!mounted) return null

  if (loading.fetchDashboardOverview || loading.fetchAllUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-lg font-medium text-slate-600">Loading user management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-lg font-medium">Error loading user data</div>
          <p className="text-slate-600">{error}</p>
          <Button 
            onClick={() => {
              dispatch(fetchDashboardOverview())
              dispatch(fetchAllUsers({ page: 1, per_page: itemsPerPage }))
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 md:mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </motion.div>
                <TypingAnimation className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-black bg-clip-text text-transparent">
                  User Management Hub
                </TypingAnimation>
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex items-center gap-2 text-slate-600"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm font-medium">Live Data • Updated 2 minutes ago</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <RefreshCw size={12} className="text-slate-400" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 md:mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-3 md:p-4 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg">
                  <Users size={16} className="md:w-5 md:h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1 font-medium">Total Users</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-2xl font-bold text-slate-800">
                    {userStats.totalUsers.toLocaleString()}
                  </span>
                  <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                    <TrendingUp size={8} />+{userStats.userGrowth}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-4 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl shadow-lg">
                  <UserCheck size={16} className="md:w-5 md:h-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1 font-medium">Active Users</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-2xl font-bold text-slate-800">
                    {userStats.activeUsers.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-4 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-lg">
                  <TrendingUp size={16} className="md:w-5 md:h-5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1 font-medium">New This Week</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-2xl font-bold text-slate-800">
                    {userStats.newUsers.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-4 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="p-2 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl shadow-lg">
                  <Activity size={16} className="md:w-5 md:h-5 text-rose-600" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1 font-medium">Avg Engagement</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-2xl font-bold text-slate-800">
                    {Math.round(users.reduce((sum, user) => sum + user.totalLikes + user.totalComments, 0) / users.length || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-3 mb-3 md:mb-4 bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-white/20 focus:bg-white/80 transition-all duration-300 text-sm h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Select 
                  value={sortBy} 
                  onValueChange={(value: string) => setSortBy(value as 'created_at' | 'name' | 'email')}
                >
                  <SelectTrigger className="w-full sm:w-36 bg-white/50 border-white/20 text-sm h-9">
                    <ArrowUpDown size={14} className="mr-1" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest First</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="email">Email (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-28 bg-white/50 border-white/20 text-sm h-9">
                    <Filter size={14} className="mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-xl border-white/30 shadow-2xl overflow-hidden">
          <div className="block lg:hidden">
            <div className="p-3 space-y-3">
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <motion.input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                            }
                          }}
                          className="rounded border-slate-300 w-4 h-4"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        />
                        <Avatar className="w-12 h-12 ring-2 ring-white/60 shadow-lg">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white font-bold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{user.email}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={10} />
                            Joined {new Date(user.joinDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 h-8 w-8 rounded-full">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "makeAdmin")}>
                            <Shield size={14} className="mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "delete")} className="text-red-700">
                            <Trash2 size={14} className="mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-3 border border-pink-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart size={12} className="text-pink-600" />
                          <span className="text-xs font-semibold text-slate-700">Likes</span>
                        </div>
                        <span className="text-lg font-bold text-slate-800">{user.totalLikes.toLocaleString()}</span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={12} className="text-blue-600" />
                          <span className="text-xs font-semibold text-slate-700">Comments</span>
                        </div>
                        <span className="text-lg font-bold text-slate-800">
                          {user.totalComments.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl px-3 py-2 border border-purple-100">
                        <span className="text-xs text-slate-600 font-medium">Posts: </span>
                        <span className="text-sm font-bold text-slate-800">{user.totalPosts}</span>
                      </div>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "default"
                            : user.status === "inactive"
                              ? "secondary"
                              : "destructive"
                        }
                        className="capitalize font-semibold text-xs px-2 py-1"
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:block p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">
                      <Input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map((u) => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                        className="rounded border-slate-300 w-4 h-4"
                      />
                    </th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">User</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Contact</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Likes</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Comments</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Posts</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Status</th>
                    <th className="text-left py-3 px-3 font-bold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 transition-all duration-300"
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id])
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                              }
                            }}
                            className="rounded border-slate-300 w-4 h-4"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 ring-2 ring-white/60 shadow-lg">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white font-bold text-sm">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                              <Mail size={12} className="text-slate-500" />
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar size={10} />
                              {new Date(user.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-rose-100 rounded-xl px-3 py-2 border border-pink-200">
                            <Heart size={12} className="text-pink-600" />
                            <span className="font-bold text-slate-800 text-sm">
                              {user.totalLikes.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl px-3 py-2 border border-blue-200">
                            <MessageSquare size={12} className="text-blue-600" />
                            <span className="font-bold text-slate-800 text-sm">
                              {user.totalComments.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-xl px-3 py-2 text-center border border-purple-200">
                            <span className="font-bold text-slate-800 text-sm">{user.totalPosts}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "inactive"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="capitalize font-bold text-xs px-3 py-1"
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-slate-100 rounded-full h-8 w-8"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "makeAdmin")}>
                                <Shield size={14} className="mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "delete")} className="text-red-700">
                                <Trash2 size={14} className="mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 md:p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs md:text-sm text-slate-600 font-medium">
              {pagination.allUsers ? (
                <>
                  Showing {pagination.allUsers.from} to{" "}
                  {pagination.allUsers.to} of {pagination.allUsers.total} users
                </>
              ) : (
                `Showing ${users.length} users`
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading.fetchAllUsers}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 hover:from-purple-700 hover:to-blue-700 font-semibold px-3 h-8 text-xs transition-all duration-300 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {pagination.allUsers && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={loading.fetchAllUsers}
                      className={`w-8 h-8 p-0 text-xs font-bold transition-all duration-300 ${
                        currentPage === page
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 shadow-lg"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading.fetchAllUsers}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 hover:from-purple-700 hover:to-blue-700 font-semibold px-3 h-8 text-xs transition-all duration-300 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500"
              >
                Next
              </Button>
            </div>
          </motion.div>
        </Card>
      </div>
    </div>
  )
} 