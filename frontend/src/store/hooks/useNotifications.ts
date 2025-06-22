import { useAppSelector } from './index'
import { NotificationState } from '../types/notification'

/**
 * Custom hook for Notification state management
 * Provides easy access to notification state and computed values
 */
export const useNotifications = () => {
  const notificationState = useAppSelector((state) => state.notifications) as NotificationState | undefined

  // Provide default values if state is undefined
  const safeState: NotificationState = notificationState || {
    notifications: [],
    unreadCount: 0,
    pagination: null,
    filters: {
      page: 1,
      per_page: 15,
    },
    loading: {
      fetchNotifications: false,
      markAsRead: false,
      getUnreadCount: false,
    },
    error: null,
  }

  return {
    // Notification data
    notifications: safeState.notifications || [],
    unreadCount: safeState.unreadCount || 0,
    
    // Pagination
    pagination: safeState.pagination,
    
    // Filters
    filters: safeState.filters,
    
    // Loading states
    loading: safeState.loading,
    isLoading: safeState.loading?.fetchNotifications || false,
    isMarkingAsRead: safeState.loading?.markAsRead || false,
    isFetchingUnreadCount: safeState.loading?.getUnreadCount || false,
    
    // Error state
    error: safeState.error,
    
    // Computed values
    hasNotifications: (safeState.notifications || []).length > 0,
    hasUnreadNotifications: (safeState.unreadCount || 0) > 0,
    isAnyLoading: safeState.loading ? Object.values(safeState.loading).some(loading => loading) : false,
    
    // Filtered notifications
    unreadNotifications: (safeState.notifications || []).filter(notification => !notification.is_read),
    readNotifications: (safeState.notifications || []).filter(notification => notification.is_read),
    
    // Notifications by type
    getNotificationsByType: (type: string) => (safeState.notifications || []).filter(notification => notification.type === type),
    
    // Quick access to specific notification by ID
    getNotificationById: (id: number) => (safeState.notifications || []).find(notification => notification.id === id),
    
    // Pagination helpers
    hasMorePages: safeState.pagination ? safeState.pagination.current_page < safeState.pagination.last_page : false,
    currentPage: safeState.pagination?.current_page || 1,
    totalPages: safeState.pagination?.last_page || 1,
    totalNotifications: safeState.pagination?.total || 0,
  }
} 