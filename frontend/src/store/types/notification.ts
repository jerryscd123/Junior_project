// Notification Model
export interface Notification {
  id: number;
  type: 'like' | 'comment' | 'admin_message' | 'post_approved' | 'post_rejected' | 'comment_approved' | 'comment_rejected';
  title: string;
  message: string;
  data: NotificationData;
  url: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Notification data structure based on type
export interface NotificationData {
  message?: string;
  post_id?: number;
  post_title?: string;
  comment_id?: number;
  user_name?: string;
  user_avatar?: string;
  message_id?: number;
  subject?: string;
  content?: string;
  admin_note?: string;
}

// Redux State Interface
export interface NotificationState {
  // Notification lists
  notifications: Notification[];
  unreadCount: number;
  
  // Pagination
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  } | null;
  
  // Filters
  filters: {
    is_read?: boolean;
    type?: string;
    sort?: string;
    page: number;
    per_page: number;
  };
  
  // Loading states
  loading: {
    fetchNotifications: boolean;
    markAsRead: boolean;
    getUnreadCount: boolean;
  };
  
  // Error handling
  error: string | null;
}

// API Request/Response Types
export interface GetNotificationsParams {
  page?: number;
  per_page?: number;
  is_read?: boolean;
  type?: string;
  sort?: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
  meta: {
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
      has_more_pages: boolean;
    };
    unread_count: number;
    filters: {
      type: string | null;
      is_read: boolean | null;
      sort: string;
    };
  };
}

export interface MarkReadPayload {
  notification_ids?: number[];
  mark_all?: boolean;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  data: {
    marked_count: number;
    unread_count: number;
  };
}

// Action Payload Types
export interface SetNotificationFiltersPayload {
  is_read?: boolean;
  type?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface UpdateNotificationReadStatusPayload {
  notification_ids: number[];
  is_read: boolean;
}

// UI Types
export interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onMarkAsUnread?: (id: number) => void;
}

export interface NotificationFiltersProps {
  filters: NotificationState['filters'];
  onFiltersChange: (filters: Partial<NotificationState['filters']>) => void;
  loading?: boolean;
}

export interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onMarkAsRead?: (ids: number[]) => void;
  onMarkAllAsRead?: () => void;
}

// Initial state
export const initialNotificationState: NotificationState = {
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
}; 